package org.example.capstone.ingestion;

import org.example.capstone.ingestion.source.SourcePlayer;
import org.example.capstone.ingestion.source.SourcePlayerPage;
import org.example.capstone.ingestion.source.SourceStat;
import org.example.capstone.league.League;
import org.example.capstone.player.Player;
import org.example.capstone.player.PlayerRepository;
import org.example.capstone.stats.PlayerSeasonStat;
import org.example.capstone.stats.PlayerSeasonStatRepository;
import org.example.capstone.stats.StatsProperties;
import org.example.capstone.team.Team;
import org.example.capstone.team.TeamRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Salva una pagina di risultati e l'avanzamento del task nella stessa transazione:
 * se qualcosa va storto la pagina non risulta importata e verrà riprovata.
 * L'operazione è idempotente (upsert su api_id e sulla chiave giocatore/squadra/campionato/stagione).
 */
@Component
public class PagePersister {

    /** Il piano Free di API-Football non serve pagine oltre la 3 (le rose più lunghe si fermano lì). */
    static final int MAX_PAGE = 3;

    private final int minMinutes;
    private final ImportTaskRepository tasks;
    private final PlayerRepository players;
    private final TeamRepository teams;
    private final PlayerSeasonStatRepository stats;

    public PagePersister(ImportTaskRepository tasks, PlayerRepository players, TeamRepository teams,
                         PlayerSeasonStatRepository stats, StatsProperties statsProperties) {
        this.minMinutes = statsProperties.minMinutes();
        this.tasks = tasks;
        this.players = players;
        this.teams = teams;
        this.stats = stats;
    }

    @Transactional
    public TaskStatus persistPage(Long taskId, SourcePlayerPage page) {
        ImportTask task = tasks.findById(taskId).orElseThrow();
        League league = task.getLeague();
        Instant now = Instant.now();

        int saved = 0;
        for (SourcePlayer source : page.players()) {
            List<SourceStat> usable = usableStats(source, league);
            if (usable.isEmpty()) {
                continue; // giocatore con meno minuti della soglia: non si salva
            }
            Player player = upsertPlayer(source, usable, now);
            for (SourceStat stat : usable) {
                upsertStat(player, league, task.getSeason(), stat, now);
            }
            saved++;
        }

        task.setNextPage(page.page() + 1);
        task.setTotalPages(page.totalPages());
        task.setPlayersImported(task.getPlayersImported() + saved);
        task.setStatus(page.page() >= Math.min(page.totalPages(), MAX_PAGE) ? TaskStatus.DONE : TaskStatus.IN_PROGRESS);
        task.setLastError(null);
        task.setUpdatedAt(now);
        return task.getStatus();
    }

    /** Crea un task per ogni squadra del campionato e chiude il task "elenco squadre". */
    @Transactional
    public void persistTeams(Long taskId, List<Integer> teamApiIds) {
        ImportTask discovery = tasks.findById(taskId).orElseThrow();
        for (Integer teamApiId : teamApiIds) {
            if (!tasks.existsByLeagueIdAndSeasonAndTeamApiId(discovery.getLeague().getId(), discovery.getSeason(), teamApiId)) {
                ImportTask team = new ImportTask();
                team.setLeague(discovery.getLeague());
                team.setSeason(discovery.getSeason());
                team.setTeamApiId(teamApiId);
                tasks.save(team);
            }
        }
        discovery.setStatus(TaskStatus.DONE);
        discovery.setLastError(null);
        discovery.setUpdatedAt(Instant.now());
    }

    /** Chiude un task che ha già raggiunto l'ultima pagina servita dal piano Free. */
    @Transactional
    public void markDone(Long taskId) {
        ImportTask task = tasks.findById(taskId).orElseThrow();
        task.setStatus(TaskStatus.DONE);
        task.setLastError(null);
        task.setUpdatedAt(Instant.now());
    }

    @Transactional
    public void markError(Long taskId, String message) {
        ImportTask task = tasks.findById(taskId).orElseThrow();
        task.setLastError(message != null && message.length() > 500 ? message.substring(0, 500) : message);
        task.setUpdatedAt(Instant.now());
    }

    /** Solo statistiche del campionato richiesto, con almeno i minuti minimi (scoutai.stats.min-minutes), una per squadra. */
    private List<SourceStat> usableStats(SourcePlayer source, League league) {
        Map<Integer, SourceStat> byTeam = new LinkedHashMap<>();
        for (SourceStat s : source.stats()) {
            boolean sameLeague = league.getApiId().equals(s.leagueApiId());
            if (sameLeague && s.minutes() != null && s.minutes() >= minMinutes) {
                byTeam.putIfAbsent(s.teamApiId(), s);
            }
        }
        return List.copyOf(byTeam.values());
    }

    private Player upsertPlayer(SourcePlayer source, List<SourceStat> usable, Instant now) {
        Player player = players.findByApiId(source.apiId()).orElseGet(Player::new);
        player.setApiId(source.apiId());
        player.setName(source.name());
        player.setFirstname(source.firstname());
        player.setLastname(source.lastname());
        player.setBirthDate(source.birthDate());
        player.setNationality(source.nationality());
        player.setHeightCm(source.heightCm());
        player.setWeightKg(source.weightKg());
        player.setPhotoUrl(source.photoUrl());
        usable.stream()
                .filter(s -> s.position() != null)
                .max(Comparator.comparingInt(SourceStat::minutes))
                .ifPresent(s -> player.setPosition(s.position()));
        player.setLastSyncedAt(now);
        return players.save(player);
    }

    private void upsertStat(Player player, League league, int season, SourceStat s, Instant now) {
        Team team = teams.findByApiId(s.teamApiId()).orElseGet(Team::new);
        team.setApiId(s.teamApiId());
        team.setName(s.teamName());
        team.setLogoUrl(s.teamLogoUrl());
        team = teams.save(team);

        PlayerSeasonStat entity = stats
                .findByPlayerIdAndTeamIdAndLeagueIdAndSeason(player.getId(), team.getId(), league.getId(), season)
                .orElseGet(PlayerSeasonStat::new);
        entity.setPlayer(player);
        entity.setTeam(team);
        entity.setLeague(league);
        entity.setSeason(season);
        entity.setPosition(s.position());
        entity.setAppearances(s.appearances());
        entity.setLineups(s.lineups());
        entity.setMinutes(s.minutes());
        entity.setRating(s.rating());
        entity.setGoals(s.goals());
        entity.setAssists(s.assists());
        entity.setGoalsConceded(s.goalsConceded());
        entity.setSaves(s.saves());
        entity.setShotsTotal(s.shotsTotal());
        entity.setShotsOn(s.shotsOn());
        entity.setPassesTotal(s.passesTotal());
        entity.setPassesKey(s.passesKey());
        entity.setTacklesTotal(s.tacklesTotal());
        entity.setTacklesBlocks(s.tacklesBlocks());
        entity.setTacklesInterceptions(s.tacklesInterceptions());
        entity.setDuelsTotal(s.duelsTotal());
        entity.setDuelsWon(s.duelsWon());
        entity.setDribblesAttempts(s.dribblesAttempts());
        entity.setDribblesSuccess(s.dribblesSuccess());
        entity.setFoulsDrawn(s.foulsDrawn());
        entity.setFoulsCommitted(s.foulsCommitted());
        entity.setYellowCards(s.yellowCards());
        entity.setRedCards(s.redCards());
        entity.setSyncedAt(now);
        stats.save(entity);
    }
}
