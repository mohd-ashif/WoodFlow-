'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';
import { CompanyLogo } from './CompanyLogo';

interface CompanyLogoUploaderProps {
  title?: string;
  description?: string;
  currentLogoUrl?: string | null;
  companyName?: string;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onRemove: () => Promise<void>;
  maxSizeMb?: number;
  recommendedDimensions?: string;
  className?: string;
  primaryColor?: string;
}

export function CompanyLogoUploader({
  title = 'Company Logo',
  description = 'Upload your official brand logo for dashboard, invoices, and reports.',
  currentLogoUrl,
  companyName = 'Company',
  onUpload,
  onRemove,
  maxSizeMb = 5,
  recommendedDimensions = '500 × 500 px (Max 2000 × 2000 px)',
  className,
  primaryColor,
}: CompanyLogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Invalid file type. Only JPG, PNG, and WEBP images are supported.';
    }
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds the ${maxSizeMb}MB maximum limit.`;
    }
    return null;
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);

      // Simulated smooth progress while backend processes R2 stream
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      await onUpload(file, (pct) => setUploadProgress(pct));

      clearInterval(progressTimer);
      setUploadProgress(100);
      setSuccessMessage('Logo updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Logo upload failed. Your existing logo is still active.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleConfirmRemove = async () => {
    try {
      setIsRemoving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await onRemove();
      setShowRemoveConfirm(false);
      setSuccessMessage('Logo removed successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove logo.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload & Preview Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'relative rounded-xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center text-center gap-4 bg-secondary/10',
          isDragging ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border/70 hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-80'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading || isRemoving}
        />

        {/* Logo Preview Section */}
        <div className="flex flex-col items-center gap-3">
          <CompanyLogo
            logoUrl={currentLogoUrl}
            companyName={companyName}
            size="xl"
            rounded="xl"
            primaryColor={primaryColor}
            className="shadow-md"
          />

          <div className="text-xs text-muted-foreground">
            {currentLogoUrl ? (
              <span className="text-emerald-400 font-medium">Active Logo Loaded</span>
            ) : (
              <span>No logo uploaded (Initials fallback displayed)</span>
            )}
          </div>
        </div>

        {/* Progress Bar (during upload) */}
        {isUploading && (
          <div className="w-full max-w-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between text-xs text-primary font-medium">
              <span>Uploading to secure Cloudflare R2...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
            className="gap-2 text-xs font-semibold"
          >
            {currentLogoUrl ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" /> Replace Image
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Upload Image
              </>
            )}
          </Button>

          {currentLogoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isUploading || isRemoving}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="text-[11px] text-muted-foreground/80 space-y-0.5">
          <p>Drag and drop image here or click button</p>
          <p>Supported: JPG, PNG, WEBP • Max: {maxSizeMb} MB</p>
          <p>Recommended: {recommendedDimensions}</p>
        </div>
      </div>

      {/* Remove Confirmation Dialog Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Remove Company Logo?</h4>
                <p className="text-xs text-muted-foreground">Historical invoices will preserve their original snapshot.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove the company logo? The application will fall back to using your company initials.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRemoveConfirm(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmRemove}
                isLoading={isRemoving}
                className="gap-1.5"
              >
                <X className="h-4 w-4" /> Remove Logo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
