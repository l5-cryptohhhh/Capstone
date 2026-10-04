package org.example.capstone.ingestion;

public enum RunOutcome {
    /** Tutti i task sono completati. */
    COMPLETED,
    /** Budget giornaliero raggiunto: l'import riprende al prossimo avvio. */
    QUOTA_REACHED,
    /** Errore della fonte: l'import si ferma senza consumare altra quota. */
    ERROR
}
