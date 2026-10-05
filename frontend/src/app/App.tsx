import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Shell } from '../components/Shell'
import { StateMessage } from '../components/StateMessage'
import { CompareProvider } from '../features/compare/CompareProvider'
import { ComparePage } from '../features/compare/ComparePage'
import { MethodPage } from '../features/method/MethodPage'
import { PlayerPage } from '../features/player/PlayerPage'
import { SearchPage } from '../features/search/SearchPage'
import { I18nProvider, useI18n } from '../i18n/I18nProvider'
import { ThemeProvider } from './ThemeProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Errori del client (4xx) non vanno riprovati: la richiesta resterebbe sbagliata.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1,
    },
  },
})

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="page">
      <StateMessage
        tone="empty"
        title="404"
        action={
          <Link to="/" className="btn">
            {t('error.back')}
          </Link>
        }
      >
        {t('error.PLAYER_NOT_FOUND')}
      </StateMessage>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <CompareProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<SearchPage />} />
                  <Route path="giocatore/:id" element={<PlayerPage />} />
                  <Route path="confronto" element={<ComparePage />} />
                  <Route path="metodo" element={<MethodPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CompareProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
