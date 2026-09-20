const JWT_KEY = 'backend_jwt';
const REFRESH_TOKEN_KEY = 'backend_refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(JWT_KEY);
}

export function setToken(token: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(JWT_KEY, token);
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(JWT_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
