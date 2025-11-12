// src/hooks/useAgents.ts

//import necessary functions from react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

//define API base URL (ensure hook works both locally and in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'


export function useAgents() {
    //for GET requests
    return useQuery({
    queryKey: ['agents'],//unique key for caching
    queryFn: async () => {
      const res = await fetch(`${API_URL}/agents`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    }//async function to fetch agents data
    //enabled: empty, but controlls whether to run automatically
  })
}

export function useAgent(agentId: string) {
  //for GET request of a single agent by ID  
  return useQuery({
    queryKey: ['agents', agentId],//unique key including agentId
    queryFn: async () => {
      const res = await fetch(`${API_URL}/agents/${agentId}`)
      if (!res.ok) throw new Error('Agent not found')
      return res.json()
    },//async function to fetch specific agent data
    
    //controls whether to run automatically
    enabled: !!agentId//ensures the query only runs once the ID exists.
  })
}

//POST request to create a new agent
export function useCreateAgent() {

  //react query auto re-fetches data after mutation  
  const queryClient = useQueryClient()

  return useMutation({
    //function that changes data on server
    mutationFn: async (agentData: any) => {
      const res = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      })
      if (!res.ok) throw new Error('Failed to create agent')
      return res.json()
    },
    //runs after successful mutation to refresh agents data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}

//PUT updated agent
export function useUpdateAgent() {
  //auto fetch after mutation  
  const queryClient = useQueryClient()
  
  //function changes data on server
  return useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string, data: any }) => {
      const res = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update agent')
      return res.json()
    },//auto runs on success to refresh agents data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}

//DELETE agent
export function useDeleteAgent() {
  //auto fetch after mutation  
  const queryClient = useQueryClient()
  
  //function changes data on server
  return useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete agent')
      return res.json()
    },//auto runs on success to refresh agents data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}