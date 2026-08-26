'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCompanySchema, UpdateCompanyInput } from '@furniture-os/shared';
import { companyService } from '../../../services/companyService';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['myCompany'],
    queryFn: companyService.getMyCompany,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
  });

  useEffect(() => {
    if (data?.company) {
      reset({
        name: data.company.name,
        slug: data.company.slug,
        email: data.company.email || '',
        phone: data.company.phone || '',
        address: data.company.address || '',
        city: data.company.city || '',
        state: data.company.state || '',
        country: data.company.country || '',
        postalCode: data.company.postalCode || '',
        gstNumber: data.company.gstNumber || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: companyService.updateMyCompany,
    onSuccess: () => {
      setSuccessMsg('Company details updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['myCompany'] });
    },
  });

  const company = data?.company;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6 max-w-4xl">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Company Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your furniture business profile and billing details.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading company details...</span>
            </div>
          ) : (
            <Card className="glass-panel border-border/80">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company?.name}</CardTitle>
                    <CardDescription className="text-xs">Slug: {company?.slug}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {successMsg && (
                  <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Company Name" error={errors.name?.message} {...register('name')} />
                    <Input label="Slug" disabled error={errors.slug?.message} {...register('slug')} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Business Email" type="email" error={errors.email?.message} {...register('email')} />
                    <Input label="Phone Number" error={errors.phone?.message} {...register('phone')} />
                  </div>

                  <Input label="Street Address" error={errors.address?.message} {...register('address')} />

                  <div className="grid grid-cols-3 gap-4">
                    <Input label="City" error={errors.city?.message} {...register('city')} />
                    <Input label="State" error={errors.state?.message} {...register('state')} />
                    <Input label="Postal Code" error={errors.postalCode?.message} {...register('postalCode')} />
                  </div>

                  <Input label="GST Number / Tax ID" error={errors.gstNumber?.message} {...register('gstNumber')} />

                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" isLoading={mutation.isPending} className="gap-2">
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
