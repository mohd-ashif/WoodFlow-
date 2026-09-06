'use client';

import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';

export interface ProductImageProps {
  src?: string | null;
  alt?: string;
  variant?: 'thumbnail' | 'medium' | 'large' | 'original';
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  priority?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  variant = 'medium',
  className = '',
  aspectRatio = 'square',
  priority = false,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Compute Cloudinary variant URL if applicable
  const getProcessedSrc = (url?: string | null): string => {
    if (!url) return '';

    if (url.includes('res.cloudinary.com')) {
      let transformation = '';
      switch (variant) {
        case 'thumbnail':
          transformation = 'c_thumb,w_120,h_120,g_center,q_auto,f_auto';
          break;
        case 'medium':
          transformation = 'c_limit,w_800,h_800,q_auto,f_auto';
          break;
        case 'large':
          transformation = 'c_limit,w_1600,h_1600,q_auto,f_auto';
          break;
        default:
          transformation = 'q_auto,f_auto';
          break;
      }
      return url.replace('/upload/', `/upload/${transformation}/`);
    }

    return url;
  };

  const finalSrc = getProcessedSrc(src);
  const showPlaceholder = !finalSrc || hasError;

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : '';

  if (showPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary/30 text-muted-foreground border border-border/40 rounded-lg select-none ${aspectClass} ${className}`}
        aria-label="Product image placeholder"
      >
        {hasError ? (
          <ImageOff className="h-5 w-5 opacity-40" />
        ) : (
          <Package className="h-5 w-5 opacity-40 text-primary/60" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-secondary/20 border border-border/40 ${aspectClass} ${className}`}>
      {/* Loading Skeleton Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-secondary/40 animate-pulse flex items-center justify-center">
          <Package className="h-5 w-5 opacity-20 text-muted-foreground" />
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={finalSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
