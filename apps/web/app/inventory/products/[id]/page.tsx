'use client';

import React from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../../services/inventoryService';
import { Button } from '../../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/ui/Table';
import { ArrowLeft, Edit, AlertTriangle, Calendar, User, AlignLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: () => inventoryService.getProductById(id),
  });

  const product = result?.product;
  const movements = result?.movements || [];

  const getStockStatusBadge = (prod: any) => {
    if (!prod.isActive) {
      return <Badge variant="danger">Inactive</Badge>;
    }
    if (prod.currentStock <= 0) {
      return <Badge variant="danger">Out of Stock</Badge>;
    }
    if (prod.currentStock <= prod.minimumStock) {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'OPENING_STOCK':
        return <Badge variant="default">Opening Stock</Badge>;
      case 'STOCK_ADJUSTMENT_IN':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Adjustment In</Badge>;
      case 'STOCK_ADJUSTMENT_OUT':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Adjustment Out</Badge>;
      case 'STOCK_CORRECTION':
        return <Badge variant="default">Correction</Badge>;
      case 'DAMAGE':
        return <Badge variant="danger">Damage</Badge>;
      case 'LOST':
        return <Badge variant="danger">Lost</Badge>;
      case 'INITIAL_IMPORT':
        return <Badge variant="default">Initial Import</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-card rounded-md" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-card rounded-xl lg:col-span-2" />
              <div className="h-96 bg-card rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 max-w-lg mx-auto">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">Failed to load product details</h3>
              <p className="mt-1 text-xs text-muted-foreground">The product may not exist or access was denied.</p>
              <Link href="/inventory/products" className="mt-4 inline-block">
                <Button size="sm">Back to Products</Button>
              </Link>
            </div>
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
        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/inventory/products">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
                  {getStockStatusBadge(product)}
                </div>
                <p className="text-sm text-muted-foreground">SKU: <span className="font-mono uppercase">{product.sku}</span></p>
              </div>
            </div>
            <Link href={`/inventory/products/${product.id}/edit`}>
              <Button className="gap-2 bg-primary">
                <Edit className="h-4 w-4" /> Edit Product
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Block: Basic, Pricing & Inventory specifications */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product specifications card */}
              <Card className="border-border/80 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Classification</span>
                    <p className="text-sm font-medium text-foreground">
                      {product.productType === 'FINISHED_PRODUCT' ? 'Finished Furniture Piece' : 'Raw Material Resource'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
                    <p className="text-sm font-medium text-foreground">{product.category?.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Standard Measurement Unit</span>
                    <p className="text-sm font-medium text-foreground">
                      {product.unit?.name} ({product.unit?.shortCode})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date Cataloged</span>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Description card */}
              <Card className="border-border/80 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlignLeft className="h-4.5 w-4.5 text-primary" /> Product Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description || <span className="italic text-xs opacity-60">No catalog description registered.</span>}
                  </p>
                </CardContent>
              </Card>

              {/* Movement history logs */}
              <Card className="border-border/80 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-base">Recent Stock Movements</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {movements.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                      No stock movements recorded for this item.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-card/20 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Date</TableHead>
                            <TableHead>Movement Type</TableHead>
                            <TableHead className="text-right">Adjustment Qty</TableHead>
                            <TableHead className="text-right">Warehouse Levels</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map((m: any) => {
                            const isQtyIn = m.movementType.includes('IN') || m.movementType === 'OPENING_STOCK' || m.movementType === 'INITIAL_IMPORT';
                            return (
                              <TableRow key={m.id} className="hover:bg-muted/10 text-xs">
                                <TableCell className="whitespace-nowrap">
                                  {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>{getMovementBadge(m.movementType)}</TableCell>
                                <TableCell className={`text-right font-semibold font-mono ${isQtyIn ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {isQtyIn ? '+' : '-'}{m.quantity}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                  {m.previousQuantity} → {m.newQuantity}
                                </TableCell>
                                <TableCell className="font-medium text-foreground flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" /> {m.user?.name || 'System'}
                                </TableCell>
                                <TableCell className="text-muted-foreground italic max-w-[150px] truncate" title={m.reason}>
                                  {m.reason}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Block: Level & Pricing metrics */}
            <div className="space-y-6">
              {/* Level metrics card */}
              <Card className="border-border/80 bg-card/40">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stock Level</span>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-5xl font-extrabold tracking-tight text-foreground font-mono">
                      {product.currentStock} <span className="text-lg font-normal text-muted-foreground">{product.unit?.shortCode}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Available Stock quantity currently in storage.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Minimum Threshold Level:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {product.minimumStock} {product.unit?.shortCode}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing card */}
              <Card className="border-border/80 bg-card/40">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pricing Specifications</span>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">Purchase Cost:</span>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      ₹{product.purchasePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-xs text-muted-foreground">Selling Price:</span>
                    <span className="font-mono text-sm font-semibold text-primary">
                      ₹{product.sellingPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Gross Margin Estimate:</span>
                    <span className="font-semibold text-emerald-500 font-mono">
                      ₹{(product.sellingPrice - product.purchasePrice).toLocaleString('en-IN')} (
                      {product.purchasePrice > 0
                        ? (((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
