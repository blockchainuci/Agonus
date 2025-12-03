import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL, getAuthHeaders } from './api'
import { Agent, ID, CreateAgentData, UpdateAgentData, ApiError } from '../types'

// Public GET - no auth
export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/agents/`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    }
  })
}

// Public GET - no auth
export function useAgent(agentId: string) {
  return useQuery<Agent>({
    queryKey: ['agents', agentId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/agents/${agentId}/`)
      if (!res.ok) throw new Error('Agent not found')
      return res.json()
    },
    enabled: !!agentId
  })
}

// POST - needs auth
export function useCreateAgent() {
  const queryClient = useQueryClient()
  
  return useMutation<Agent, Error, Partial<Agent>>({
    mutationFn: async (agentData) => {
      const res = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(agentData)
      })
      if (!res.ok) throw new Error('Failed to create agent')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}

// PUT - needs auth
export function useUpdateAgent() {
  const queryClient = useQueryClient()
  
  return useMutation<Agent, Error, { agentId: string, data: Partial<Agent> }>({
    mutationFn: async ({ agentId, data }) => {
      const res = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update agent')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}

//  DELETE - needs auth
export function useDeleteAgent() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: async (agentId) => {
      const res = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to delete agent')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}