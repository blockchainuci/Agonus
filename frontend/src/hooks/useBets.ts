// src/hooks/useBets.ts

//import necessary functions from react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

//define API base URL (ensure hook works both locally and in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

//GET all bets
export function useBets() {
  return useQuery({
    queryKey: ['bets'],//uqiue key for caching
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bets`)
      if (!res.ok) throw new Error('Failed to fetch bets')
      return res.json()
    }//async function to fetch bets data
  })
}


export function useUserBets() {
  return useQuery({
    queryKey: ['my-bets'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/bets/my-bets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch user bets')
      return res.json()
    }
  })
}

//POST request to create a new bet
export function useCreateBet() {
  //react query auto re-fetches data after mutation
  const queryClient = useQueryClient()
  
  return useMutation({
    //function that changes data on server
    mutationFn: async (betData: any) => {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/bets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(betData)
      })
      if (!res.ok) throw new Error('Failed to create bet')
      return res.json()
    },//runs after successful mutation to refresh bets data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] })
      queryClient.invalidateQueries({ queryKey: ['my-bets'] })
    }
  })
}

// useUpdateBet and useDeleteBet follow same pattern

//PUT request to update a bet
export function useUpdateBet() {
    //auto fetch after mutation
    const queryClient = useQueryClient()
    
    //function changes data on server
    return useMutation({
      mutationFn: async ({ betId, data }: { betId: string, data: any }) => {
        const res = await fetch(`${API_URL}/bets/${betId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error('Failed to update bet')
        return res.json()
      },//auto runs on success to refresh bets data
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bets'] })
        queryClient.invalidateQueries({ queryKey: ['my-bets'] })
      } 
    })
}

//DELETE request to delete a bet
export function useDeleteBet() {
    //auto fetch after mutation
    const queryClient = useQueryClient()            

    //function changes data on server
    return useMutation({
      mutationFn: async (betId: string) => {
        const res = await fetch(`${API_URL}/bets/${betId}`, {
            method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to delete bet')
        return res.json()
      },//auto runs on success to refresh bets data
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bets'] })           
        queryClient.invalidateQueries({ queryKey: ['my-bets'] })
        }
    })
}
