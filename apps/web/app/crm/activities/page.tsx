'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '../../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Clock, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GlobalActivitiesPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: ['activities-list', page, limit, entityTypeFilter],
    queryFn: () =>
      crmService.getActivities({
        page,
        limit,
        entityType: entityTypeFilter || undefined,
      }),
  });

  const activities = (responseData as any)?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = (responseData as any)?.pagination || { page: 1, totalPages: 1, total: activities.length };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Clock className="h-7 w-7 text-primary" />
                CRM Activity Feed
              </h1>
              <p className="text-sm text-muted-foreground">
                Chronological timeline of all customer and supplier actions across your shop.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 border-border/80"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Feed
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="border-border/80 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Entity Filter:
              </span>
              {[
                { label: 'All Entities', value: '' },
                { label: 'Customers', value: 'CUSTOMER' },
                { label: 'Suppliers', value: 'SUPPLIER' },
              ].map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={entityTypeFilter === f.value ? 'default' : 'outline'}
                  onClick={() => {
                    setEntityTypeFilter(f.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="border-border/80">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-card/60 animate-pulse rounded-lg border border-border/40" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive">
                  <p className="text-sm font-medium">Unable to load activity feed.</p>
                  <Button size="sm" onClick={() => refetch()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <Clock className="h-10 w-10 mx-auto opacity-40" />
                  <p className="font-semibold text-foreground">No CRM activity recorded yet</p>
                  <p className="text-xs">Activities will appear as customer and supplier events occur.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                  {activities.map((act: any) => (
                    <div key={act.id} className="relative flex items-start gap-3 text-xs">
                      <div className="absolute left-[-1.05rem] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex-1 bg-secondary/30 rounded-lg p-3 border border-border/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {act.entityType}
                            </Badge>
                            <span className="font-semibold text-foreground">{act.title}</span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                            {act.description}
                          </p>
                        )}
                        {act.creator?.name && (
                          <span className="text-[10px] text-muted-foreground/80 block pt-1">
                            Recorded by {act.creator.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} activities)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
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
