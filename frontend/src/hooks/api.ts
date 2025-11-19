//stored shared API logic 

export const API_URL = 
    process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}