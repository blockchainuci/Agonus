//stored shared API logic

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true; // unparseable token = treat as expired
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (!token || isJwtExpired(token)) return {};
  return { Authorization: `Bearer ${token}` };
}