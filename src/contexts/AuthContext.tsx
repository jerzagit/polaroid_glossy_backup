'use client';

import { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  const loading = status === 'loading';

  const signInWithGoogle = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // For now, use session user as profile
  // In production, you'd fetch from database
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
