'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
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
    <AppShell>
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/10 via-secondary/40 to-background p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                Welcome, {user?.name}!
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Here is your tenant business dashboard for <span className="font-semibold text-foreground">{company?.name}</span>.
            </p>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
            <Badge variant="success" className="text-[10px] sm:text-xs">
              Active Tenant Workspace
            </Badge>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Role: <span className="font-semibold text-foreground">{role?.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Module Placeholders Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Business Modules</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Upcoming features scheduled for Phase 2+</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {placeholderModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="relative overflow-hidden opacity-85 hover:opacity-100 border-border/70 p-3 sm:p-4">
                <div className="absolute top-3 right-3">
                  <Badge variant="warning" className="gap-1 text-[9px] sm:text-[10px]">
                    <Clock className="h-3 w-3" /> Coming Soon
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-secondary text-primary border border-border">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">{module.title}</CardTitle>
                  <CardDescription className="text-[11px] sm:text-xs">{module.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <button
                    disabled
                    className="w-full h-7 sm:h-8 rounded-lg bg-secondary/50 text-[11px] sm:text-xs font-medium text-muted-foreground cursor-not-allowed border border-border/50"
                  >
                    Module Disabled in Phase 1
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
