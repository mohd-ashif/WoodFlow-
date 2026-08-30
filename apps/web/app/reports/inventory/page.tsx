'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell';
import { analyticsService } from '../../../services/analyticsService';
import { ExportButton } from '../../../components/analytics/ExportButton';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Package, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

function formatCurrency(val: number) {
  return '₹' + (val || 0).toLocaleString('en-IN');
}

export default function InventoryReportPage() {
  const { data: invRes, isLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: async () => {
      return analyticsService.getInventoryReports();
    },
  });

  const report = invRes?.data || invRes;
  const summary = report?.summary;
  const lowStockList = report?.lowStockList || [];
  const outOfStockList = report?.outOfStockList || [];
  const fullInventory = report?.fullInventory || [];

  return (
    <AppShell title="Inventory Valuation & Stock Reports">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Inventory Valuation & Stock Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Current stock holding values, minimum stock warnings, and inventory audit logs.
            </p>
          </div>

          <ExportButton reportType="inventory" label="Export Inventory CSV" />
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Inventory Value</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(summary?.totalInventoryValue || 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Cost Valuation</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Stock Units</div>
              <div className="text-xl font-bold text-foreground mt-1">{(summary?.totalStockUnits || 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-muted-foreground mt-1">Units in Warehouses</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase font-semibold">Active Products</div>
              <div className="text-xl font-bold text-foreground mt-1">{summary?.totalProducts || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Catalog Items</div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="text-xs text-amber-600 dark:text-amber-400 uppercase font-semibold">Low Stock Alerts</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary?.lowStockCount || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Below Minimum Level</div>
            </CardContent>
          </Card>

          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="pt-6">
              <div className="text-xs text-rose-600 dark:text-rose-400 uppercase font-semibold">Out of Stock</div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{summary?.outOfStockCount || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Zero Available Stock</div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock & Out of Stock Tables */}
        {(lowStockList.length > 0 || outOfStockList.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Low Stock Warning List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="text-right text-amber-600 font-bold">{item.currentStock}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.minStockLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-rose-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Out of Stock List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-right text-rose-600 font-bold">0</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Inventory Valuation Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Complete Stock Valuation Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Stock Valuation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fullInventory.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.sku || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-right font-bold">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.costPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.stockValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
