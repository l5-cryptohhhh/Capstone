package org.example.capstone.ingestion.apifootball;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.example.capstone.ingestion.apifootball.ApiFootballDto.PlayersEnvelope;
import org.example.capstone.ingestion.source.SourcePlayer;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.ingestion.source.SourceStat;
import org.example.capstone.player.Position;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApiFootballSourceMappingTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    private PlayersEnvelope fixture() throws Exception {
        try (InputStream in = getClass().getResourceAsStream("/fixtures/players-page.json")) {
            return mapper.readValue(in, PlayersEnvelope.class);
        }
    }

    @Test
    void mapsPlayerAndStatsFromRealResponse() throws Exception {
        SourcePlayerPage page = ApiFootballSource.toPage(fixture(), 1);

        assertThat(page.page()).isEqualTo(1);
        assertThat(page.totalPages()).isEqualTo(54);
        assertThat(page.players()).hasSize(3);

        SourcePlayer pulisic = page.players().get(0);
        assertThat(pulisic.apiId()).isEqualTo(17);
        assertThat(pulisic.birthDate()).isEqualTo(LocalDate.of(1998, 9, 18));
        assertThat(pulisic.heightCm()).isEqualTo(177);
        assertThat(pulisic.weightKg()).isEqualTo(73);

        SourceStat stat = pulisic.stats().get(0);
        assertThat(stat.leagueApiId()).isEqualTo(135);
        assertThat(stat.teamApiId()).isEqualTo(489);
        assertThat(stat.position()).isEqualTo(Position.MID);
        assertThat(stat.appearances()).isEqualTo(36); // campo "appearences" nell'API
        assertThat(stat.minutes()).isEqualTo(2619);
        assertThat(stat.rating()).isEqualByComparingTo(new BigDecimal("7.24"));
        assertThat(stat.tacklesInterceptions()).isEqualTo(10);
        assertThat(stat.dribblesSuccess()).isEqualTo(47);
    }

    @Test
    void missingValuesStayNullInsteadOfZero() throws Exception {
        SourceStat stat = ApiFootballSource.toPage(fixture(), 1).players().get(0).stats().get(0);

        assertThat(stat.saves()).isNull();
    }

    @Test
    void keepsAllStatsOfAPlayerWhoChangedTeam() throws Exception {
        SourcePlayer transferred = ApiFootballSource.toPage(fixture(), 1).players().get(2);

        assertThat(transferred.stats()).hasSize(2);
    }

    @Test
    void parseIntExtractsFirstNumber() {
        assertThat(ApiFootballSource.parseInt("177 cm")).isEqualTo(177);
        assertThat(ApiFootballSource.parseInt("73")).isEqualTo(73);
        assertThat(ApiFootballSource.parseInt(null)).isNull();
        assertThat(ApiFootballSource.parseInt("n/d")).isNull();
    }

    @Test
    void quotaErrorInBodyBecomesQuotaExceeded() {
        PlayersEnvelope envelope = new PlayersEnvelope(
                Map.of("requests", "You have reached the request limit for the day"), null, null);

        assertThatThrownBy(() -> ApiFootballSource.toPage(envelope, 1))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED));
    }

    @Test
    void planErrorInBodyBecomesUpstreamError() {
        PlayersEnvelope envelope = new PlayersEnvelope(
                Map.of("plan", "Free plans do not have access to this season"), null, null);

        assertThatThrownBy(() -> ApiFootballSource.toPage(envelope, 1))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.UPSTREAM_FOOTBALL_API_ERROR));
    }

    @Test
    void emptyErrorsArrayIsNotAnError() {
        PlayersEnvelope envelope = new PlayersEnvelope(List.of(), new ApiFootballDto.Paging(1, 1), List.of());

        assertThat(ApiFootballSource.toPage(envelope, 1).players()).isEmpty();
    }
}
