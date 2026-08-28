'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../../../../services/crmService';
import { salesService } from '../../../../services/salesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import Link from 'next/link';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  Edit,
  Archive,
  RotateCcw,
  Plus,
  ArrowLeft,
  Trash2,
  Tag as TagIcon,
  AlertTriangle,
  Calendar,
  Building2,
} from 'lucide-react';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'notes' | 'sales' | 'timeline'>('info');
  const [noteContent, setNoteContent] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'DELIVERY',
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const { data: customerData, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => crmService.getCustomerById(customerId),
    enabled: Boolean(customerId && customerId !== 'undefined'),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['customer-activities', customerId],
    queryFn: () => crmService.getCustomerActivities(customerId),
    enabled: Boolean(customerId && customerId !== 'undefined'),
  });

  const { data: salesData } = useQuery({
    queryKey: ['customer-sales', customerId],
    queryFn: () => salesService.getSales({ customerId }),
    enabled: Boolean(customerId && customerId !== 'undefined'),
  });

  const customer = (customerData as any)?.data || customerData;
  const activities = (activitiesData as any)?.data || (activitiesData as any)?.items || (Array.isArray(activitiesData) ? activitiesData : []);
  const customerSales = (salesData as any)?.data || (Array.isArray(salesData) ? salesData : []);

  const noteMutation = useMutation({
    mutationFn: (content: string) => crmService.addCustomerNote(customerId, content),
    onSuccess: () => {
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-activities', customerId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => crmService.deleteCustomerNote(customerId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: (payload: any) => crmService.addCustomerAddress(customerId, payload),
    onSuccess: () => {
      setIsAddingAddress(false);
      setNewAddress({
        type: 'DELIVERY',
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => crmService.deleteCustomerAddress(customerId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => crmService.archiveCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => crmService.restoreCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6">
            <div className="h-32 bg-card/60 animate-pulse rounded-xl" />
            <div className="h-64 bg-card/60 animate-pulse rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Customer profile not found</h2>
            <Link href="/crm/customers">
              <Button size="sm">Back to Customers</Button>
            </Link>
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
        <main className="flex-1 p-8 space-y-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/crm/customers">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Customers
              </Button>
            </Link>
          </div>

          {/* Profile Header */}
          <Card className="border-border/80 p-6 bg-gradient-to-r from-primary/5 via-card to-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground font-semibold">
                    {customer.customerCode}
                  </span>
                  <Badge
                    variant={
                      customer.status === 'ACTIVE'
                        ? 'default'
                        : customer.status === 'ARCHIVED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {customer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created on {new Date(customer.createdAt).toLocaleDateString()}
                  {customer.creator?.name && ` by ${customer.creator.name}`}
                </p>
              </div>

              {/* Actions & Call/Email Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                      <Phone className="h-4 w-4" /> Call
                    </Button>
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                      <Mail className="h-4 w-4" /> Email
                    </Button>
                  </a>
                )}
                <Link href={`/crm/customers/${customer.id}/edit`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                </Link>
                {customer.status === 'ARCHIVED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreMutation.mutate()}
                    disabled={restoreMutation.isPending}
                    className="gap-1.5 border-emerald-500/30 text-emerald-600"
                  >
                    <RotateCcw className="h-4 w-4" /> Restore
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                    className="gap-1.5"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </Button>
                )}
              </div>
            </div>

            {/* Tags preview */}
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/40 mt-4">
                {customer.tags.map((t: any) => (
                  <span
                    key={t.tag.id}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-2">
            {[
              { id: 'info', label: 'Contact Details', icon: Users },
              { id: 'addresses', label: `Addresses (${customer.addresses?.length || 0})`, icon: MapPin },
              { id: 'notes', label: `Notes (${customer.notesList?.length || 0})`, icon: FileText },
              { id: 'sales', label: 'Sales History', icon: Building2 },
              { id: 'timeline', label: 'Activity Timeline', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="gap-2 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab 1: Contact Details */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Primary Phone:</span>
                    <p className="font-semibold text-sm text-foreground mt-0.5">{customer.phone}</p>
                  </div>
                  {customer.alternatePhone && (
                    <div>
                      <span className="text-muted-foreground">Alternate Phone:</span>
                      <p className="font-medium text-foreground mt-0.5">{customer.alternatePhone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground mt-0.5">{customer.email || '—'}</p>
                  </div>
                  {customer.dateOfBirth && (
                    <div>
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {new Date(customer.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Tax & Business Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">GST Number:</span>
                    <p className="font-mono text-sm text-foreground mt-0.5">{customer.gstNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax ID / PAN:</span>
                    <p className="font-mono text-sm text-foreground mt-0.5">{customer.taxId || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Orders:</span>
                    <p className="font-semibold text-foreground mt-0.5">{customer.totalOrdersDisplay || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outstanding Balance:</span>
                    <p className="font-semibold text-foreground mt-0.5">{customer.outstandingBalanceDisplay || '₹0.00'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 2: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Saved Addresses</h3>
                <Button size="sm" onClick={() => setIsAddingAddress(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Address
                </Button>
              </div>

              {isAddingAddress && (
                <Card className="border-primary/40 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm">New Address</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        className="w-full h-9 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="HOME">HOME</option>
                        <option value="OFFICE">OFFICE</option>
                        <option value="DELIVERY">DELIVERY SITE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Address Label (Optional)</label>
                      <Input
                        placeholder="e.g. Factory Site"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium">Address Line 1 *</label>
                      <Input
                        placeholder="Building / Street"
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium">Address Line 2</label>
                      <Input
                        placeholder="Landmark"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">City *</label>
                      <Input
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">State *</label>
                      <Input
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Postal Code *</label>
                      <Input
                        placeholder="Postal Code"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      />
                      <label htmlFor="isDefault" className="text-xs font-medium">Set as Default</label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setIsAddingAddress(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={addAddressMutation.isPending || !newAddress.addressLine1 || !newAddress.city}
                        onClick={() => addAddressMutation.mutate(newAddress)}
                      >
                        Save Address
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((addr: any) => (
                    <Card key={addr.id} className="border-border/80 relative">
                      <CardContent className="p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {addr.type}
                            </Badge>
                            {addr.isDefault && (
                              <Badge variant="default" className="text-[10px]">
                                Default
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => deleteAddressMutation.mutate(addr.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="font-semibold text-sm text-foreground pt-1">
                          {addr.addressLine1}
                        </p>
                        {addr.addressLine2 && <p className="text-muted-foreground">{addr.addressLine2}</p>}
                        <p className="text-muted-foreground font-medium">
                          {addr.city}, {addr.state} - {addr.postalCode} ({addr.country})
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground col-span-2 py-4">No addresses added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <Card className="border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Add Customer Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="e.g. Customer requested delivery after 5 PM."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!noteContent.trim() || noteMutation.isPending}
                      onClick={() => noteMutation.mutate(noteContent)}
                    >
                      {noteMutation.isPending ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {customer.notesList && customer.notesList.length > 0 ? (
                  customer.notesList.map((n: any) => (
                    <Card key={n.id} className="border-border/60">
                      <CardContent className="p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {n.creator?.name || 'Staff User'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => deleteNoteMutation.mutate(n.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {n.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No notes recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Sales History */}
          {activeTab === 'sales' && (
            <Card className="border-border/80 p-6">
              <CardHeader className="pb-4 pt-0 px-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Sales Orders History ({customerSales.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                {customerSales.length > 0 ? (
                  <div className="divide-y divide-border/40 border border-border/60 rounded-lg overflow-hidden text-xs">
                    {customerSales.map((sale: any) => (
                      <div key={sale.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/sales/${sale.id}`} className="font-mono font-semibold text-primary hover:underline">
                              {sale.saleNumber}
                            </Link>
                            <Badge variant={sale.status === 'CONFIRMED' ? 'default' : sale.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {sale.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-foreground text-sm">
                            ₹{sale.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <Link href={`/sales/${sale.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">View Order</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">No sales recorded for this customer yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 4: Activity Timeline */}
          {activeTab === 'timeline' && (
            <Card className="border-border/80 p-6">
              <CardHeader className="pb-4 pt-0 px-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Activity History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                {activities.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {activities.map((act: any) => (
                      <div key={act.id} className="relative flex items-start gap-3 text-xs">
                        <div className="absolute left-[-1.15rem] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex-1 bg-secondary/30 rounded-lg p-3 border border-border/40">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{act.title}</span>
                            <span className="text-muted-foreground text-[11px]">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-muted-foreground text-xs mt-1 whitespace-pre-wrap">
                              {act.description}
                            </p>
                          )}
                          {act.creator?.name && (
                            <span className="text-[10px] text-muted-foreground/80 block mt-2">
                              By {act.creator.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">No recorded activity history.</p>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
