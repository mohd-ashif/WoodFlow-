'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ShieldCheck, Database, Cloud, Server, RefreshCw, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { api } from '../../../lib/api';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [consistency, setConsistency] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchHealthAndConsistency = async () => {
    setIsLoading(true);
    try {
      const [hRes, cRes] = await Promise.all([
        api.get('/system/health').catch(() => ({ data: { success: false, data: null } })),
        api.get('/system/data-consistency').catch(() => ({ data: { success: false, data: null } }))
      ]);

      if ((hRes as any)?.data?.success) setHealth((hRes as any).data.data);
      if ((cRes as any)?.data?.success) setConsistency((cRes as any).data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndConsistency();
  }, []);

  const runFullAudit = async () => {
    setIsAuditing(true);
    await fetchHealthAndConsistency();
    setIsAuditing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <ShieldCheck className="h-7 w-7 text-primary" />
                System Health & Data Consistency Audit
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor database connectivity, stock movement cumulative consistency, and cloud infrastructure.
              </p>
            </div>

            <Button
              onClick={runFullAudit}
              disabled={isAuditing || isLoading}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCw className={`h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
              Run Health Audit
            </Button>
          </div>

          {/* Infrastructure Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-500" /> Neon PostgreSQL
                  </p>
                  <h3 className="text-xl font-bold mt-2 text-foreground flex items-center gap-2">
                    {health?.database?.status === 'healthy' ? 'Healthy' : 'Connecting...'}
                    <Badge variant={health?.database?.status === 'healthy' ? 'success' : 'warning'}>
                      {health?.database?.latencyMs || 0} ms
                    </Badge>
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="h-4 w-4 text-blue-500" /> Cloudinary Media
                  </p>
                  <h3 className="text-xl font-bold mt-2 text-foreground capitalize">
                    {health?.cloudinary?.status || 'Configured'}
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Cloud className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-purple-500" /> Memory & Uptime
                  </p>
                  <h3 className="text-xl font-bold mt-2 text-foreground">
                    {health?.server?.memoryHeapUsedMb || 0} MB <span className="text-xs text-muted-foreground font-normal">Heap</span>
                  </h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                  <Activity className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Movement Consistency Audit */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Stock Movement Audit Engine
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifies that current product stock equals the cumulative sum of all recorded StockMovement transactions.
                </p>
              </div>
              <Badge variant={consistency?.passed !== false ? 'success' : 'destructive'}>
                {consistency?.passed !== false ? '✓ 100% Stock Accurate' : '⚠ Mismatch Detected'}
              </Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  Auditing inventory database integrity...
                </div>
              ) : consistency?.mismatchedProducts?.length === 0 || !consistency?.mismatchedProducts ? (
                <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-foreground">All Inventory Stocks Match History Logs</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Checked {consistency?.totalProductsChecked || 0} products. Every product balance strictly matches the exact mathematical sum of its stock movements (Opening Stock + Purchases + Returns - Sales).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>Found {consistency.mismatchedProducts.length} product(s) with stock discrepancies between recorded currentStock and movement logs.</span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-secondary/60 text-muted-foreground uppercase font-mono">
                        <tr>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-right">Recorded Stock</th>
                          <th className="p-3 text-right">Movement Log Sum</th>
                          <th className="p-3 text-right">Difference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {consistency.mismatchedProducts.map((p: any) => (
                          <tr key={p.productId} className="hover:bg-secondary/30">
                            <td className="p-3 font-semibold text-foreground">{p.productName}</td>
                            <td className="p-3 font-mono text-muted-foreground">{p.sku}</td>
                            <td className="p-3 text-right font-mono font-bold text-foreground">{p.recordedStock}</td>
                            <td className="p-3 text-right font-mono text-emerald-400">{p.calculatedMovementStock}</td>
                            <td className="p-3 text-right font-mono font-bold text-rose-400">{p.difference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
