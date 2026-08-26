'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccessRequestSchema, CreateAccessRequestInput } from '@furniture-os/shared';
import { accessRequestService } from '../../services/accessRequestService';
import { useAuth } from '../../components/providers/AuthProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Building2, Clock, CheckCircle2, XCircle, LogOut, Loader2 } from 'lucide-react';

export default function AccessRequestPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: requestData, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['myAccessRequest'],
    queryFn: accessRequestService.getMyRequest,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccessRequestInput>({
    resolver: zodResolver(createAccessRequestSchema),
  });

  const mutation = useMutation({
    mutationFn: accessRequestService.submitRequest,
    onSuccess: () => {
      setSuccessMsg('Your access request has been submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['myAccessRequest'] });
      reset();
    },
  });

  const request = requestData?.request;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-6 right-6">
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <Card className="w-full max-w-lg glass-panel border-border/80 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Request Company Access</CardTitle>
          <CardDescription>
            Welcome, <span className="font-semibold text-foreground">{user?.name}</span>. Submit your request for platform setup.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoadingRequest ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Checking access request status...</span>
            </div>
          ) : request ? (
            <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Request Details</span>
                {request.status === 'PENDING' && (
                  <Badge variant="warning" className="gap-1">
                    <Clock className="h-3 w-3" /> Pending Review
                  </Badge>
                )}
                {request.status === 'APPROVED' && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </Badge>
                )}
                {request.status === 'REJECTED' && (
                  <Badge variant="danger" className="gap-1">
                    <XCircle className="h-3 w-3" /> Rejected
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">{request.requestedCompanyName}</p>
                {request.message && <p className="text-xs text-muted-foreground mt-1">"{request.message}"</p>}
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  Submitted on {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60">
                {request.status === 'PENDING' && (
                  <p className="text-xs text-amber-400 font-medium">
                    Your request is waiting for administrator approval. Once approved, your company workspace will be activated.
                  </p>
                )}
                {request.status === 'APPROVED' && (
                  <p className="text-xs text-emerald-400 font-medium">
                    Your request has been approved! Please log out and log back in to access your company dashboard.
                  </p>
                )}
                {request.status === 'REJECTED' && (
                  <p className="text-xs text-rose-400 font-medium">
                    Your request was rejected. Please contact the platform administrator for further assistance.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d: CreateAccessRequestInput) => mutation.mutate(d))} className="space-y-4">
              {successMsg && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  {successMsg}
                </div>
              )}

              <Input
                label="Company Name"
                placeholder="e.g. Grand Furniture Showroom"
                error={errors.requestedCompanyName?.message}
                {...register('requestedCompanyName')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Message to Administrator (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your furniture business size, location, or setup requirements..."
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('message')}
                />
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={mutation.isPending}>
                Submit Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
