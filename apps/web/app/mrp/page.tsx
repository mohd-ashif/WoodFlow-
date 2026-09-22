'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Play,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { TableCard, TableCardBody } from '../../components/ui/TableCard';
import { mrpService, MaterialRequirement } from '../../services/mrpService';

export default function MRPDashboardPage() {
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  async function loadMRPData() {
    try {
      setLoading(true);
      const data = await mrpService.getMaterialRequirements();
      setRequirements(data || []);
    } catch (err) {
      console.error('Failed to load MRP requirements', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMRPData();
  }, []);

  async function handleRunMRP() {
    try {
      setRunning(true);
      const result = await mrpService.runMRP();
      setRequirements(result.materialRequirements || []);
    } catch (err) {
      alert('Failed to execute MRP engine');
    } finally {
      setRunning(false);
    }
  }

  const filtered = requirements.filter((req) => {
    const matchesSearch =
      req.materialName.toLowerCase().includes(search.toLowerCase()) ||
      req.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRequirements = requirements.length;
  const readyCount = requirements.filter((r) => r.status === 'READY').length;
  const shortageCount = requirements.filter((r) => r.status === 'SHORTAGE' || r.status === 'PURCHASE_REQUIRED').length;
  const totalShortageQty = requirements.reduce((sum, r) => sum + r.netRequirement, 0);

  return (
    <AppShell>
      <PageHeader
        title="Material Requirement Planning (MRP)"
        description="Automated BOM Explosion, Demand Analysis, Stock Availability & Procurement Requisitions."
        icon={Boxes}
        actions={
          <Button
            onClick={handleRunMRP}
            disabled={running}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
          >
            <Play className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Calculating Demand...' : 'Run MRP Engine'}
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/80 p-4 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Requirements</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5 font-mono">{totalRequirements}</h3>
          </div>
        </Card>

        <Card className="border-border/80 p-4 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Ready</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">{readyCount}</h3>
          </div>
        </Card>

        <Card className="border-border/80 p-4 flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Material Shortages</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-0.5 font-mono">{shortageCount}</h3>
          </div>
        </Card>

        <Card className="border-border/80 p-4 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Shortage Quantity</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-0.5 font-mono">{totalShortageQty}</h3>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/80 p-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <SearchInput
            placeholder="Search material or SKU..."
            value={search}
            onChange={setSearch}
            className="w-full sm:w-80"
          />

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">Ready</option>
              <option value="SHORTAGE">Shortage</option>
              <option value="PURCHASE_REQUIRED">Purchase Required</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={loadMRPData}
              disabled={loading}
              className="h-9 px-3 border-border/80"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <TableCard>
        <TableCardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/95 backdrop-blur-md border-b border-border text-xs uppercase font-medium text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Material / SKU</th>
                  <th className="py-3.5 px-4 text-right">Required</th>
                  <th className="py-3.5 px-4 text-right">On Hand</th>
                  <th className="py-3.5 px-4 text-right">Reserved</th>
                  <th className="py-3.5 px-4 text-right">Available</th>
                  <th className="py-3.5 px-4 text-right">Incoming PO</th>
                  <th className="py-3.5 px-4 text-right font-bold">Shortage</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Calculating Material Requirements...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No material requirements matching criteria. Click "Run MRP Engine" to calculate demand.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.materialProductId} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div>{row.materialName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{row.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold font-mono text-foreground">{row.grossRequirement}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-foreground">{row.onHandStock}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">{row.reservedStock}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">{row.availableStock}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-400">{row.incomingSupply}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                        {row.netRequirement > 0 ? row.netRequirement : 0}
                      </td>
                      <td className="py-3.5 px-4">
                        {row.status === 'READY' ? (
                          <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            READY
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            PURCHASE REQUIRED
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TableCardBody>
      </TableCard>
    </AppShell>
  );
}

