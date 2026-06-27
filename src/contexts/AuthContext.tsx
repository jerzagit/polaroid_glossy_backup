'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080/api';

interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  } | null;
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

  const loading = status === 'loading';

  const signInWithGoogle = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = async () => {
    setBackendJwt(undefined);
    localStorage.removeItem('backend_jwt');
    localStorage.removeItem('backend_refresh_token');
    await signOut({ callbackUrl: '/' });
  };

  const exchangeGoogleToken = useCallback(async () => {
    if (!session?.user?.email) return;

    const stored = localStorage.getItem('backend_jwt');
    if (stored) {
      setBackendJwt(stored);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, name: session.user.name }),
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
    } else {
      setBackendJwt(undefined);
    }
  }, [session, exchangeGoogleToken]);

  const profile: UserProfile | null = session?.user ? {
    id: session.user.id || session.user.email || '',
    supabaseId: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || null,
    avatar: session.user.image || null,
    phone: null,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
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
