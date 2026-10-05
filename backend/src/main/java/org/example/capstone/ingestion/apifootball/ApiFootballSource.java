package org.example.capstone.ingestion.apifootball;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.ingestion.apifootball.ApiFootballDto.PlayerEntry;
import org.example.capstone.ingestion.apifootball.ApiFootballDto.PlayersEnvelope;
import org.example.capstone.ingestion.apifootball.ApiFootballDto.StatEntry;
import org.example.capstone.ingestion.quota.QuotaService;
import org.example.capstone.ingestion.source.PlayerDataSource;
import org.example.capstone.ingestion.source.SourcePlayer;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.ingestion.source.SourceStat;
import org.example.capstone.player.Position;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Client di API-Football + trasformazione nel nostro modello neutro. */
@Component
public class ApiFootballSource implements PlayerDataSource {

    private static final Pattern DIGITS = Pattern.compile("\\d+");

    private final RestClient client;
    private final QuotaService quota;
    private final boolean keyConfigured;

    public ApiFootballSource(ApiFootballProperties props, QuotaService quota) {
        this.quota = quota;
        this.keyConfigured = props.key() != null && !props.key().isBlank();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        factory.setReadTimeout(Duration.ofSeconds(30));

        this.client = RestClient.builder()
                .baseUrl(props.baseUrl())
                .defaultHeader("x-apisports-key", keyConfigured ? props.key() : "")
                .requestFactory(factory)
                .build();
    }

    @Override
    public SourcePlayerPage fetchPlayersPage(int leagueApiId, int season, int page) {
        if (!keyConfigured) {
            throw new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "API_FOOTBALL_KEY non configurata");
        }

        quota.recordRequest();
        PlayersEnvelope envelope;
        try {
            envelope = client.get()
                    .uri("/players?league={league}&season={season}&page={page}", leagueApiId, season, page)
                    .retrieve()
                    .body(PlayersEnvelope.class);
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "API-Football non raggiungibile", e);
        }
        return toPage(envelope, page);
    }

    static SourcePlayerPage toPage(PlayersEnvelope envelope, int requestedPage) {
        if (envelope == null) {
            throw new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "Risposta vuota da API-Football");
        }
        checkErrors(envelope.errors());

        int currentPage = envelope.paging() != null ? envelope.paging().current() : requestedPage;
        int totalPages = envelope.paging() != null ? envelope.paging().total() : currentPage;
        List<SourcePlayer> players = envelope.response() == null ? List.of()
                : envelope.response().stream().map(ApiFootballSource::toPlayer).toList();
        return new SourcePlayerPage(currentPage, totalPages, players);
    }

    /** API-Football risponde 200 anche in caso di errore: lo segnala nel campo "errors". */
    private static void checkErrors(Object errors) {
        if (!(errors instanceof Map<?, ?> map) || map.isEmpty()) {
            return;
        }
        String message = String.join("; ", map.values().stream().map(String::valueOf).toList());
        if (map.containsKey("requests") || map.containsKey("rateLimit")) {
            throw new ApiException(ErrorCode.QUOTA_EXCEEDED, "Quota API-Football esaurita: " + message);
        }
        throw new ApiException(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR, "API-Football: " + message);
    }

    private static SourcePlayer toPlayer(PlayerEntry entry) {
        ApiFootballDto.PlayerInfo p = entry.player();
        List<SourceStat> stats = entry.statistics() == null ? List.of()
                : entry.statistics().stream().map(ApiFootballSource::toStat).toList();
        return new SourcePlayer(
                p.id(), p.name(), p.firstname(), p.lastname(),
                parseDate(p.birth() == null ? null : p.birth().date()),
                p.nationality(), parseInt(p.height()), parseInt(p.weight()), p.photo(), stats);
    }

    private static SourceStat toStat(StatEntry s) {
        ApiFootballDto.Games g = orElse(s.games(), new ApiFootballDto.Games(null, null, null, null, null));
        ApiFootballDto.Shots sh = orElse(s.shots(), new ApiFootballDto.Shots(null, null));
        ApiFootballDto.Goals go = orElse(s.goals(), new ApiFootballDto.Goals(null, null, null, null));
        ApiFootballDto.Passes pa = orElse(s.passes(), new ApiFootballDto.Passes(null, null));
        ApiFootballDto.Tackles ta = orElse(s.tackles(), new ApiFootballDto.Tackles(null, null, null));
        ApiFootballDto.Duels du = orElse(s.duels(), new ApiFootballDto.Duels(null, null));
        ApiFootballDto.Dribbles dr = orElse(s.dribbles(), new ApiFootballDto.Dribbles(null, null));
        ApiFootballDto.Fouls fo = orElse(s.fouls(), new ApiFootballDto.Fouls(null, null));
        ApiFootballDto.Cards ca = orElse(s.cards(), new ApiFootballDto.Cards(null, null));

        return new SourceStat(
                s.league() == null || s.league().id() == null ? -1 : s.league().id(),
                s.team().id(), s.team().name(), s.team().logo(),
                Position.fromApi(g.position()),
                g.appearences(), g.lineups(), g.minutes(), parseRating(g.rating()),
                go.total(), go.assists(), go.conceded(), go.saves(),
                sh.total(), sh.on(), pa.total(), pa.key(),
                ta.total(), ta.blocks(), ta.interceptions(),
                du.total(), du.won(), dr.attempts(), dr.success(),
                fo.drawn(), fo.committed(), ca.yellow(), ca.red());
    }

    private static <T> T orElse(T value, T fallback) {
        return value != null ? value : fallback;
    }

    private static LocalDate parseDate(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /** Altezza e peso arrivano come testo ("177" o "177 cm"): si estrae il primo numero. */
    static Integer parseInt(String value) {
        if (value == null) {
            return null;
        }
        Matcher m = DIGITS.matcher(value);
        return m.find() ? Integer.valueOf(m.group()) : null;
    }

    private static BigDecimal parseRating(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
