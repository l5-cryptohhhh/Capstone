package org.example.capstone.player;

/** Ruolo normalizzato: API-Football distingue solo portiere, difensore, centrocampista, attaccante. */
public enum Position {
    GK, DEF, MID, ATT;

    public static Position fromApi(String value) {
        if (value == null) return null;
        return switch (value) {
            case "Goalkeeper" -> GK;
            case "Defender" -> DEF;
            case "Midfielder" -> MID;
            case "Attacker" -> ATT;
            default -> null;
        };
    }
}
