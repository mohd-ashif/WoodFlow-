'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../../services/companyService';
import { AppShell } from '../../../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { CompanyLogoUploader } from '../../../components/branding/CompanyLogoUploader';
import { CompanyInformationForm } from '../../../components/branding/CompanyInformationForm';
import { BrandingPreview } from '../../../components/branding/BrandingPreview';
import { Building2, Palette, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UpdateCompanyInput, UpdateBrandingInput } from '@furniture-os/shared';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [primaryColorInput, setPrimaryColorInput] = useState('#2563eb');
  const [secondaryColorInput, setSecondaryColorInput] = useState('#1e293b');

  const isOwner = user?.activeMembership?.role === 'OWNER';

  // Load Company Profile & Branding
  const { data, isLoading, error } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const res = await companyService.getCompanyProfile();
      if (res.branding?.primaryColor) {
        setPrimaryColorInput(res.branding.primaryColor);
      }
      if (res.branding?.secondaryColor) {
        setSecondaryColorInput(res.branding.secondaryColor);
      }
      return res;
    },
    enabled: Boolean(user?.activeMembership?.companyId),
  });

  const company = data?.company;
  const branding = data?.branding;

  // Invalidation helper
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
    queryClient.invalidateQueries({ queryKey: ['companyBranding'] });
    queryClient.invalidateQueries({ queryKey: ['myCompany'] });
  };

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateCompanyInput) => companyService.updateCompanyProfile(input),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Company profile updated successfully.' });
      invalidateAll();
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update company profile.' });
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (input: UpdateBrandingInput) => companyService.updateBranding(input),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Brand theme colors saved successfully.' });
      invalidateAll();
    },
    onError: (err: any) => {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update brand colors.' });
    },
  });

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    await companyService.uploadLogo(formData);
    setStatusMessage({ type: 'success', text: 'Company logo updated successfully.' });
    invalidateAll();
  };

  const handleLogoRemove = async () => {
    await companyService.removeLogo();
    setStatusMessage({ type: 'success', text: 'Company logo removed successfully.' });
    invalidateAll();
  };

  const handleInvoiceLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    await companyService.uploadInvoiceLogo(formData);
    setStatusMessage({ type: 'success', text: 'Invoice logo updated successfully.' });
    invalidateAll();
  };

  const handleInvoiceLogoRemove = async () => {
    await companyService.removeInvoiceLogo();
    setStatusMessage({ type: 'success', text: 'Invoice logo removed successfully.' });
    invalidateAll();
  };

  const handleSaveColors = async () => {
    await updateBrandingMutation.mutateAsync({
      primaryColor: primaryColorInput,
      secondaryColor: secondaryColorInput,
    });
  };

  return (
    <AppShell>
      <div className="max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-primary" />
              Company Profile & Branding
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your multi-tenant business identity, brand imagery, and invoice customization.
            </p>
          </div>

          {!isOwner && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Read-only view (OWNER permissions required to edit)</span>
            </div>
          )}
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading company profile & branding assets...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <h3 className="font-semibold text-foreground">Failed to Load Profile</h3>
            <p className="text-xs text-muted-foreground">Please refresh the page or check your connection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT COLUMN: Imagery & Brand Themes (lg:col-span-5) ───────────── */}
            <div className="lg:col-span-5 space-y-6">
              {/* Primary Company Logo */}
              <Card className="glass-panel border-border/80 shadow-md">
                <CardContent className="p-6">
                  <CompanyLogoUploader
                    title="Company Brand Logo"
                    description="Displayed across dashboard headers, navigation sidebars, and team interfaces."
                    currentLogoUrl={branding?.logoUrl || company?.logo}
                    companyName={company?.name}
                    onUpload={handleLogoUpload}
                    onRemove={handleLogoRemove}
                    primaryColor={primaryColorInput}
                  />
                </CardContent>
              </Card>

              {/* Specialized Invoice Logo */}
              <Card className="glass-panel border-border/80 shadow-md">
                <CardContent className="p-6">
                  <CompanyLogoUploader
                    title="Dedicated Invoice Logo"
                    description="Optional distinct logo optimized for printed A4 documents and customer PDFs."
                    currentLogoUrl={branding?.invoiceLogoUrl}
                    companyName={company?.name}
                    onUpload={handleInvoiceLogoUpload}
                    onRemove={handleInvoiceLogoRemove}
                    recommendedDimensions="300 × 120 px (Horizontal layout recommended)"
                    primaryColor={primaryColorInput}
                  />
                </CardContent>
              </Card>

              {/* Brand Accent Colors */}
              <Card className="glass-panel border-border/80 shadow-md">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">Brand Color Palette</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Theme colors used for invoice headers, badge accents, and custom document elements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Primary Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColorInput}
                          onChange={(e) => setPrimaryColorInput(e.target.value)}
                          disabled={!isOwner}
                          className="h-10 w-12 rounded-lg border border-border bg-transparent p-0.5 cursor-pointer"
                        />
                        <Input
                          value={primaryColorInput}
                          onChange={(e) => setPrimaryColorInput(e.target.value)}
                          disabled={!isOwner}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Secondary Brand Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColorInput}
                          onChange={(e) => setSecondaryColorInput(e.target.value)}
                          disabled={!isOwner}
                          className="h-10 w-12 rounded-lg border border-border bg-transparent p-0.5 cursor-pointer"
                        />
                        <Input
                          value={secondaryColorInput}
                          onChange={(e) => setSecondaryColorInput(e.target.value)}
                          disabled={!isOwner}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveColors}
                        isLoading={updateBrandingMutation.isPending}
                        className="text-xs font-semibold"
                      >
                        Apply Colors
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interactive Live Previews */}
              <BrandingPreview
                logoUrl={branding?.logoUrl || company?.logo}
                invoiceLogoUrl={branding?.invoiceLogoUrl}
                companyName={company?.displayName || company?.name || 'Your Company'}
                primaryColor={primaryColorInput}
                secondaryColor={secondaryColorInput}
                email={company?.email || 'contact@example.com'}
                phone={company?.phone || '+91 98765 43210'}
                address={company?.address || '101 Industrial Estate, Mumbai'}
                gstNumber={company?.gstNumber || '27AAAAA0000A1Z5'}
              />
            </div>

            {/* ── RIGHT COLUMN: Comprehensive Profile Form (lg:col-span-7) ───────── */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="glass-panel border-border/80 shadow-md">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-lg font-bold">Company Profile Information</CardTitle>
                  <CardDescription className="text-xs">
                    Authoritative master data used for official communication, tax compliance, and automated document generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <CompanyInformationForm
                    initialData={company}
                    onSubmit={async (values) => {
                      await updateProfileMutation.mutateAsync(values);
                    }}
                    isLoading={updateProfileMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
