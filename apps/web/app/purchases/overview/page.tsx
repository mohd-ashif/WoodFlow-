'use client';

import React from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '../../../services/purchasesService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Users,
  ArrowRight,
} from 'lucide-react';

export default function PurchasesOverviewPage() {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['purchases-overview'],
    queryFn: () => purchasesService.getPurchaseOverview(),
  });

  const overview = (responseData as any)?.data || responseData || {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <ShoppingBag className="h-7 w-7 text-primary" />
                Purchases Overview
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Executive summary of supplier purchases, incoming inventory, and supplier procurement value.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/purchases">
                <Button size="sm" variant="outline">
                  View All Orders
                </Button>
              </Link>
              <Link href="/purchases/new">
                <Button size="sm" className="gap-2 font-semibold">
                  <Plus className="h-4 w-4" /> New Purchase Order
                </Button>
              </Link>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1 text-foreground">
                    {isLoading ? '...' : overview.totalPurchasesCount || 0}
                  </h3>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Confirmed Value</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-500 font-mono">
                    ₹{isLoading ? '...' : (overview.totalPurchasesValue || 0).toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Drafts</p>
                  <h3 className="text-2xl font-bold mt-1 text-amber-500">
                    {isLoading ? '...' : overview.pendingPurchasesCount || 0}
                  </h3>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Cancelled Orders</p>
                  <h3 className="text-2xl font-bold mt-1 text-rose-500">
                    {isLoading ? '...' : overview.cancelledPurchasesCount || 0}
                  </h3>
                </div>
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                  <XCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Top Suppliers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Active Suppliers */}
            <Card className="lg:col-span-8 border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Active Suppliers
                </CardTitle>
                <Link href="/crm/suppliers">
                  <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                    Manage Suppliers <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-card/60 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : !overview.topSuppliers || overview.topSuppliers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No suppliers registered yet. Create suppliers in CRM.
                  </p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {overview.topSuppliers.map((s: any) => (
                      <div key={s.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors text-xs">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{s.name}</p>
                          <p className="text-muted-foreground font-mono text-[11px]">
                            {s.supplierCode} • Phone: {s.phone}
                          </p>
                        </div>
                        <Link href={`/crm/suppliers/${s.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Procurement Workflow */}
            <Card className="lg:col-span-4 border-border/80 bg-secondary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Procurement Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Select Supplier & Add Items</p>
                    <p className="text-[11px] mt-0.5">Pick registered CRM supplier and specify product acquisition costs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Confirm Purchase</p>
                    <p className="text-[11px] mt-0.5">Automated Stock IN increases current inventory stock balance.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Track Stock Movements</p>
                    <p className="text-[11px] mt-0.5">Stock IN movements logged on inventory ledger and audit trail.</p>
                  </div>
                </div>

                <Link href="/purchases/new" className="block pt-2">
                  <Button size="sm" className="w-full text-xs font-semibold gap-1.5">
                    <Plus className="h-4 w-4" /> Create Purchase Order
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
