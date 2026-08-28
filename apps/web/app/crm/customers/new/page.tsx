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
import {
  Users,
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Tag as TagIcon,
  Check,
} from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    email: '',
    dateOfBirth: '',
    gstNumber: '',
    taxId: '',
    notes: '',
    tagIds: [] as string[],
    initialAddress: {
      type: 'HOME',
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
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);

  // Fetch available tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags', 'CUSTOMER'],
    queryFn: () => crmService.getTags('CUSTOMER'),
  });

  const tags = (tagsData as any)?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => crmService.createCustomer(payload),
    onSuccess: (res: any) => {
      const createdId = res.data?.id;
      router.push(`/crm/customers/${createdId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create customer');
    },
  });

  const handlePhoneBlur = async () => {
    if (!formData.phone.trim()) return;
    try {
      const res: any = await crmService.checkCustomerDuplicate(formData.phone, formData.email);
      if (res.data?.hasDuplicates) {
        setDuplicateWarning(res.data.duplicates);
      }
    } catch {
      // Ignore background duplicate check error
    }
  };

  const handleSubmit = (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Customer name and primary phone number are required.');
      return;
    }

    const payload: any = {
      name: formData.name,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone || undefined,
      email: formData.email || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gstNumber: formData.gstNumber || undefined,
      taxId: formData.taxId || undefined,
      notes: formData.notes || undefined,
      tagIds: formData.tagIds,
    };

    if (hasAddress && formData.initialAddress.addressLine1.trim()) {
      payload.initialAddress = formData.initialAddress;
    }

    if (!force && duplicateWarning && duplicateWarning.length > 0) {
      // Show warning modal
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
            <Link href="/crm/customers">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Customers
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Customer</h1>
              <p className="text-xs text-muted-foreground">
                Register a new customer profile for sales, billing, and deliveries.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Customer Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Muhammed Ashif"
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
                    onBlur={handlePhoneBlur}
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
                    placeholder="ashif@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={handlePhoneBlur}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">GST Number (Optional)</label>
                  <Input
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Tax ID / PAN (Optional)</label>
                  <Input
                    placeholder="ABCDE1234F"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-foreground">Initial Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Customer requested delivery after 5 PM."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags Selection */}
            {tags.length > 0 && (
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-primary" /> Select Customer Tags
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
                            ? 'bg-primary text-primary-foreground border-primary'
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

            {/* Initial Address Section */}
            <Card className="border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Primary Address
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
                      <option value="HOME">HOME</option>
                      <option value="OFFICE">OFFICE</option>
                      <option value="DELIVERY">DELIVERY SITE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">Address Line 1 *</label>
                    <Input
                      placeholder="House/Flat No., Building Name, Street"
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
                      placeholder="Landmark, Area"
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
                      placeholder="e.g. Mumbai"
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
                      placeholder="e.g. Maharashtra"
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
                      placeholder="400001"
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Country</label>
                    <Input
                      value={formData.initialAddress.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialAddress: { ...formData.initialAddress, country: e.target.value },
                        })
                      }
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/crm/customers">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Create Customer'}
              </Button>
            </div>
          </form>

          {/* Duplicate Protection Warning Modal */}
          {duplicateWarning && duplicateWarning.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg border-yellow-500/40 shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2.5 rounded-full bg-yellow-500/10 text-yellow-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-yellow-500">Possible Duplicate Customer</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      A customer with matching phone or email already exists in your shop database.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="divide-y divide-border/40 border border-border/60 rounded-lg p-3 bg-secondary/20 max-h-48 overflow-y-auto">
                    {duplicateWarning.map((d: any) => (
                      <div key={d.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{d.name} ({d.customerCode})</p>
                          <p className="text-muted-foreground">{d.phone} • {d.email || 'No email'}</p>
                        </div>
                        <Link href={`/crm/customers/${d.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            View Customer
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
