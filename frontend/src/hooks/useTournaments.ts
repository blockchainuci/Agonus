import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL, getAuthHeaders } from './api'
import { Tournament, ID, CreateTournamentData, UpdateTournamentData, ApiError } from '../types'

// public GET 
export function useTournaments() {
  return useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments`)
      if (!res.ok) throw new Error('Failed to fetch tournaments')
      return res.json()
    }
  })
}

// other public GET 
export function useTournament(tournamentId: ID) {
  return useQuery<Tournament>({
    queryKey: ['tournaments', tournamentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`)
      if (!res.ok) throw new Error('Tournament not found')
      return res.json()
    },
    enabled: !!tournamentId
  })
}

// POST - needs auth
export function useCreateTournament() {
  const queryClient = useQueryClient()
  
  return useMutation<Tournament, ApiError, CreateTournamentData>({
    mutationFn: async (tournamentData) => {
      const res = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(tournamentData)
      })
      if (!res.ok) throw new Error('Failed to create tournament')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}

// PUT - needs auth
export function useUpdateTournament() {
  const queryClient = useQueryClient()
  
  return useMutation<Tournament, ApiError, { tournamentId: ID, data: UpdateTournamentData}>({
    mutationFn: async ({ tournamentId, data }) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update tournament')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}

// DELETE - needs auth
export function useDeleteTournament() {
  const queryClient = useQueryClient()
  
  return useMutation<void, ApiError, ID>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete tournament')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}