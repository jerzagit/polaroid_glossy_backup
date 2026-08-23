'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Chrome, Mail, Lock, Loader2 } from 'lucide-react';
import { useEffect, Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.push(redirect);
    }
  }, [user, loading, router, redirect]);

  useEffect(() => {
    if (errorParam) {
      setEmailError('Login failed. Please check your credentials.');
    }
  }, [errorParam]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setEmailError('Invalid email or password');
      setEmailLoading(false);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs md:text-sm">Home</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-white">PG</span>
            </div>
            <span className="text-xs md:text-sm font-bold">Polaroid Glossy MY</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl">Sign In</CardTitle>
            <CardDescription>Sign in to access your orders and saved addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={signInWithGoogle}>
              <Chrome className="w-5 h-5 mr-2" /> Sign in with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 text-center">{emailError}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={emailLoading}>
                {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Sign in with Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
