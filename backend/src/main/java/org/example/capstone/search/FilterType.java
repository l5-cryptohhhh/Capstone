package org.example.capstone.search;

public enum FilterType {
    /** Filtra sul valore della metrica (es. almeno 2 dribbling riusciti per 90'). */
    VALUE,
    /** Filtra sul percentile rispetto ai pari ruolo (es. almeno il 70° percentile). */
    PERCENTILE
}
