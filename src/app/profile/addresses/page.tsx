'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  houseUnitNo: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const malaysiaStates = [
  { id: 'johor', name: 'Johor' }, { id: 'kedah', name: 'Kedah' },
  { id: 'kelantan', name: 'Kelantan' }, { id: 'melaka', name: 'Melaka' },
  { id: 'nsembilan', name: 'Negeri Sembilan' }, { id: 'pahang', name: 'Pahang' },
  { id: 'perak', name: 'Perak' }, { id: 'perlis', name: 'Perlis' },
  { id: 'penang', name: 'Pulau Pinang' }, { id: 'selangor', name: 'Selangor' },
  { id: 'terengganu', name: 'Terengganu' }, { id: 'kl', name: 'Kuala Lumpur' },
  { id: 'putrajaya', name: 'Putrajaya' }, { id: 'labuan', name: 'Labuan' },
  { id: 'sabah', name: 'Sabah' }, { id: 'sarawak', name: 'Sarawak' },
];

const emptyForm: Omit<Address, 'id'> = {
  label: '', name: '', phone: '', houseUnitNo: '',
  addressLine1: '', addressLine2: '', city: '', state: 'selangor',
  postalCode: '', country: 'Malaysia', isDefault: false,
};

const labelColors: Record<string, string> = {
  Home: 'bg-blue-100 text-blue-700 border-blue-200',
  Office: 'bg-purple-100 text-purple-700 border-purple-200',
  Parents: 'bg-green-100 text-green-700 border-green-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function AddressesPage() {
  const { user, backendJwt, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const authHeaders = (): Record<string, string> => {
    const token = backendJwt || localStorage.getItem('backend_jwt');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile/addresses');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAddresses(data.addresses);
      }
    } catch {
      // Backend not ready yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.addressLine1?.trim() || !form.city?.trim() || !form.postalCode?.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingId ? 'Address updated' : 'Address saved');
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchAddresses();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save address');
      }
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        toast.success('Address deleted');
        fetchAddresses();
      }
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, { method: 'PATCH', headers: authHeaders() });
      if (res.ok) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch {
      toast.error('Failed to update default');
    }
  };

  const startEdit = (addr: Address) => {
    setForm({ ...addr });
    setEditingId(addr.id);
    setShowForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/profile">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs md:text-sm">Profile</span>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Saved Addresses</h1>
          {!showForm && addresses.length < 10 && (
            <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Address
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Address' : 'New Address'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Label</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {['Home', 'Office', 'Parents', 'Other'].map(label => (
                    <Button
                      key={label}
                      variant={form.label === label ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, label }))}
                      className="h-8"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="name" placeholder="Ahmad bin Ali" maxLength={100} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-medium pointer-events-none select-none text-sm">+60</span>
                  <Input id="phone" type="tel" inputMode="numeric" className="pl-10" placeholder="123 456789" maxLength={10} value={form.phone.replace('+60', '')} onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setForm(f => ({ ...f, phone: digits ? `+60${digits}` : '' }));
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="houseUnit">House / Unit No</Label>
                  <Input id="houseUnit" placeholder="12A" maxLength={50} value={form.houseUnitNo} onChange={e => setForm(f => ({ ...f, houseUnitNo: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1 <span className="text-destructive">*</span></Label>
                  <Input id="address1" placeholder="Street address, P.O. box" maxLength={200} value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2 <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="address2" placeholder="Apartment, suite, unit, etc." maxLength={200} value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                  <Input id="city" placeholder="Petaling Jaya" maxLength={100} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal / Zip Code <span className="text-destructive">*</span></Label>
                  <Input id="postal" type="tel" inputMode="numeric" placeholder="Postal code" maxLength={10} value={form.postalCode} onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setForm(f => ({ ...f, postalCode: digits }));
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {malaysiaStates.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} disabled />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No saved addresses</h3>
              <p className="text-muted-foreground mb-4">Save your delivery addresses for faster checkout.</p>
              <Button onClick={() => { setShowForm(true); setForm(emptyForm); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map(addr => (
              <Card key={addr.id} className={addr.isDefault ? 'ring-2 ring-primary/50' : ''}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {addr.label && (
                          <Badge variant="outline" className={labelColors[addr.label] || ''}>
                            {addr.label}
                          </Badge>
                        )}
                        {addr.isDefault && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>
                        )}
                      </div>
                      <p className="font-medium">{addr.name}</p>
                      {addr.phone && <p className="text-sm text-muted-foreground">{addr.phone}</p>}
                      <p className="text-sm text-muted-foreground">
                        {[addr.houseUnitNo, addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}, {malaysiaStates.find(s => s.id === addr.state)?.name || addr.state} {addr.postalCode}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(addr)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {!addr.isDefault && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetDefault(addr.id)} title="Set as default">
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {addresses.length < 10 && (
              <Button variant="outline" className="w-full" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Another Address ({addresses.length}/10)
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
