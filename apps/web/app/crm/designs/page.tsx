'use client';

import React, { useEffect, useState } from 'react';
import { Palette, Plus, Search, CheckCircle, FileText, RefreshCw, Layers, Ruler, Sparkles, X } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { customerDesignService } from '../../../services/customerDesignService';
import { crmService } from '../../../services/crmService';

export default function CustomerDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New design form state
  const [form, setForm] = useState({
    name: '',
    customerId: '',
    width: '',
    height: '',
    depth: '',
    material: '',
    finish: '',
    notes: '',
  });

  async function loadDesigns() {
    try {
      setLoading(true);
      const data = await customerDesignService.getDesigns();
      setDesigns(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res: any = await crmService.getCustomers({ limit: 100 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  }

  useEffect(() => {
    loadDesigns();
    loadCustomers();
  }, []);

  const handleCreateDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter a design name');
      return;
    }
    if (!form.customerId) {
      alert('Please select a customer for this custom design');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        customerId: form.customerId,
        width: form.width ? parseFloat(form.width) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        depth: form.depth ? parseFloat(form.depth) : undefined,
        material: form.material || undefined,
        finish: form.finish || undefined,
        notes: form.notes || undefined,
      };
      await customerDesignService.createDesign(payload);
      setIsModalOpen(false);
      setForm({ name: '', customerId: '', width: '', height: '', depth: '', material: '', finish: '', notes: '' });
      loadDesigns();
    } catch (err: any) {
      console.error('Failed to create custom design:', err);
      alert(err?.message || 'Failed to create custom design');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = designs.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.designNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <PageHeader
        title="Customer Custom Designs"
        description="Custom furniture specifications, dimensions, finish selections & quotation linkage."
        icon={Palette}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDesigns}
              disabled={loading}
              className="gap-1.5 border-border/80"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4" />
              Add Custom Design
            </Button>
          </div>
        }
      />

      {/* Search and Filters */}
      <Card className="border-border/80 p-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <SearchInput
            placeholder="Search by design #, name, or customer..."
            value={search}
            onChange={setSearch}
            className="w-full sm:w-80"
          />
          <span className="text-xs text-muted-foreground font-mono">
            Total Designs: <strong className="text-foreground font-semibold">{filtered.length}</strong>
          </span>
        </div>
      </Card>

      {/* Grid of Design Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-400 opacity-60" />
            <p className="text-sm font-medium">Loading Custom Designs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border/80 rounded-xl space-y-3 bg-card/40">
            <Palette className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="font-semibold text-foreground text-sm">No custom designs found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create custom furniture design specifications for your customers.</p>
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-3.5 w-3.5" />
              Create First Design
            </Button>
          </div>
        ) : (
          filtered.map((design) => (
            <Card
              key={design.id}
              className="border-border/80 hover:border-purple-500/50 transition-all duration-200 shadow-sm p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[11px] font-mono text-purple-400 bg-purple-500/10 border-purple-500/20">
                    {design.designNumber || 'DESIGN'}
                  </Badge>
                  <Badge
                    variant={design.status === 'APPROVED' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {design.status || 'DRAFT'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-base tracking-tight">{design.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customer: <span className="text-foreground font-medium">{design.customer?.name || 'Walk-in Customer'}</span>
                  </p>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-2 bg-secondary/40 p-2.5 rounded-lg text-center text-xs border border-border/40">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Width</div>
                    <div className="font-semibold text-foreground font-mono mt-0.5">{design.width || '-'} <span className="text-[10px] text-muted-foreground">mm</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Height</div>
                    <div className="font-semibold text-foreground font-mono mt-0.5">{design.height || '-'} <span className="text-[10px] text-muted-foreground">mm</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Depth</div>
                    <div className="font-semibold text-foreground font-mono mt-0.5">{design.depth || '-'} <span className="text-[10px] text-muted-foreground">mm</span></div>
                  </div>
                </div>

                {/* Specification Details */}
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  {design.material && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium text-foreground">{design.material}</span>
                    </div>
                  )}
                  {design.finish && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Finish:</span>
                      <span className="font-medium text-foreground">{design.finish}</span>
                    </div>
                  )}
                  {design.notes && (
                    <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-border/30 line-clamp-2">
                      "{design.notes}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Custom Design Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-border/80 shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                New Customer Custom Design
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateDesign} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Design Name / Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Modern Teak L-Shape Sofa System"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Select Customer *
                  </label>
                  <select
                    required
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Width (mm)
                    </label>
                    <Input
                      type="number"
                      placeholder="1800"
                      value={form.width}
                      onChange={(e) => setForm({ ...form, width: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Height (mm)
                    </label>
                    <Input
                      type="number"
                      placeholder="850"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Depth (mm)
                    </label>
                    <Input
                      type="number"
                      placeholder="900"
                      value={form.depth}
                      onChange={(e) => setForm({ ...form, depth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Material Spec
                    </label>
                    <Input
                      placeholder="e.g. Teak Wood + HD Foam"
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Finish / Polish
                    </label>
                    <Input
                      placeholder="e.g. Walnut Matte PU"
                      value={form.finish}
                      onChange={(e) => setForm({ ...form, finish: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Customization Notes & Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specific cushion firmness, brass handles, fabric code..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {submitting ? 'Saving...' : 'Save Design'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

