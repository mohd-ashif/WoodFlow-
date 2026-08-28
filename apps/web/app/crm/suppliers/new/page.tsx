'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { crmService } from '../../../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import Link from 'next/link';
import { Building2, ArrowLeft, AlertTriangle, MapPin, Tag as TagIcon, Check } from 'lucide-react';

export default function NewSupplierPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    email: '',
    gstNumber: '',
    taxId: '',
    notes: '',
    tagIds: [] as string[],
    initialAddress: {
      type: 'OFFICE',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
  });

  const [hasAddress, setHasAddress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  const { data: tagsData } = useQuery({
    queryKey: ['tags', 'SUPPLIER'],
    queryFn: () => crmService.getTags('SUPPLIER'),
  });

  const tags = (tagsData as any)?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => crmService.createSupplier(payload),
    onSuccess: (res: any) => {
      const createdId = res.data?.id;
      router.push(`/crm/suppliers/${createdId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create supplier');
    },
  });

  const handleDuplicateCheck = async () => {
    if (!formData.phone.trim() && !formData.email.trim() && !formData.gstNumber.trim()) return;
    try {
      const res: any = await crmService.checkSupplierDuplicate(
        formData.phone,
        formData.email,
        formData.gstNumber
      );
      if (res.data?.hasDuplicates) {
        setDuplicateWarning(res.data);
      }
    } catch {
      // Ignore background error
    }
  };

  const handleSubmit = (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Supplier name and primary phone number are required.');
      return;
    }

    const payload: any = {
      name: formData.name,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone || undefined,
      email: formData.email || undefined,
      gstNumber: formData.gstNumber || undefined,
      taxId: formData.taxId || undefined,
      notes: formData.notes || undefined,
      tagIds: formData.tagIds,
    };

    if (hasAddress && formData.initialAddress.addressLine1.trim()) {
      payload.initialAddress = formData.initialAddress;
    }

    if (!force && duplicateWarning && duplicateWarning.hasDuplicates) {
      return;
    }

    createMutation.mutate(payload);
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl mx-auto space-y-6 w-full">
          <div className="flex items-center gap-4">
            <Link href="/crm/suppliers">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Suppliers
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Supplier</h1>
              <p className="text-xs text-muted-foreground">
                Register a timber, wood, fabric, or hardware vendor.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" /> Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Supplier Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. ABC Timber Works"
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
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handleDuplicateCheck}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Alternate Phone</label>
                  <Input
                    placeholder="e.g. 9123456789"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <Input
                    type="email"
                    placeholder="sales@abctimber.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">GST Number (Recommended)</label>
                  <Input
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    onBlur={handleDuplicateCheck}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tax ID / PAN</label>
                  <Input
                    placeholder="ABCDE1234F"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Supplier requested payment within 30 days."
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
                  <CardTitle className="text-base flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-amber-500" /> Supplier Tags
                  </CardTitle>
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

            {/* Address */}
            <Card className="border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-500" /> Office / Warehouse Address
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHasAddress(!hasAddress)}
                  className="text-xs h-7"
                >
                  {hasAddress ? 'Remove Address' : '+ Add Address Now'}
                </Button>
              </CardHeader>
              {hasAddress && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Address Type</label>
                    <select
                      value={formData.initialAddress.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, type: e.target.value },
                        })
                      }
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="OFFICE">OFFICE</option>
                      <option value="WAREHOUSE">WAREHOUSE</option>
                      <option value="BILLING">BILLING</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">Address Line 1 *</label>
                    <Input
                      placeholder="Premises / Industrial Estate"
                      value={formData.initialAddress.addressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, addressLine1: e.target.value },
                        })
                      }
                      required={hasAddress}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">Address Line 2</label>
                    <Input
                      placeholder="Area / Zone"
                      value={formData.initialAddress.addressLine2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, addressLine2: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">City *</label>
                    <Input
                      placeholder="City"
                      value={formData.initialAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, city: e.target.value },
                        })
                      }
                      required={hasAddress}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">State *</label>
                    <Input
                      placeholder="State"
                      value={formData.initialAddress.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, state: e.target.value },
                        })
                      }
                      required={hasAddress}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Postal Code *</label>
                    <Input
                      placeholder="Postal Code"
                      value={formData.initialAddress.postalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, postalCode: e.target.value },
                        })
                      }
                      required={hasAddress}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/crm/suppliers">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Create Supplier'}
              </Button>
            </div>
          </form>

          {/* Duplicate Warning Modal */}
          {duplicateWarning && duplicateWarning.hasDuplicates && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg border-yellow-500/40 shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2.5 rounded-full bg-yellow-500/10 text-yellow-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-yellow-500">
                      {duplicateWarning.hasGstMatch ? 'Exact GST Match Warning' : 'Possible Duplicate Supplier'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {duplicateWarning.hasGstMatch
                        ? 'A supplier with this exact GST Number already exists!'
                        : 'A supplier with matching contact details already exists.'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="divide-y divide-border/40 border border-border/60 rounded-lg p-3 bg-secondary/20 max-h-48 overflow-y-auto">
                    {duplicateWarning.duplicates.map((d: any) => (
                      <div key={d.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{d.name} ({d.supplierCode})</p>
                          <p className="text-muted-foreground">{d.phone} • {d.gstNumber || 'No GST'}</p>
                        </div>
                        <Link href={`/crm/suppliers/${d.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            View Supplier
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDuplicateWarning(null)}
                    >
                      Review Form
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        setDuplicateWarning(null);
                        handleSubmit(e as any, true);
                      }}
                    >
                      Create Anyway
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
