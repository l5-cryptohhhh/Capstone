package org.example.capstone.valuation;

import org.example.capstone.player.Position;
import org.example.capstone.valuation.ValuationModel.Point;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValuationModelTest {

    @Test
    void scoreIsTheAverageOfKnownPercentilesAndNeedsThreeOfThem() {
        assertEquals(60.0, ValuationModel.score(List.of(40, 60, 80)));
        assertEquals(60.0, ValuationModel.score(Arrays.asList(40, null, 60, 80, null)));
        assertNull(ValuationModel.score(Arrays.asList(40, 60, null)));
        assertNull(ValuationModel.score(List.of()));
    }

    @Test
    void anAverageOutfielderInTheBigLeaguesIsWorthAFewMillions() {
        // 0.2 * 2^(50/10) = 6.4, con tutti i fattori a 1
        assertEquals(6.4, ValuationModel.valueM(50, 25, "Italy", 3000, Position.MID), 1e-9);
    }

    @Test
    void aTopYoungPlayerInEnglandIsWorthTensOfMillions() {
        // 0.2 * 2^(90/10) * 1.5 * 1.3 = 199.7
        assertEquals(199.7, ValuationModel.round(ValuationModel.valueM(90, 21, "England", 3000, Position.ATT)));
    }

    @Test
    void valueDropsWithAgeAfterTheMidTwenties() {
        double at24 = ValuationModel.valueM(70, 24, "Spain", 3000, Position.DEF);
        double at28 = ValuationModel.valueM(70, 28, "Spain", 3000, Position.DEF);
        double at32 = ValuationModel.valueM(70, 32, "Spain", 3000, Position.DEF);

        assertTrue(at24 > at28 && at28 > at32);
        assertEquals(0.7, at28 / at24, 1e-9);
        assertEquals(0.25, at32 / at24, 1e-9);
    }

    @Test
    void leagueMinutesAndRoleAdjustTheValue() {
        double base = ValuationModel.valueM(60, 25, "Italy", 3000, Position.MID);

        assertEquals(1.3, ValuationModel.valueM(60, 25, "England", 3000, Position.MID) / base, 1e-9);
        assertEquals(0.6, ValuationModel.valueM(60, 25, "Portugal", 3000, Position.MID) / base, 1e-9);
        assertEquals(0.7, ValuationModel.valueM(60, 25, "Brazil", 3000, Position.MID) / base, 1e-9);
        assertEquals(0.7, ValuationModel.valueM(60, 25, "Italy", 3000, Position.GK) / base, 1e-9);
        // 900 minuti su 1800: radice di 0,5
        assertEquals(Math.sqrt(0.5), ValuationModel.valueM(60, 25, "Italy", 900, Position.MID) / base, 1e-9);
        // oltre i 1800 minuti il fattore non cresce più
        assertEquals(base, ValuationModel.valueM(60, 25, "Italy", 5000, Position.MID), 1e-9);
    }

    @Test
    void trajectoryStartsFromTodayAndWidensTheRangeEveryYear() {
        List<Point> points = ValuationModel.trajectory(60, 20, "Italy", 3000, Position.ATT);

        assertEquals(ValuationModel.HORIZON_YEARS + 1, points.size());
        Point today = points.get(0);
        assertEquals(0, today.yearOffset());
        assertEquals(today.midM(), today.minM());
        assertEquals(today.midM(), today.maxM());

        double previousWidth = 0;
        for (Point p : points.subList(1, points.size())) {
            assertTrue(p.minM() <= p.midM() && p.midM() <= p.maxM(), "min <= medio <= max all'anno " + p.yearOffset());
            double width = p.maxM() - p.minM();
            assertTrue(width >= previousWidth, "l'intervallo non si restringe");
            previousWidth = width;
        }
    }

    @Test
    void aYoungPlayerGrowsAndAVeteranDeclines() {
        List<Point> young = ValuationModel.trajectory(70, 19, "Italy", 3000, Position.MID);
        List<Point> veteran = ValuationModel.trajectory(70, 31, "Italy", 3000, Position.MID);

        // a 19 e 20 anni il fattore età è lo stesso (1,5): il valore sale solo perché il punteggio medio cresce
        assertTrue(young.get(1).midM() > young.get(0).midM());
        assertTrue(veteran.get(1).midM() < veteran.get(0).midM());
        assertTrue(veteran.get(5).midM() < veteran.get(1).midM());
    }

    @Test
    void theScoreStaysBetween0And100() {
        List<Point> points = ValuationModel.trajectory(99, 19, "England", 3000, Position.ATT);
        double ceiling = ValuationModel.round(ValuationModel.valueM(100, 24, "England", 3000, Position.ATT));

        // dopo 5 anni lo scenario massimo è esattamente il valore di un punteggio 100: non va oltre
        assertEquals(ceiling, points.get(5).maxM());

        double floor = ValuationModel.round(ValuationModel.valueM(0, 36, "Italy", 3000, Position.MID));
        assertEquals(floor, ValuationModel.trajectory(1, 31, "Italy", 3000, Position.MID).get(5).minM());
    }
}
