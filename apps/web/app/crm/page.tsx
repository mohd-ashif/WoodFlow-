'use client';

import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Link from 'next/link';
import {
  Users,
  Building2,
  UserCheck,
  UserPlus,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  Tag as TagIcon,
} from 'lucide-react';

export default function CRMDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => crmService.getDashboard(),
  });

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM Overview</h1>
              <p className="text-sm text-muted-foreground">
                Manage furniture shop customer accounts, suppliers, contacts, and historical timeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/crm/customers/new">
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </Link>
              <Link href="/crm/suppliers/new">
                <Button size="sm" variant="outline" className="gap-1.5 border-border/80">
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 border border-border/40"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive font-medium">Unable to load CRM overview data.</p>
              <Button onClick={() => refetch()} className="mt-4" size="sm">
                Try again
              </Button>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Customers</span>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">All accounts</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Customers</span>
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.activeCustomers || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Ready for sales</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Customers</span>
                    <UserPlus className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.newCustomersThisMonth || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Added this month</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Suppliers</span>
                    <Building2 className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Wood & Hardware vendors</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Suppliers</span>
                    <Building2 className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.activeSuppliers || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Active procurement</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/60">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Suppliers</span>
                    <Plus className="h-4 w-4 text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.newSuppliersThisMonth || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Added this month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid: Recent Customers & Suppliers + Recent Activity Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Customers & Recent Suppliers (2 Columns wide) */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Recent Customers */}
                  <Card className="border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Recent Customers
                      </CardTitle>
                      <Link href="/crm/customers">
                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                          View All Customers <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {data?.recentCustomers && data.recentCustomers.length > 0 ? (
                        <div className="divide-y divide-border/40">
                          {data.recentCustomers.map((cust) => (
                            <div key={cust.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link href={`/crm/customers/${cust.id}`} className="font-semibold text-sm hover:underline text-foreground">
                                    {cust.name}
                                  </Link>
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    {cust.customerCode}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                  <span>{cust.phone}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={cust.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[11px]">
                                  {cust.status}
                                </Badge>
                                <Link href={`/crm/customers/${cust.id}`}>
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                                    Profile
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          No customers yet. <Link href="/crm/customers/new" className="text-primary underline">Add your first customer</Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Suppliers */}
                  <Card className="border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-500" />
                        Recent Suppliers
                      </CardTitle>
                      <Link href="/crm/suppliers">
                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                          View All Suppliers <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {data?.recentSuppliers && data.recentSuppliers.length > 0 ? (
                        <div className="divide-y divide-border/40">
                          {data.recentSuppliers.map((supp) => (
                            <div key={supp.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link href={`/crm/suppliers/${supp.id}`} className="font-semibold text-sm hover:underline text-foreground">
                                    {supp.name}
                                  </Link>
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    {supp.supplierCode}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                  <span>{supp.phone}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={supp.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[11px]">
                                  {supp.status}
                                </Badge>
                                <Link href={`/crm/suppliers/${supp.id}`}>
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                                    Profile
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          No suppliers yet. <Link href="/crm/suppliers/new" className="text-primary underline">Add your first supplier</Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Feed Column */}
                <div className="space-y-6">
                  <Card className="border-border/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Recent CRM Activity
                      </CardTitle>
                      <Link href="/crm/activities">
                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                          View All
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {data?.recentActivities && data.recentActivities.length > 0 ? (
                        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border/60">
                          {data.recentActivities.map((act) => (
                            <div key={act.id} className="relative flex items-start gap-3 pl-7 text-xs">
                              <div className="absolute left-2 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                              <div className="flex-1 space-y-0.5 bg-secondary/30 rounded-lg p-2.5 border border-border/40">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-foreground">{act.title}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(act.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {act.description && (
                                  <p className="text-muted-foreground text-[11px] line-clamp-2">
                                    {act.description}
                                  </p>
                                )}
                                <div className="text-[10px] text-muted-foreground/80 pt-1 flex items-center gap-1.5">
                                  <span>{act.entityType}</span>
                                  {act.creator?.name && <span>• By {act.creator.name}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          No recent CRM activity.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
