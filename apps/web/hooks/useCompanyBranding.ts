'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../components/providers/AuthProvider';
import { companyService } from '../services/companyService';
import { TenantBrandingSummary } from '@furniture-os/shared';

export function getCompanyInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'CO';
  const clean = name.trim();
  if (!clean) return 'CO';

  const parts = clean.split(/[\s-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

export function useCompanyBranding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const activeCompany = user?.activeMembership?.company;
  const isPlatformAdmin = user ? Boolean(user.isPlatformAdmin) : false;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['companyBranding', activeCompany?.id],
    queryFn: async () => {
      const res = await companyService.getBranding();
      return res.branding;
    },
    enabled: Boolean(user && !isPlatformAdmin && activeCompany?.id),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const branding: TenantBrandingSummary | null = data || null;

  const logoUrl = branding?.logoUrl || activeCompany?.logo || null;
  const invoiceLogoUrl = branding?.invoiceLogoUrl || logoUrl;
  const companyName = activeCompany?.name || 'Furniture OS';
  const initials = getCompanyInitials(companyName);
  const primaryColor = branding?.primaryColor || '#2563eb';
  const secondaryColor = branding?.secondaryColor || '#1e293b';

  const invalidateBranding = () => {
    queryClient.invalidateQueries({ queryKey: ['companyBranding'] });
    queryClient.invalidateQueries({ queryKey: ['myCompany'] });
    queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
  };

  return {
    branding,
    logoUrl,
    invoiceLogoUrl,
    companyName,
    initials,
    primaryColor,
    secondaryColor,
    isLoading,
    error,
    refetch,
    invalidateBranding,
  };
}
