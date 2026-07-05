'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, Mail, User as UserIcon, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile?.name || user.email || 'U').charAt(0).toUpperCase();

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

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">My Account</h1>

        <Card className="mb-6">
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="w-16 h-16 md:w-20 md:h-20">
              <AvatarImage src={profile?.avatar || user.image || ''} />
              <AvatarFallback className="text-lg md:text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg md:text-xl font-semibold">{profile?.name || user.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Link href="/profile/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Order History</h3>
                  <p className="text-sm text-muted-foreground">View all your orders and track deliveries</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/addresses">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Saved Addresses</h3>
                  <p className="text-sm text-muted-foreground">Manage your delivery addresses</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-60">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Account Settings</h3>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
