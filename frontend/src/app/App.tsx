import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Shell } from '../components/Shell'
import { StateMessage } from '../components/StateMessage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { EntryGate, RequireAuth } from '../features/auth/AuthGate'
import { LoginPage } from '../features/auth/LoginPage'
import { CompareProvider } from '../features/compare/CompareProvider'
import { ComparePage } from '../features/compare/ComparePage'
import { MethodPage } from '../features/method/MethodPage'
import { PlayerPage } from '../features/player/PlayerPage'
import { SearchPage } from '../features/search/SearchPage'
import { I18nProvider } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
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
        {t('error.pageNotFound')}
      </StateMessage>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <ThemeProvider>
            <CompareProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="accesso" element={<LoginPage />} />
                  <Route element={<Shell />}>
                    <Route
                      index
                      element={
                        <EntryGate>
                          <SearchPage />
                        </EntryGate>
                      }
                    />
                    <Route
                      path="giocatore/:id"
                      element={
                        <RequireAuth>
                          <PlayerPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="confronto"
                      element={
                        <RequireAuth>
                          <ComparePage />
                        </RequireAuth>
                      }
                    />
                    <Route path="metodo" element={<MethodPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </CompareProvider>
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
