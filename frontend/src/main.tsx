import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/search.css'
import './styles/dossier.css'
import './styles/auth.css'
import './styles/ai.css'
import './styles/similar.css'
import './styles/match.css'
import './styles/shiny-button.css'
import './styles/profile.css'
import './styles/notes.css'
import './styles/watchlist.css'
import './styles/radar.css'
import './styles/zones.css'
import './styles/projection.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
