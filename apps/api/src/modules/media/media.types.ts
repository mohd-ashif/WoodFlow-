export type ImageVariant = 'thumbnail' | 'medium' | 'large' | 'original';

export interface UploadSignatureInput {
  entityType?: 'PRODUCT' | 'COMPANY_LOGO' | 'WORKER' | 'CUSTOMER' | 'SUPPLIER';
  entityId?: string;
}

export interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export interface FinalizeUploadInput {
  publicId: string;
  secureUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  entityType?: 'PRODUCT' | 'COMPANY_LOGO' | 'WORKER' | 'CUSTOMER' | 'SUPPLIER';
  entityId?: string;
  isPrimary?: boolean;
}

export interface MediaAssetDTO {
  id: string;
  companyId: string;
  entityType: string;
  entityId?: string | null;
  publicId: string;
  secureUrl: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  isPrimary: boolean;
  status: string;
  createdAt: Date;
}
