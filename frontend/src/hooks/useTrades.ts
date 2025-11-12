// src/hooks/useTrades.ts

//import necessary functions from react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

//define API base URL (ensure hook works both locally and in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

export function useTrades(tournamentId?: string) {
  return useQuery({
    queryKey: ['trades', tournamentId],
    queryFn: async () => {
      const url = tournamentId 
        ? `${API_URL}/trades?tournament_id=${tournamentId}`
        : `${API_URL}/trades`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch trades')
      return res.json()
    }
  })
}

export function useAgentTrades(agentId: string) {
  return useQuery({
    queryKey: ['trades', 'agent', agentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/trades/agent/${agentId}`)
      if (!res.ok) throw new Error('Failed to fetch agent trades')
      return res.json()
    },
    enabled: !!agentId
  })
}


//POST request to create a new trade
export function useCreateTrade() {
  //react query auto re-fetches data after mutation  
  const queryClient = useQueryClient()
  
  return useMutation({
    //function that changes data on server
    mutationFn: async (tradeData: any) => {
      const res = await fetch(`${API_URL}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      })
      if (!res.ok) throw new Error('Failed to create trade')
      return res.json()
    },
    //runs after successful mutation to refresh trades data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    }
  })
}