'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080/api';
const USE_LOCAL_AUTH_MOCK = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  backendJwt: string | undefined;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [backendJwt, setBackendJwt] = useState<string | undefined>(undefined);
  const [mockUser, setMockUser] = useState<AuthUser | null>(null);

  const loading = status === 'loading';

  const isLocalMockEnabled = () => (
    USE_LOCAL_AUTH_MOCK
    && typeof window !== 'undefined'
    && window.location.hostname === 'localhost'
  );

  const exchangeLocalMockToken = useCallback(async () => {
    if (!isLocalMockEnabled()) return;

    const email = 'local-customer@polaroid.test';
    const name = 'Local Test Customer';

    const res = await fetch(`${BACKEND_API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    if (!res.ok) {
      throw new Error('Failed to create local test session');
    }

    const data = await res.json();
    if (data.token) {
      setBackendJwt(data.token);
      setMockUser({ id: email, email, name, image: null });
      localStorage.setItem('backend_jwt', data.token);
      if (data.refreshToken) {
        localStorage.setItem('backend_refresh_token', data.refreshToken);
      }
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isLocalMockEnabled()) {
      await exchangeLocalMockToken();
      return;
    }

    await signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = async () => {
    setBackendJwt(undefined);
    setMockUser(null);
    localStorage.removeItem('backend_jwt');
    localStorage.removeItem('backend_refresh_token');
    if (session?.user) {
      await signOut({ callbackUrl: '/' });
    }
  };

  const exchangeGoogleToken = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(`${BACKEND_API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          avatarUrl: session.user.image,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setBackendJwt(data.token);
          localStorage.setItem('backend_jwt', data.token);
          if (data.refreshToken) {
            localStorage.setItem('backend_refresh_token', data.refreshToken);
          }
        }
      }
    } catch {
      // Backend Google auth not available yet - silently continue
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      exchangeGoogleToken();
    } else if (isLocalMockEnabled()) {
      exchangeLocalMockToken().catch(() => {
        setBackendJwt(undefined);
        setMockUser(null);
      });
    } else {
      setBackendJwt(undefined);
      setMockUser(null);
    }
  }, [session, exchangeGoogleToken, exchangeLocalMockToken]);

  const user: AuthUser | null = session?.user ? {
    id: session.user.id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name,
    image: session.user.image,
  } : mockUser;

  const profile: UserProfile | null = session?.user ? {
    id: session.user.id || session.user.email || '',
    supabaseId: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || null,
    avatar: session.user.image || null,
    phone: null,
  } : mockUser ? {
    id: mockUser.id,
    supabaseId: mockUser.id,
    email: mockUser.email,
    name: mockUser.name || null,
    avatar: mockUser.image || null,
    phone: null,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        backendJwt,
        signInWithGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
