'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Building2, Users, FileCheck, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  });

  const stats = data?.stats;

  const statCards = [
    { title: 'Total Companies', value: stats?.totalCompanies ?? 0, icon: Building2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { title: 'Active Companies', value: stats?.activeCompanies ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Unassigned Users', value: stats?.usersWithoutCompany ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Suspended Companies', value: stats?.suspendedCompanies ?? 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Pending Requests', value: stats?.pendingAccessRequests ?? 0, icon: FileCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Overview</h2>
            <p className="text-sm text-muted-foreground">Manage multi-tenant furniture businesses, onboardings, and requests.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Fetching Platform Metrics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.title} className="hover:border-primary/50 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                        {card.title}
                      </CardTitle>
                      <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold tracking-tight text-foreground">{card.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
