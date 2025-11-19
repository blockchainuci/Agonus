import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL, getAuthHeaders } from './api'
import { Trade , ID, CreateTradeData, ApiError} from '../types'

// Public GET - can optionally filter by tournament - no auth
export function useTrades(tournamentId?: ID) {
  return useQuery<Trade[]>({
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

//  Public GET - get trades for specific agent - no auth
export function useAgentTrades(agentId: ID) {
  return useQuery<Trade[]>({
    queryKey: ['trades', 'agent', agentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/trades/agent/${agentId}`)
      if (!res.ok) throw new Error('Failed to fetch agent trades')
      return res.json()
    },
    enabled: !!agentId
  })
}


//  POST - needs auth
export function useCreateTrade() {
  const queryClient = useQueryClient()
  
  return useMutation<Trade, ApiError, CreateTradeData>({
    mutationFn: async (tradeData) => {
      const res = await fetch(`${API_URL}/trades`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(tradeData)
      })
      if (!res.ok) throw new Error('Failed to create trade')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    }
  })
}
