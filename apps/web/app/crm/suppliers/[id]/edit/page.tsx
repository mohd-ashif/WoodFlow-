'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { Sidebar } from '../../../../../components/layout/Sidebar';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../../../../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import Link from 'next/link';
import { Building2, ArrowLeft, Check } from 'lucide-react';

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    email: '',
    gstNumber: '',
    taxId: '',
    notes: '',
    status: 'ACTIVE',
    tagIds: [] as string[],
  });

  const [errorMsg, setErrorMsg] = useState('');

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => crmService.getSupplierById(supplierId),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags', 'SUPPLIER'],
    queryFn: () => crmService.getTags('SUPPLIER'),
  });

  const supplier = (supplierData as any)?.data || supplierData;
  const tags = (tagsData as any)?.data || (Array.isArray(tagsData) ? tagsData : []);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        alternatePhone: supplier.alternatePhone || '',
        email: supplier.email || '',
        gstNumber: supplier.gstNumber || '',
        taxId: supplier.taxId || '',
        notes: supplier.notes || '',
        status: supplier.status || 'ACTIVE',
        tagIds: supplier.tags ? supplier.tags.map((t: any) => t.tag.id) : [],
      });
    }
  }, [supplier]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => crmService.updateSupplier(supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      router.push(`/crm/suppliers/${supplierId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update supplier');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Supplier name and primary phone number are required.');
      return;
    }

    updateMutation.mutate(formData);
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6">
            <div className="h-64 bg-card/60 animate-pulse rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl mx-auto space-y-6 w-full">
          <div className="flex items-center gap-4">
            <Link href={`/crm/suppliers/${supplierId}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Cancel & Profile
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Edit Supplier - {supplier?.supplierCode}
              </h1>
              <p className="text-xs text-muted-foreground">Update supplier profile details.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Supplier Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Primary Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Alternate Phone</label>
                  <Input
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">GST Number</label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tax ID / PAN</label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {tags.length > 0 && (
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {tags.map((t: any) => {
                    const isSelected = formData.tagIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {t.name}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href={`/crm/suppliers/${supplierId}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
