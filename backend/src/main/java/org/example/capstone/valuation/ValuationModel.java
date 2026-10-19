package org.example.capstone.valuation;

import org.example.capstone.player.Position;

import java.util.ArrayList;
import java.util.List;

/**
 * Stima euristica del valore di un giocatore, tutta in funzioni pure: stessi dati, stesso risultato.
 * Non è un valore di mercato: usa solo percentili, età, minuti, campionato e ruolo (niente contratto, infortuni
 * o potenziale). Le costanti sono quelle spiegate nella pagina Metodo.
 */
public final class ValuationModel {

    /** Valore (in milioni di euro) di chi sta al percentile 0; ogni SCORE_STEP punti di punteggio lo raddoppia. */
    static final double BASE_M = 0.2;
    static final double SCORE_STEP = 10.0;
    /** Minuti oltre i quali il campione è considerato pieno. */
    static final int FULL_MINUTES = 1800;
    /** Anni di proiezione. */
    public static final int HORIZON_YEARS = 5;
    /** Quanto si allargano min e max rispetto allo scenario medio: SPREAD * radice degli anni. */
    static final double SPREAD = 2.5;

    private ValuationModel() {
    }

    /** Punto della traiettoria: valori in milioni di euro, arrotondati a un decimale. */
    public record Point(int yearOffset, int age, double minM, double midM, double maxM) {
    }

    /** Punteggio di rendimento 0-100: media dei percentili noti; null se sono meno di tre. */
    public static Double score(List<Integer> percentiles) {
        List<Integer> known = percentiles.stream().filter(p -> p != null).toList();
        if (known.size() < 3) {
            return null;
        }
        return known.stream().mapToInt(Integer::intValue).average().orElseThrow();
    }

    static double ageFactor(int age) {
        if (age <= 21) return 1.5;
        return switch (age) {
            case 22 -> 1.35;
            case 23 -> 1.2;
            case 24, 25, 26 -> 1.0;
            case 27 -> 0.85;
            case 28 -> 0.7;
            case 29 -> 0.55;
            case 30 -> 0.4;
            default -> 0.25;
        };
    }

    /** Il campionato si riconosce dal paese (come lo restituisce API-Football); gli altri valgono meno. */
    static double leagueFactor(String country) {
        if (country == null) return 0.7;
        return switch (country) {
            case "England" -> 1.3;
            case "Italy", "Spain", "Germany" -> 1.0;
            case "France" -> 0.85;
            case "Portugal", "Netherlands" -> 0.6;
            default -> 0.7;
        };
    }

    static double minutesFactor(int minutes) {
        return Math.sqrt(Math.min(1.0, (double) Math.max(0, minutes) / FULL_MINUTES));
    }

    static double roleFactor(Position position) {
        return position == Position.GK ? 0.7 : 1.0;
    }

    /** Variazione media annua del punteggio in base all'età: i giovani crescono, i veterani calano. */
    static double scoreDelta(int age) {
        if (age <= 21) return 3.0;
        if (age <= 23) return 2.0;
        if (age <= 25) return 1.0;
        if (age <= 27) return 0.0;
        if (age <= 29) return -1.5;
        return -3.0;
    }

    /** Valore stimato in milioni di euro per un punteggio, un'età e il resto del contesto. */
    public static double valueM(double score, int age, String country, int minutes, Position position) {
        double base = BASE_M * Math.pow(2, clamp(score) / SCORE_STEP);
        return base * ageFactor(age) * leagueFactor(country) * minutesFactor(minutes) * roleFactor(position);
    }

    /**
     * Traiettoria dei prossimi anni: il punteggio medio cambia ogni anno del delta dell'età e lo scenario minimo
     * e massimo si allontanano di SPREAD * radice(anni). Il punto 0 è la stima di oggi.
     */
    public static List<Point> trajectory(double score, int age, String country, int minutes, Position position) {
        List<Point> points = new ArrayList<>();
        double mid = clamp(score);
        double today = round(valueM(mid, age, country, minutes, position));
        points.add(new Point(0, age, today, today, today));
        for (int t = 1; t <= HORIZON_YEARS; t++) {
            mid = clamp(mid + scoreDelta(age + t - 1));
            double spread = SPREAD * Math.sqrt(t);
            int futureAge = age + t;
            points.add(new Point(t, futureAge,
                    round(valueM(clamp(mid - spread), futureAge, country, minutes, position)),
                    round(valueM(mid, futureAge, country, minutes, position)),
                    round(valueM(clamp(mid + spread), futureAge, country, minutes, position))));
        }
        return points;
    }

    public static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double clamp(double score) {
        return Math.min(100, Math.max(0, score));
    }
}
