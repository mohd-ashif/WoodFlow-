'use client';

import React, { useRef, useState, useCallback } from 'react';
import { ImageIcon, Upload, X, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ImageUploadProps {
  /** Currently persisted image URL (from DB / existing record) */
  value?: string | null;
  /** Called with the uploaded URL after backend confirms the upload */
  onChange: (url: string | null) => void;
  /** Async function that uploads a File and returns the URL */
  onUpload: (file: File) => Promise<string>;
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

  // The preview to display: local blob takes precedence over persisted URL
  const displaySrc = localPreview || value || null;
  const hasImage = !!displaySrc;

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
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

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      // Simulate progress while uploading
      setUploading(true);
      setUploadProgress(10);

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85));
      }, 300);

      try {
        const uploadedUrl = await onUpload(file);
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Revoke the local blob URL to free memory, backend URL now serves as the real preview
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
        onChange(uploadedUrl);

        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 400);
      } catch (err: any) {
        clearInterval(progressInterval);
        setUploading(false);
        setUploadProgress(0);
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
        setError(err.message || 'Upload failed. Please try again.');
      }
    },
    [onUpload, onChange, validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so the same file can be re-selected
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
    setLocalPreview(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className={clsx('space-y-2', className)}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Product Image <span className="text-muted-foreground/60 normal-case font-normal">(Optional)</span>
      </label>

      {hasImage ? (
        // ─── Image Preview State ───────────────────────────────────────────────
        <div className="relative rounded-xl border border-border bg-secondary/20 overflow-hidden">
          {/* Preview */}
          <div className="relative aspect-video flex items-center justify-center bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc!}
              alt="Product preview"
              className="max-h-52 max-w-full object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />

            {/* Upload progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
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
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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
                className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        // ─── Empty Upload Zone ─────────────────────────────────────────────────
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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
