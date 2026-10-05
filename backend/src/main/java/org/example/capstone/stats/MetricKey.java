package org.example.capstone.stats;

import org.example.capstone.player.Position;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

/**
 * Catalogo di tutte le metriche interrogabili. È l'unica whitelist: filtri, ordinamenti e (più avanti)
 * i criteri generati dall'AI possono riferirsi solo a metriche definite qui.
 * Ogni metrica sa calcolarsi da una riga di statistiche; restituisce null quando il dato non è sufficiente.
 */
public enum MetricKey {

    GOALS_P90("goals_p90", "Gol per 90'", "Gol segnati ogni 90 minuti", MetricUnit.PER_90, true, OUTFIELD(),
            s -> per90(s.getGoals(), s)),
    ASSISTS_P90("assists_p90", "Assist per 90'", "Assist ogni 90 minuti", MetricUnit.PER_90, true, OUTFIELD(),
            s -> per90(s.getAssists(), s)),
    SHOTS_P90("shots_p90", "Tiri per 90'", "Tiri totali ogni 90 minuti", MetricUnit.PER_90, true, OUTFIELD(),
            s -> per90(s.getShotsTotal(), s)),
    SHOTS_ON_TARGET_P90("shots_on_target_p90", "Tiri in porta per 90'", "Tiri nello specchio ogni 90 minuti",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(s.getShotsOn(), s)),
    KEY_PASSES_P90("key_passes_p90", "Passaggi chiave per 90'", "Passaggi che portano a un tiro, ogni 90 minuti",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(s.getPassesKey(), s)),
    PASSES_P90("passes_p90", "Passaggi per 90'", "Passaggi totali ogni 90 minuti (volume di gioco)",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(s.getPassesTotal(), s)),
    DEF_ACTIONS_P90("def_actions_p90", "Palloni recuperati per 90'", "Contrasti più intercetti ogni 90 minuti",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(sum(s.getTacklesTotal(), s.getTacklesInterceptions()), s)),
    BLOCKS_P90("blocks_p90", "Blocchi per 90'", "Tiri o passaggi bloccati ogni 90 minuti", MetricUnit.PER_90, true,
            OUTFIELD(), s -> per90(s.getTacklesBlocks(), s)),
    DUELS_WON_P90("duels_won_p90", "Duelli vinti per 90'", "Duelli vinti ogni 90 minuti", MetricUnit.PER_90, true,
            OUTFIELD(), s -> per90(s.getDuelsWon(), s)),
    DUELS_WON_PCT("duels_won_pct", "Duelli vinti %", "Percentuale di duelli vinti (almeno 20 duelli)",
            MetricUnit.PERCENT, true, OUTFIELD(), s -> pct(s.getDuelsWon(), s.getDuelsTotal(), 20)),
    DRIBBLES_ATTEMPTED_P90("dribbles_attempted_p90", "Dribbling tentati per 90'", "Dribbling tentati ogni 90 minuti",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(s.getDribblesAttempts(), s)),
    DRIBBLES_SUCCESS_P90("dribbles_success_p90", "Dribbling riusciti per 90'", "Dribbling riusciti ogni 90 minuti",
            MetricUnit.PER_90, true, OUTFIELD(), s -> per90(s.getDribblesSuccess(), s)),
    DRIBBLES_SUCCESS_PCT("dribbles_success_pct", "Dribbling riusciti %",
            "Percentuale di dribbling riusciti (almeno 10 tentativi)", MetricUnit.PERCENT, true, OUTFIELD(),
            s -> pct(s.getDribblesSuccess(), s.getDribblesAttempts(), 10)),
    FOULS_DRAWN_P90("fouls_drawn_p90", "Falli subiti per 90'", "Falli subiti ogni 90 minuti", MetricUnit.PER_90, true,
            OUTFIELD(), s -> per90(s.getFoulsDrawn(), s)),
    FOULS_COMMITTED_P90("fouls_committed_p90", "Falli commessi per 90'", "Falli commessi ogni 90 minuti (meno è meglio)",
            MetricUnit.PER_90, false, OUTFIELD(), s -> per90(s.getFoulsCommitted(), s)),
    RATING("rating", "Valutazione media", "Voto medio stagionale assegnato dalla fonte dati", MetricUnit.RATING, true,
            EnumSet.allOf(Position.class), PlayerSeasonStat::getRating),
    SAVES_P90("saves_p90", "Parate per 90'", "Parate ogni 90 minuti", MetricUnit.PER_90, true,
            EnumSet.of(Position.GK), s -> per90(s.getSaves(), s)),
    GOALS_CONCEDED_P90("goals_conceded_p90", "Gol subiti per 90'", "Gol subiti ogni 90 minuti (meno è meglio)",
            MetricUnit.PER_90, false, EnumSet.of(Position.GK), s -> per90(s.getGoalsConceded(), s));

    private final String key;
    private final String label;
    private final String description;
    private final MetricUnit unit;
    private final boolean higherIsBetter;
    private final Set<Position> positions;
    private final Function<PlayerSeasonStat, BigDecimal> calculator;

    MetricKey(String key, String label, String description, MetricUnit unit, boolean higherIsBetter,
              Set<Position> positions, Function<PlayerSeasonStat, BigDecimal> calculator) {
        this.key = key;
        this.label = label;
        this.description = description;
        this.unit = unit;
        this.higherIsBetter = higherIsBetter;
        this.positions = positions;
        this.calculator = calculator;
    }

    public String key() {
        return key;
    }

    public String label() {
        return label;
    }

    public String description() {
        return description;
    }

    public MetricUnit unit() {
        return unit;
    }

    public boolean higherIsBetter() {
        return higherIsBetter;
    }

    public Set<Position> positions() {
        return positions;
    }

    public boolean appliesTo(Position position) {
        return position != null && positions.contains(position);
    }

    /** Valore della metrica per la riga di statistiche, o null se il dato non c'è o non è sufficiente. */
    public BigDecimal compute(PlayerSeasonStat stat) {
        return calculator.apply(stat);
    }

    public static Optional<MetricKey> fromKey(String key) {
        for (MetricKey m : values()) {
            if (m.key.equals(key)) {
                return Optional.of(m);
            }
        }
        return Optional.empty();
    }

    private static Set<Position> OUTFIELD() {
        return EnumSet.of(Position.DEF, Position.MID, Position.ATT);
    }

    private static BigDecimal per90(Integer value, PlayerSeasonStat s) {
        Integer minutes = s.getMinutes();
        if (value == null || minutes == null || minutes <= 0) {
            return null;
        }
        return BigDecimal.valueOf(value).multiply(BigDecimal.valueOf(90))
                .divide(BigDecimal.valueOf(minutes), 3, RoundingMode.HALF_UP);
    }

    private static Integer sum(Integer a, Integer b) {
        return a == null || b == null ? null : a + b;
    }

    /** Percentuale, calcolata solo se il campione (denominatore) è abbastanza grande. */
    private static BigDecimal pct(Integer part, Integer total, int minTotal) {
        if (part == null || total == null || total < minTotal) {
            return null;
        }
        return BigDecimal.valueOf(part).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 3, RoundingMode.HALF_UP);
    }
}
