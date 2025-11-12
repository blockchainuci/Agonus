//import necessary functions from react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

//define API base URL (ensure hook works both locally and in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// src/hooks/useTournaments.ts

//GET all tournaments
export function useTournaments() {
  //for GET requests  
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments`)
      if (!res.ok) throw new Error('Failed to fetch tournaments')
      return res.json()
    }
  })
}

//for GET request of a single tournament by ID
export function useTournament(tournamentId: string) {
  return useQuery({
    queryKey: ['tournaments', tournamentId],//unqiue key including tournamentId
    queryFn: async () => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`)
      if (!res.ok) throw new Error('Tournament not found')
      return res.json()
    },//async function to fetch specific tournament data
    enabled: !!tournamentId//ensures the query only runs once the ID exists.
  })
}

//POST request to create a new tournament
export function useCreateTournament() {

  //react query auto re-fetches data after mutation
  const queryClient = useQueryClient()
  
  return useMutation({
    //function that changes data on server
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Admin only
},
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create tournament')
      return res.json()
    },//runs after successful mutation to refresh tournaments data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}

// useUpdateTournament and useDeleteTournament follow same pattern

//PUT updated tournament
export function useUpdateTournament() {
  //auto fetch after mutation  
  const queryClient = useQueryClient()

  //function changes data on server
  return useMutation({
    mutationFn: async ({ tournamentId, data }: { tournamentId: string, data: any }) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update tournament')
      return res.json()
    },//auto runs on success to refresh tournaments data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}

//DELETE tournament
export function useDeleteTournament() {
  //auto fetch after mutation  
  const queryClient = useQueryClient()

  //function changes data on server
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete tournament')
      return res.json()
    },//auto runs on success to refresh tournaments data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    }
  })
}