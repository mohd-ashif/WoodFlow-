'use client';

import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { InvoiceSummary, CompanySummary } from '@furniture-os/shared';

interface InvoiceCompanyHeaderProps {
  invoice: Partial<InvoiceSummary> & {
    company?: Partial<CompanySummary>;
    companyNameSnapshot?: string | null;
    companyAddressSnapshot?: string | null;
    companyPhoneSnapshot?: string | null;
    companyEmailSnapshot?: string | null;
    companyTaxNumberSnapshot?: string | null;
    companyLogoUrlSnapshot?: string | null;
  };
  primaryColor?: string | null;
  className?: string;
}

export function InvoiceCompanyHeader({ invoice, primaryColor, className }: InvoiceCompanyHeaderProps) {
  // Prefer finalized snapshot (Section 18 requirement), fallback to linked company
  const company = invoice.company || {};

  const companyName = invoice.companyNameSnapshot || company.displayName || company.name || 'Furniture OS';
  const companyLogoUrl = invoice.companyLogoUrlSnapshot || company.logo || null;

  const address =
    invoice.companyAddressSnapshot ||
    [company.address, company.addressLine2, company.city, company.state, company.postalCode, company.country]
      .filter(Boolean)
      .join(', ') ||
    company.address ||
    null;

  const phone = invoice.companyPhoneSnapshot || company.phone || company.alternatePhone || null;
  const email = invoice.companyEmailSnapshot || company.email || null;
  const taxNumber = invoice.companyTaxNumberSnapshot || company.gstNumber || company.taxId || null;

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start gap-6 ${className || ''}`}>
      <div className="flex items-start gap-4">
        {/* Company Logo with resilient initials fallback (Section 14 & 29) */}
        <CompanyLogo
          logoUrl={companyLogoUrl}
          companyName={companyName}
          size="xl"
          rounded="xl"
          primaryColor={primaryColor}
          className="print:shadow-none print:border-neutral-300"
        />

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground print:text-black">
            {companyName}
          </h1>

          {address && (
            <p className="text-xs text-muted-foreground print:text-neutral-700 max-w-sm leading-relaxed">
              {address}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground print:text-neutral-700 pt-0.5">
            {phone && <span>Phone: {phone}</span>}
            {email && <span>Email: {email}</span>}
            {taxNumber && (
              <span className="font-mono font-medium text-foreground print:text-black">
                GSTIN: {taxNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
