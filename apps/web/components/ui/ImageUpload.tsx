'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ImageIcon, Upload, X, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductImage } from './ProductImage';

export interface ImageUploadProps {
  /** Currently persisted image URL (from DB / existing record) */
  value?: string | null;
  /** Called with the uploaded URL after backend confirms the upload */
  onChange: (url: string | null) => void;
  /** Optional custom upload handler or default backend upload */
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function ImageUpload({ value, onChange, onUpload, disabled, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // Preview priority: local blob preview > value from DB
  const displaySrc = localPreview || value || null;
  const hasImage = !!displaySrc;

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      return 'Only JPG, PNG, or WEBP images are supported.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Show local blob preview immediately
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      // Simulate progress
      setUploading(true);
      setUploadProgress(15);

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 20, 85));
      }, 250);

      try {

        let uploadedUrl = '';
        if (onUpload) {
          uploadedUrl = await onUpload(file);
        } else {
          const { mediaService } = await import('../../services/mediaService');
          const asset = await mediaService.uploadImage(file, 'PRODUCT');
          uploadedUrl = asset.url || asset.secureUrl;
        }

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Revoke local object URL safely
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
        onChange(uploadedUrl);

        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 300);
      } catch (err: any) {
        clearInterval(progressInterval);
        setUploading(false);
        setUploadProgress(0);
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
        setError(err.message || 'Upload failed. Please try again.');
      } finally {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [onUpload, onChange, validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && !disabled && !uploading) handleFileSelect(file);
    },
    [handleFileSelect, disabled, uploading]
  );

  const handleRemove = useCallback(() => {
    setError(null);
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    onChange(null);
  }, [localPreview, onChange]);

  return (
    <div className={clsx('space-y-2', className)}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Product Image <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
      </label>

      {hasImage ? (
        // Preview State
        <div className="relative rounded-xl border border-border bg-secondary/20 overflow-hidden">
          <div className="relative aspect-video flex items-center justify-center bg-muted/20">
            <ProductImage
              src={displaySrc}
              alt="Product preview"
              variant="medium"
              className="max-h-52 max-w-full object-contain"
            />

            {/* Upload progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
                <Loader2 className="h-6 w-6 text-primary animate-spin" aria-hidden="true" />
                <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Action bar */}
          {!uploading && (
            <div className="flex items-center gap-2 p-3 border-t border-border/60 bg-card/50">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 rounded"
                aria-label="Replace image"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Replace
              </button>
              <span className="text-border">•</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 rounded"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        // Empty Upload Zone
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload product image"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={clsx(
            'group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
            'py-10 px-4 text-center cursor-pointer transition-all duration-200',
            disabled
              ? 'border-border/30 opacity-50 cursor-not-allowed'
              : 'border-border/60 hover:border-primary/50 hover:bg-primary/5'
          )}
        >
          <div className="rounded-full bg-secondary/60 p-3 group-hover:bg-primary/10 transition-colors">
            <ImageIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · Max {MAX_SIZE_MB} MB</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Upload className="h-3 w-3" aria-hidden="true" />
            <span>Upload Image</span>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
      />

      {/* Error message */}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
