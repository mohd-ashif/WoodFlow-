'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Star, Trash2, RefreshCw, X, AlertCircle } from 'lucide-react';
import toast from '../ui/Toast';

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

  const notifyChange = (updatedList: ImageAssetItem[]) => {
    setImages(updatedList);
    if (onImagesChanged) onImagesChanged(updatedList);
  };

  const uploadFileToServer = async (file: File) => {
    setError(null);

    // Validate MIME & Size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, or WEBP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setIsUploading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);

      const isFirst = images.length === 0;
      formData.append('isPrimary', isFirst ? 'true' : 'false');

      const res = await fetch(`${apiUrl}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed');
      }

      const uploadedAsset: ImageAssetItem = {
        id: data.data.id,
        url: data.data.url,
        publicId: data.data.publicId,
        isPrimary: isFirst || data.data.isPrimary,
        fileName: file.name,
      };

      const updated = multiple ? [...images, uploadedAsset] : [uploadedAsset];
      notifyChange(updated);
      toast.success('Image uploaded successfully to Cloudinary!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        const token = localStorage.getItem('token');
        await fetch(`${apiUrl}/upload/image/${target.id}`, {
          method: 'DELETE',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      } catch {
        // Continue clearing local state even if remote fails
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
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === indexToSet,
    }));
    notifyChange(updated);

    const target = updated[indexToSet];
    if (target.id) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        const token = localStorage.getItem('token');
        await fetch(`${apiUrl}/upload/image/${target.id}/primary`, {
          method: 'PATCH',
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Zone */}
      {(multiple ? images.length < maxFiles : images.length === 0) && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 transition-colors"
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
              <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isUploading ? 'Uploading to Cloudinary...' : 'Click or Drag images to upload'}
              </p>
              <p className="text-[11px] text-slate-500">PNG, JPG, WEBP • Max 5 MB per file</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2 text-rose-600 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 aspect-square shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.fileName || 'Image'} className="w-full h-full object-cover" />

              {/* Primary Badge */}
              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Main</span>
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
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
                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
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
