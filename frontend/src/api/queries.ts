import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { apiGet } from './client'
import type { LeagueWithSeasons, MetricInfo, PageResponse, PlayerDetail, PlayerSummary, TeamRef } from './types'

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
  return useQuery({
    queryKey: ['players', params.toString()],
    queryFn: ({ signal }) => apiGet<PageResponse<PlayerSummary>>('/players', params, signal),
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
