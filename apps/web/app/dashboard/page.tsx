'use client';

import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  UserCheck,
  Hammer,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { user } = useAuth();

  const company = user?.activeMembership?.company;
  const role = user?.activeMembership?.role;

  const placeholderModules = [
    { title: 'Inventory Management', desc: 'Track furniture items, wood stock, raw materials, and warehouse counts.', icon: Package },
    { title: 'Sales & Invoices', desc: 'Generate customer invoices, quotes, POS receipts, and track order payments.', icon: ShoppingCart },
    { title: 'Purchases & Suppliers', desc: 'Manage supplier orders, raw material shipments, and procurement bills.', icon: ShoppingBag },
    { title: 'Customer CRM', desc: 'Store customer profiles, purchase history, order statuses, and custom requests.', icon: UserCheck },
    { title: 'Workers & Workshops', desc: 'Manage carpentries, craftsman tasks, daily wages, and furniture assembly logs.', icon: Hammer },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/10 via-secondary/40 to-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Welcome, {user?.name}!
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Here is your tenant business dashboard for <span className="font-semibold text-foreground">{company?.name}</span>.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="success" className="text-xs">
                  Active Tenant Workspace
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Role: <span className="font-semibold text-foreground">{role?.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Module Placeholders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Business Modules</h3>
                <p className="text-xs text-muted-foreground">Upcoming features scheduled for Phase 2+</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placeholderModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card key={module.title} className="relative overflow-hidden opacity-85 hover:opacity-100 border-border/70">
                    <div className="absolute top-3 right-3">
                      <Badge variant="warning" className="gap-1 text-[10px]">
                        <Clock className="h-3 w-3" /> Coming Soon
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary border border-border">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <CardDescription className="text-xs">{module.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <button
                        disabled
                        className="w-full h-8 rounded-lg bg-secondary/50 text-xs font-medium text-muted-foreground cursor-not-allowed border border-border/50"
                      >
                        Module Disabled in Phase 1
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
