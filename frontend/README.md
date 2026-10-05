# ScoutAI - frontend

React, TypeScript e Vite, con lint tramite Oxlint e test con Vitest.

| Comando | Azione |
|---|---|
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il server di sviluppo su http://localhost:5173 |
| `npm run lint` | Esegue Oxlint |
| `npm test` | Esegue i test |
| `npm run build` | Controlla i tipi e crea il build di produzione in `dist/` |

In sviluppo le richieste `/api` vengono inoltrate al backend su `http://localhost:8080` (vedi `vite.config.ts`). Per puntare a un altro backend, ad esempio in produzione, imposta `VITE_API_BASE_URL`.

Il design è descritto in `../DESIGN.md` e le scelte di prodotto in `../PRODUCT.md`. La struttura del codice è in `../docs/architettura.md`.
