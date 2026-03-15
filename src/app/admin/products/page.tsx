'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, X, Save, ToggleLeft, ToggleRight,
  Package2, Tag, Palette, Star, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TikTokVideo { videoId: string; url: string; caption: string; }

interface AdminProduct {
  id: string; name: string; displayName: string;
  width: number; height: number; price: number;
  description: string; isActive: boolean;
  shortDescription: string; fullDescription: string;
  images: string[]; tag: string; accentColor: string;
  features: string[]; tiktokVideos: TikTokVideo[];
  rating: number; reviewCount: number; popular: boolean;
  metaSource: 'db' | 'json';
}

type Mode = 'list' | 'edit' | 'add';

const TAG_OPTIONS = ['MINI', 'CLASSIC', 'BESTSELLER', 'PREMIUM', 'STANDARD', 'NEW', 'LIMITED'];
const COLOR_PRESETS = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981',
  '#ef4444', '#ec4899', '#8b5cf6', '#f97316',
];

/* ─── Toast ─── */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold',
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      )}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

/* ─── Product card (list view) ─── */
function ProductCard({ product, onEdit, onToggle, toggling }: {
  product: AdminProduct;
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border bg-card overflow-hidden transition-opacity',
        !product.isActive && 'opacity-50'
      )}
    >
      {/* Colour bar */}
      <div className="h-1.5 w-full" style={{ background: product.accentColor }} />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black">{product.name}</h3>
              <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase"
                style={{ background: `${product.accentColor}22`, color: product.accentColor, border: `1px solid ${product.accentColor}44` }}>
                {product.tag}
              </span>
              {product.popular && <Sparkles className="w-3.5 h-3.5" style={{ color: product.accentColor }} />}
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                product.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.displayName}</p>
          </div>
          <p className="text-2xl font-black shrink-0" style={{ color: product.accentColor }}>
            RM{product.price.toFixed(2)}
          </p>
        </div>

        {/* Meta source badge */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className={cn('px-1.5 py-0.5 rounded font-mono',
            product.metaSource === 'db' ? 'bg-primary/10 text-primary' : 'bg-muted')}>
            {product.metaSource === 'db' ? '● DB' : '○ JSON'}
          </span>
          <span>{product.images.length} image{product.images.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{product.features.length} feature{product.features.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
          <span>{product.rating.toFixed(1)}</span>
        </div>

        {/* Short desc */}
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.shortDescription}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onToggle} disabled={toggling}>
            {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              product.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
            {product.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Edit / Add form ─── */
function ProductForm({ product, onSave, onCancel, saving }: {
  product: AdminProduct | null;
  onSave: (data: Partial<AdminProduct>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isNew = !product;
  const [form, setForm] = useState({
    name: product?.name ?? '',
    displayName: product?.displayName ?? '',
    width: product?.width?.toString() ?? '',
    height: product?.height?.toString() ?? '',
    price: product?.price?.toString() ?? '',
    description: product?.description ?? '',
    tag: product?.tag ?? 'STANDARD',
    accentColor: product?.accentColor ?? '#6366f1',
    shortDescription: product?.shortDescription ?? '',
    fullDescription: product?.fullDescription ?? '',
    featuresRaw: product?.features?.join(', ') ?? '',
    popular: product?.popular ?? false,
    rating: product?.rating?.toString() ?? '4.8',
    reviewCount: product?.reviewCount?.toString() ?? '0',
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    onSave({
      name: form.name,
      displayName: form.displayName,
      width: parseFloat(form.width),
      height: parseFloat(form.height),
      price: parseFloat(form.price),
      description: form.description,
      tag: form.tag,
      accentColor: form.accentColor,
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      features: form.featuresRaw.split(',').map(s => s.trim()).filter(Boolean),
      popular: form.popular,
      rating: parseFloat(form.rating),
      reviewCount: parseInt(form.reviewCount),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black">{isNew ? 'Add New Product' : `Edit — ${product.name}`}</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Print Size Basics */}
        <div className="sm:col-span-2 rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Package2 className="w-3.5 h-3.5" /> Print Size
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. 5R" disabled={!isNew} />
            <Field label="Display Name *" value={form.displayName} onChange={v => set('displayName', v)} placeholder="5R (5 x 7 inches)" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Width (in) *" value={form.width} onChange={v => set('width', v)} placeholder="5.0" type="number" />
            <Field label="Height (in) *" value={form.height} onChange={v => set('height', v)} placeholder="7.0" type="number" />
            <Field label="Price (RM) *" value={form.price} onChange={v => set('price', v)} placeholder="2.00" type="number" />
          </div>
          <Field label="Short tagline" value={form.description} onChange={v => set('description', v)} placeholder="Larger format prints" />
        </div>

        {/* Tag + Color */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Tag
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {TAG_OPTIONS.map(t => (
              <button key={t} onClick={() => set('tag', t)}
                className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors',
                  form.tag === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} className="w-4 h-4" />
              Mark as Popular (shows sparkle badge)
            </label>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Accent Color
          </h3>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map(c => (
              <button key={c} onClick={() => set('accentColor', c)}
                className={cn('w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                  form.accentColor === c ? 'border-white scale-110 ring-2 ring-offset-1' : 'border-transparent')}
                style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <span className="text-xs font-mono text-muted-foreground">{form.accentColor}</span>
            <div className="w-5 h-5 rounded-full" style={{ background: form.accentColor }} />
          </div>
        </div>

        {/* Marketing copy */}
        <div className="sm:col-span-2 rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Marketing Content
          </h3>
          <Field label="Short description" value={form.shortDescription} onChange={v => set('shortDescription', v)}
            placeholder="One-liner shown on the product card" />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Full description</label>
            <textarea value={form.fullDescription} onChange={e => set('fullDescription', e.target.value)}
              rows={4} placeholder="Long marketing copy shown on the product detail page..."
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <Field label="Features (comma-separated)" value={form.featuresRaw} onChange={v => set('featuresRaw', v)}
            placeholder="Wallet-size, Keepsake ready, Pocket-friendly" />
        </div>

        {/* Rating */}
        <div className="sm:col-span-2 rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> Rating
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating (0–5)" value={form.rating} onChange={v => set('rating', v)} type="number" placeholder="4.8" />
            <Field label="Review count" value={form.reviewCount} onChange={v => set('reviewCount', v)} type="number" placeholder="0" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="gap-2" onClick={handleSubmit} disabled={saving || !form.name || !form.price}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </motion.div>
  );
}

/* ─── Simple text field ─── */
function Field({ label, value, onChange, placeholder, type = 'text', disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  );
}

/* ─── Page ─── */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = async () => {
    try {
      const r = await fetch('/api/admin/products');
      const data = await r.json();
      if (data.success) setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleEdit = (product: AdminProduct) => {
    setEditing(product);
    setMode('edit');
  };

  const handleAdd = () => {
    setEditing(null);
    setMode('add');
  };

  const handleCancel = () => {
    setMode('list');
    setEditing(null);
  };

  const handleSave = async (data: Partial<AdminProduct>) => {
    setSaving(true);
    try {
      let res;
      if (mode === 'add') {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(`/api/admin/products/${editing!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      const result = await res.json();
      if (result.success) {
        showToast(mode === 'add' ? 'Product created!' : 'Product updated!');
        setMode('list');
        setEditing(null);
        await loadProducts();
      } else {
        showToast(result.error ?? 'Failed to save', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: AdminProduct) => {
    setToggling(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'PATCH' });
      const result = await res.json();
      if (result.success) {
        showToast(`Product ${result.isActive ? 'enabled' : 'disabled'}`);
        await loadProducts();
      } else {
        showToast(result.error ?? 'Failed to toggle', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-semibold">Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-semibold">Products</span>
          </nav>
          <span className="text-[10px] font-black tracking-widest bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase">
            Admin Panel
          </span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          {mode === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Page title */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black">Product Management</h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Manage print sizes, pricing, and marketing metadata.
                    <span className="ml-2 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                      ● DB = saved to database · ○ JSON = from products-meta.json
                    </span>
                  </p>
                </div>
                <Button className="gap-2" onClick={handleAdd}>
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </div>

              {/* Product grid */}
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl border bg-card p-5 space-y-3 animate-pulse">
                      <div className="h-1.5 bg-muted rounded w-full" />
                      <div className="h-6 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-8 bg-muted rounded mt-4" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Package2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No products found</p>
                  <p className="text-sm mt-1">Click "Add Product" to create your first print size.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => handleEdit(product)}
                      onToggle={() => handleToggle(product)}
                      toggling={toggling === product.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProductForm
                product={mode === 'edit' ? editing : null}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
