'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCompanySchema, UpdateCompanyInput, CompanyProfileDTO } from '@furniture-os/shared';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Save, Building2, Phone, MapPin, FileText, Globe } from 'lucide-react';

interface CompanyInformationFormProps {
  initialData?: CompanyProfileDTO | null;
  onSubmit: (data: UpdateCompanyInput) => Promise<void>;
  isLoading?: boolean;
}

export function CompanyInformationForm({
  initialData,
  onSubmit,
  isLoading = false,
}: CompanyInformationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    values: {
      name: initialData?.name || '',
      displayName: initialData?.displayName || '',
      slug: initialData?.slug || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      alternatePhone: initialData?.alternatePhone || '',
      address: initialData?.address || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      country: initialData?.country || 'India',
      postalCode: initialData?.postalCode || '',
      website: initialData?.website || '',
      gstNumber: initialData?.gstNumber || '',
      taxId: initialData?.taxId || '',
      businessRegistrationNumber: initialData?.businessRegistrationNumber || '',
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-6">
      {/* 1. General Identification */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span>General Business Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Legal Company Name *"
            placeholder="e.g. Royal Woodcraft Pvt Ltd"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Display / Trade Name"
            placeholder="e.g. Royal Living Furniture"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tenant Slug (Immutable)"
            disabled
            error={errors.slug?.message}
            {...register('slug')}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://royalliving.com"
            error={errors.website?.message}
            {...register('website')}
          />
        </div>
      </div>

      {/* 2. Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          <Phone className="h-4 w-4 text-primary" />
          <span>Contact Information</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Business Email"
            type="email"
            placeholder="contact@royalliving.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Primary Phone"
            type="tel"
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Alternate Phone"
            type="tel"
            placeholder="+91 87654 32109"
            error={errors.alternatePhone?.message}
            {...register('alternatePhone')}
          />
        </div>
      </div>

      {/* 3. Address & Location */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Registered Office Address</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address Line 1"
            placeholder="Building number, Street, Area"
            error={errors.address?.message}
            {...register('address')}
          />
          <Input
            label="Address Line 2 (Optional)"
            placeholder="Landmark, Industrial Area, Unit"
            error={errors.addressLine2?.message}
            {...register('addressLine2')}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input label="City" placeholder="Mumbai" error={errors.city?.message} {...register('city')} />
          <Input label="State" placeholder="Maharashtra" error={errors.state?.message} {...register('state')} />
          <Input label="Postal / ZIP Code" placeholder="400001" error={errors.postalCode?.message} {...register('postalCode')} />
          <Input label="Country" placeholder="India" error={errors.country?.message} {...register('country')} />
        </div>
      </div>

      {/* 4. Tax & Regulatory Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/60 pb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Tax & Business Identifiers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="GSTIN / Tax ID"
            placeholder="27AAAAA0000A1Z5"
            error={errors.gstNumber?.message}
            {...register('gstNumber')}
          />
          <Input
            label="PAN / Tax ID"
            placeholder="AAAAA0000A"
            error={errors.taxId?.message}
            {...register('taxId')}
          />
          <Input
            label="Business Registration / CIN"
            placeholder="U36100MH2020PTC123456"
            error={errors.businessRegistrationNumber?.message}
            {...register('businessRegistrationNumber')}
          />
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !isDirty}
          className="gap-2 font-semibold min-h-[44px] px-6"
        >
          <Save className="h-4 w-4" /> Save Profile Changes
        </Button>
      </div>
    </form>
  );
}
