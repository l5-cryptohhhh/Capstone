import { keepPreviousData, useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from './client'
import { useAuth } from '../features/auth/useAuth'
import type {
  AiSearchResult,
  CompareVerdict,
  LeagueWithSeasons,
  MetricInfo,
  PageResponse,
  PlayerDetail,
  PlayerReport,
  PlayerRow,
  SimilarPlayer,
  TeamRef,
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
