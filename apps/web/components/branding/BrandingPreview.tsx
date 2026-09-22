'use client';

import React, { useState } from 'react';
import { CompanyLogo } from './CompanyLogo';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Eye, LayoutTemplate, Receipt, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface BrandingPreviewProps {
  logoUrl?: string | null;
  invoiceLogoUrl?: string | null;
  companyName: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export function BrandingPreview({
  logoUrl,
  invoiceLogoUrl,
  companyName,
  primaryColor = '#2563eb',
  secondaryColor = '#1e293b',
  email = 'contact@example.com',
  phone = '+91 98765 43210',
  address = '101 Furniture Park, Industrial Zone, Mumbai 400001',
  gstNumber = '27AAAAA0000A1Z5',
}: BrandingPreviewProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'invoice' | 'fallback'>('app');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Live Branding Preview</h4>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={clsx(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              activeTab === 'app'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            App Header
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={clsx(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              activeTab === 'invoice'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Invoice Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fallback')}
            className={clsx(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              activeTab === 'fallback'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Initials Fallback
          </button>
        </div>
      </div>

      <Card className="glass-panel overflow-hidden border-border/70">
        <CardContent className="p-4 sm:p-6">
          {/* TAB 1: App Header & Sidebar Mock */}
          {activeTab === 'app' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                How your company branding appears to team members in the top navigation and sidebar:
              </p>

              {/* Mock Header */}
              <div className="rounded-xl border border-border bg-card/90 p-3 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo
                    logoUrl={logoUrl}
                    companyName={companyName}
                    size="md"
                    rounded="lg"
                    primaryColor={primaryColor}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[180px]">
                        {companyName || 'Your Company'}
                      </span>
                      <span
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      >
                        OWNER
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Enterprise Inventory</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-muted-foreground hidden sm:inline">Active</span>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-3 pt-2 text-xs">
                <span className="text-muted-foreground">Theme Accents:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    title={`Primary: ${primaryColor}`}
                  />
                  <span className="font-mono text-[11px]">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: secondaryColor }}
                    title={`Secondary: ${secondaryColor}`}
                  />
                  <span className="font-mono text-[11px]">{secondaryColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Invoice Header Mock */}
          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                How your company branding renders on PDF and customer-facing tax invoices:
              </p>

              <div className="rounded-xl border border-neutral-300 bg-white text-neutral-900 p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-neutral-200 pb-4">
                  <div className="flex items-start gap-3">
                    <CompanyLogo
                      logoUrl={invoiceLogoUrl || logoUrl}
                      companyName={companyName}
                      size="lg"
                      rounded="lg"
                      primaryColor={primaryColor}
                      className="border-neutral-300 bg-neutral-50 shadow-none"
                    />
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 leading-snug">
                        {companyName || 'Your Company'}
                      </h3>
                      <p className="text-xs text-neutral-600 max-w-xs">{address}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Ph: {phone} • {email}
                      </p>
                      <p className="text-xs font-mono font-medium text-neutral-800 mt-0.5">
                        GSTIN: {gstNumber}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span
                      style={{ color: primaryColor }}
                      className="text-lg font-black tracking-wider uppercase block"
                    >
                      TAX INVOICE
                    </span>
                    <span className="text-xs font-mono text-neutral-500">INV-2026-0042</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-neutral-500 pt-1">
                  <span>Customer: Walk-in Client</span>
                  <span className="font-semibold text-neutral-900">Total: ₹ 45,000.00</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Fallback Demonstration */}
          {activeTab === 'fallback' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Demonstration of professional initials fallback if an image is removed or network fails:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col items-center gap-2 text-center">
                  <CompanyLogo
                    logoUrl={null}
                    companyName={companyName}
                    size="xl"
                    rounded="xl"
                    primaryColor={primaryColor}
                  />
                  <span className="text-xs font-medium text-foreground">Large Fallback</span>
                  <span className="text-[11px] text-muted-foreground">Profile & Invoices</span>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col items-center gap-2 text-center">
                  <CompanyLogo
                    logoUrl={null}
                    companyName={companyName}
                    size="md"
                    rounded="lg"
                    primaryColor={primaryColor}
                  />
                  <span className="text-xs font-medium text-foreground">Medium Fallback</span>
                  <span className="text-[11px] text-muted-foreground">Header & Navigation</span>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col items-center gap-2 text-center">
                  <CompanyLogo
                    logoUrl={null}
                    companyName={companyName}
                    size="sm"
                    rounded="md"
                    primaryColor={primaryColor}
                  />
                  <span className="text-xs font-medium text-foreground">Small Fallback</span>
                  <span className="text-[11px] text-muted-foreground">Table & Badges</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
