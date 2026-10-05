# Decisioni

- **Il database decide, l'AI interpreta.** L'AI traduce una frase in filtri strutturati e commenta statistiche già presenti nel database: non inventa numeri. I risultati vengono sempre da una query.
- **Una sola whitelist di metriche.** `MetricKey` definisce le metriche interrogabili: filtri, ordinamenti e criteri dell'AI possono riferirsi solo a quelle.
- **Fonte dati sostituibile.** L'import dipende dall'interfaccia `PlayerDataSource`: API-Football può essere sostituita o affiancata (per esempio da un CSV) senza toccare il resto.
- **Budget giornaliero di 90 richieste.** Il piano gratuito di API-Football ne concede 100: il margine è lasciato a chiamate manuali. Il conteggio usa il giorno UTC, perché a quell'ora l'API azzera la quota.
- **Import riprendibile e idempotente.** L'avanzamento è salvato a ogni pagina, nella stessa transazione dei dati. Se qualcosa fallisce, la pagina viene riprovata al prossimo avvio.
- **Percentili per ruolo, campionato e stagione.** Si confrontano solo giocatori con almeno 450 minuti e coorti di almeno 10 persone. Sotto queste soglie il percentile resta `NULL` e l'interfaccia dice perché.
- **Valori mancanti a `NULL`.** Una statistica assente non diventa 0, per non falsare le analisi.
- **Le entità JPA non escono dall'API.** Le risposte usano DTO dedicati e `PageResponse`, indipendente dalle classi interne di Spring Data.
- **Chiavi mai nei log.** `ApiFootballProperties`, `OpenRouterProperties` e `SecurityProperties` mascherano la chiave in `toString()`. La chiave admin è confrontata a tempo costante.
- **Endpoint admin chiusi per default.** Senza `ADMIN_API_KEY` configurata nessuno vi accede.
- **Limite alle chiamate AI.** Ogni chiamata costa token: 20 al minuto per IP, usando l'indirizzo reale della connessione e non `X-Forwarded-For`, che il client può falsificare. Il preflight CORS del browser non conta.
