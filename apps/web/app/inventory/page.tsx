'use client';

import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import {
  Package,
  Layers,
  Wrench,
  AlertTriangle,
  Flame,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function InventoryDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryService.getDashboardStats(),
  });

  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(stats?.estimatedInventoryValue || 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Overview</h1>
              <p className="text-sm text-muted-foreground">
                Track your active products, stock statuses, and valuation estimates.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 border-border/80"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Data
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive font-medium">Unable to load inventory dashboard.</p>
              <Button onClick={() => refetch()} className="mt-4" size="sm">
                Try again
              </Button>
            </div>
          ) : (
            <>
              {/* Valuation & Alert Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-to-r from-primary/10 via-secondary/20 to-background border-border/80 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 p-6 pointer-events-none">
                    <TrendingUp className="h-36 w-36 text-primary" />
                  </div>
                  <CardHeader className="pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Estimated Inventory Cost
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-4xl font-extrabold tracking-tight text-foreground">
                      {formattedValue}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md">
                      This is an estimated cost calculated as <span className="font-semibold text-foreground">currentStock × purchasePrice</span> across all active inventory items. This is for reference and does not represent audited accounting valuation.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quick Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <Link href="/inventory/products/new" className="block">
                      <Button className="w-full justify-between" variant="outline">
                        <span>+ Add Product</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/inventory/adjust" className="block">
                      <Button className="w-full justify-between bg-primary hover:bg-primary/95 text-primary-foreground">
                        <span>Adjust Stock</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Products</span>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalProducts}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Unique SKUs cataloged</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finished Products</span>
                    <Layers className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalFinishedProducts}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Furniture items ready for sale</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw Materials</span>
                    <Wrench className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalRawMaterials}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Consumables & resources</p>
                  </CardContent>
                </Card>

                <Link href="/inventory/low-stock" className="block cursor-pointer">
                  <Card className="border-border/80 bg-card/60 hover:bg-secondary/20 transition-colors">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Low Stock</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-500">{stats?.lowStockProducts}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        Below minimum thresholds <ArrowRight className="h-3 w-3" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/inventory/out-of-stock" className="block cursor-pointer">
                  <Card className="border-border/80 bg-card/60 hover:bg-secondary/20 transition-colors">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Out of Stock</span>
                      <Flame className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">{stats?.outOfStockProducts}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        Zero available stock <ArrowRight className="h-3 w-3" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick info alert helper */}
              {stats?.lowStockProducts && stats.lowStockProducts > 0 ? (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <p className="text-xs text-yellow-500/90 font-medium">
                      Attention: You have {stats.lowStockProducts} product(s) running low on stock. Please review minimum levels.
                    </p>
                  </div>
                  <Link href="/inventory/low-stock">
                    <Button size="sm" variant="outline" className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10">
                      View items
                    </Button>
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
