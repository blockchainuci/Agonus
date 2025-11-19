// src/hooks/useAuth.ts
//import necessary functions from react-query
import { useMutation} from '@tanstack/react-query'
//define API base URL (ensure hook works both locally and in production)
import { API_URL } from './api';

export function useWalletSignIn() {
  return useMutation({
    mutationFn: async (address: string) => {
      const res = await fetch(`${API_URL}/auth/wallet-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      if (!res.ok) throw new Error('Sign in failed')
      const { access_token } = await res.json()
      localStorage.setItem('token', access_token)
      return access_token
    }
  })
}