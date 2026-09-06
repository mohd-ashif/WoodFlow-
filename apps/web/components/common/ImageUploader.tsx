'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Star, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from '../ui/Toast';
import { mediaService, MediaAssetDTO } from '../../services/mediaService';
import { ProductImage } from '../ui/ProductImage';

export interface ImageAssetItem {
  id?: string;
  url: string;
  publicId?: string;
  isPrimary?: boolean;
  fileName?: string;
}

interface ImageUploaderProps {
  entityType?: 'PRODUCT' | 'COMPANY_LOGO' | 'WORKER' | 'CUSTOMER' | 'SUPPLIER';
  entityId?: string;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: ImageAssetItem[];
  onImagesChanged?: (images: ImageAssetItem[]) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  entityType = 'PRODUCT',
  entityId,
  multiple = false,
  maxFiles = 5,
  existingImages = [],
  onImagesChanged,
  className = '',
}) => {
  const [images, setImages] = useState<ImageAssetItem[]>(existingImages);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const notifyChange = (updatedList: ImageAssetItem[]) => {
    setImages(updatedList);
    if (onImagesChanged) onImagesChanged(updatedList);
  };

  const uploadFileToServer = async (file: File) => {
    setError(null);

    // Validate type & size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Invalid file type. Only JPG, PNG, or WEBP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setIsUploading(true);

    try {
      const isFirst = images.length === 0;
      const uploadedAsset: MediaAssetDTO = await mediaService.uploadImage(
        file,
        entityType,
        entityId,
        isFirst
      );

      const newItem: ImageAssetItem = {
        id: uploadedAsset.id,
        url: uploadedAsset.url || uploadedAsset.secureUrl,
        publicId: uploadedAsset.publicId,
        isPrimary: isFirst || uploadedAsset.isPrimary,
        fileName: file.name,
      };

      const updated = multiple ? [...images, newItem] : [newItem];
      notifyChange(updated);
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToServer(e.target.files[0]);
    }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    const target = images[indexToDelete];

    if (target.id) {
      try {
        await mediaService.deleteImage(target.id);
      } catch {
        // Continue clearing local state
      }
    }

    const updated = images.filter((_, idx) => idx !== indexToDelete);
    if (target.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    notifyChange(updated);
    toast.success('Image removed');
  };

  const handleSetPrimary = async (indexToSet: number) => {
    const target = images[indexToSet];

    if (target.id) {
      try {
        await mediaService.setPrimaryImage(target.id);
      } catch {
        // ignore
      }
    }

    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === indexToSet,
    }));
    notifyChange(updated);
    toast.success('Primary image updated');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Zone */}
      {(multiple ? images.length < maxFiles : images.length === 0) && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer bg-card/30 hover:bg-primary/5 transition-all"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-foreground">
                {isUploading ? 'Uploading image...' : 'Click or drag images to upload'}
              </p>
              <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP • Max 5 MB per file</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center space-x-2 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="relative group border border-border/80 rounded-xl overflow-hidden bg-card aspect-square shadow-sm"
            >
              <ProductImage
                src={img.url}
                alt={img.fileName || 'Product image'}
                variant="medium"
                className="w-full h-full"
              />

              {/* Primary Badge */}
              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow flex items-center space-x-1 z-10">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Main</span>
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-background/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 z-20">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    title="Set as Main Image"
                    className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  title="Delete Image"
                  className="p-1.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
