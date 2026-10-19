import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiSend } from './client'
import { useAuth } from '../features/auth/useAuth'
import type {
  AiSearchResult,
  CompareVerdict,
  LeagueWithSeasons,
  MetricInfo,
  PageResponse,
  PlayerDetail,
  PlayerNote,
  PlayerReport,
  PlayerRow,
  Projection,
  SimilarPlayer,
  TeamRef,
  Watchlist,
  WatchlistDetail,
} from './types'

const FIVE_MINUTES = 5 * 60 * 1000

export function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: ({ signal }) => apiGet<LeagueWithSeasons[]>('/leagues', undefined, signal),
    staleTime: FIVE_MINUTES,
  })
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: ({ signal }) => apiGet<MetricInfo[]>('/metrics', undefined, signal),
    staleTime: Infinity,
  })
}

export function useTeams(leagueId: number | undefined, season: number | undefined) {
  return useQuery({
    queryKey: ['teams', leagueId, season],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams()
      if (season !== undefined) params.set('season', String(season))
      return apiGet<TeamRef[]>(`/leagues/${leagueId}/teams`, params, signal)
    },
    enabled: leagueId !== undefined,
    staleTime: FIVE_MINUTES,
  })
}

export function usePlayers(params: URLSearchParams) {
  const { user } = useAuth()
  return useQuery({
    // L'utente è nella chiave: il visitatore riceve righe bloccate, chi ha fatto l'accesso no
    queryKey: ['players', params.toString(), user?.id ?? null],
    queryFn: ({ signal }) => apiGet<PageResponse<PlayerRow>>('/players', params, signal),
    placeholderData: keepPreviousData,
  })
}

function playerQuery(id: number) {
  return {
    queryKey: ['player', id],
    queryFn: ({ signal }: { signal: AbortSignal }) => apiGet<PlayerDetail>(`/players/${id}`, undefined, signal),
    staleTime: FIVE_MINUTES,
  }
}

export function usePlayer(id: number) {
  return useQuery({ ...playerQuery(id), enabled: Number.isInteger(id) })
}

export function usePlayersByIds(ids: number[]) {
  return useQueries({ queries: ids.map(playerQuery) })
}

/** Ricerca in linguaggio naturale: è una mutation perché ogni invio costa una chiamata al modello. */
export function useAiSearch() {
  return useMutation({ mutationFn: (query: string) => apiPost<AiSearchResult>('/ai/search', { query }) })
}

/** Il report si genera su richiesta (non al caricamento della pagina) per non consumare chiamate inutili. */
export function useAiReport(playerId: number) {
  return useMutation({ mutationFn: () => apiGet<PlayerReport>(`/ai/players/${playerId}/report`) })
}

/** Verdetto sul confronto: le stesse schede mostrate nella pagina, nella stessa stagione. */
export function useAiCompare(ids: number[], season: number | undefined) {
  return useMutation({
    mutationFn: () => {
      const params = new URLSearchParams({ ids: ids.join(',') })
      if (season !== undefined) params.set('season', String(season))
      return apiGet<CompareVerdict>('/ai/compare', params)
    },
  })
}

export function useSimilarPlayers(playerId: number, season: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['similar', playerId, season, user?.id ?? null],
    queryFn: ({ signal }) =>
      apiGet<SimilarPlayer[]>(`/players/${playerId}/similar`, new URLSearchParams({ season: String(season) }), signal),
    staleTime: FIVE_MINUTES,
  })
}

export function usePlayerNotes(playerId: number) {
  const { user } = useAuth()
  return useQuery({
    // Le note sono dell'utente: la chiave le separa tra account diversi nello stesso browser
    queryKey: ['notes', playerId, user?.id ?? null],
    queryFn: ({ signal }) => apiGet<PlayerNote[]>(`/players/${playerId}/notes`, undefined, signal),
    enabled: Number.isInteger(playerId) && user !== null,
  })
}

/** Dopo ogni modifica la lista si ricarica dal server, che resta l'unica fonte. */
function useNotesMutation<V>(playerId: number, fn: (variables: V) => Promise<unknown>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notes', playerId] }),
  })
}

export function useAddNote(playerId: number) {
  return useNotesMutation(playerId, (body: string) => apiPost<PlayerNote>(`/players/${playerId}/notes`, { body }))
}

export function useUpdateNote(playerId: number) {
  return useNotesMutation(playerId, ({ id, body }: { id: number; body: string }) =>
    apiSend<PlayerNote>('PUT', `/notes/${id}`, { body }),
  )
}

export function useDeleteNote(playerId: number) {
  return useNotesMutation(playerId, (id: number) => apiSend<void>('DELETE', `/notes/${id}`))
}

/** Le liste dell'utente; con playerId ogni lista dice se contiene già quel giocatore. */
export function useWatchlists(playerId?: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['watchlists', 'all', playerId ?? null, user?.id ?? null],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams()
      if (playerId !== undefined) params.set('playerId', String(playerId))
      return apiGet<Watchlist[]>('/watchlists', params, signal)
    },
    enabled: user !== null,
  })
}

export function useWatchlist(id: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['watchlists', 'one', id, user?.id ?? null],
    queryFn: ({ signal }) => apiGet<WatchlistDetail>(`/watchlists/${id}`, undefined, signal),
    enabled: Number.isInteger(id) && user !== null,
  })
}

/** Dopo ogni modifica le liste si ricaricano dal server, che resta l'unica fonte. */
function useWatchlistMutation<V, R = unknown>(fn: (variables: V) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries({ queryKey: ['watchlists'] }),
  })
}

export function useCreateWatchlist() {
  return useWatchlistMutation((name: string) => apiPost<Watchlist>('/watchlists', { name }))
}

export function useDeleteWatchlist() {
  return useWatchlistMutation((id: number) => apiSend<void>('DELETE', `/watchlists/${id}`))
}

/** Mette o toglie un giocatore da una lista (entrambe le chiamate sono idempotenti). */
export function useSetPlayerInWatchlist() {
  return useWatchlistMutation(({ listId, playerId, inList }: { listId: number; playerId: number; inList: boolean }) =>
    apiSend<void>(inList ? 'PUT' : 'DELETE', `/watchlists/${listId}/players/${playerId}`),
  )
}

/** Stima di valore e crescita: calcolata dal backend sui dati della stagione indicata. */
export function useProjection(playerId: number, season: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['projection', playerId, season, user?.id ?? null],
    queryFn: ({ signal }) =>
      apiGet<Projection>(`/players/${playerId}/projection`, new URLSearchParams({ season: String(season) }), signal),
    staleTime: FIVE_MINUTES,
    enabled: Number.isInteger(playerId) && user !== null,
  })
}
