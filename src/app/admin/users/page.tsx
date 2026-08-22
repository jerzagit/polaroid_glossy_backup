'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Loader2, Shield, ShieldCheck, Mail, Phone,
  Calendar, ChevronDown, ChevronUp, Package, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MARKETING: 'bg-purple-100 text-purple-800',
  PACKER: 'bg-blue-100 text-blue-800',
  AFFILIATE: 'bg-amber-100 text-amber-800',
  CUSTOMER: 'bg-gray-100 text-gray-800',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('backend_jwt');
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    all: users.length,
    CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    MARKETING: users.filter(u => u.role === 'MARKETING').length,
    PACKER: users.filter(u => u.role === 'PACKER').length,
    AFFILIATE: users.filter(u => u.role === 'AFFILIATE').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/admin/orders">
              <Package className="w-4 h-4" /> <span className="text-xs md:text-sm">Admin</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-white">PG</span>
            </div>
            <span className="text-xs md:text-sm font-bold">User Management</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Users</h1>
        <p className="text-sm text-muted-foreground mb-6">View and manage all registered accounts</p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Role filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'CUSTOMER', 'ADMIN', 'MARKETING', 'PACKER', 'AFFILIATE'] as const).map(role => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className="whitespace-nowrap"
            >
              {role === 'all' ? 'All' : role}
              <Badge variant="secondary" className="ml-2 text-xs">
                {roleCounts[role]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {search ? 'Try a different search term.' : 'No users registered yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(user => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{user.name || 'Unnamed'}</span>
                          <Badge className={cn('text-xs', ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800')}>
                            {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      >
                        {expandedId === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {expandedId === user.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">User ID</span>
                              <p className="font-mono text-[11px] truncate">{user.id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Registered</span>
                              <p>{new Date(user.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone</span>
                              <p>{user.phone || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status</span>
                              <p className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
