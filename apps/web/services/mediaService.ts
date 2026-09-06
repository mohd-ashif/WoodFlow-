export interface MediaAssetDTO {
  id: string;
  companyId?: string;
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
  status?: string;
}

export interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

class MediaService {
  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Request direct upload authorization signature from backend
   */
  async getUploadSignature(entityType: string = 'PRODUCT', entityId?: string): Promise<UploadSignatureResponse> {
    const res = await fetch(`${this.getApiUrl()}/media/upload-signature`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ entityType, entityId }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to get upload signature');
    }
    return data.data;
  }

  /**
   * Finalize direct upload metadata registration in backend database
   */
  async finalizeUpload(payload: {
    publicId: string;
    secureUrl: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    entityType?: string;
    entityId?: string;
    isPrimary?: boolean;
  }): Promise<MediaAssetDTO> {
    const res = await fetch(`${this.getApiUrl()}/media/finalize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to finalize upload');
    }
    return data.data;
  }

  /**
   * Primary high-level upload function: Uses signed direct upload if Cloudinary is configured,
   * otherwise falls back seamlessly to server proxy upload.
   */
  async uploadImage(
    file: File,
    entityType: string = 'PRODUCT',
    entityId?: string,
    isPrimary?: boolean
  ): Promise<MediaAssetDTO> {
    try {
      // Step 1: Request upload signature
      const signatureData = await this.getUploadSignature(entityType, entityId);

      // Check if real Cloudinary signature or local fallback
      if (signatureData.cloudName !== 'local' && signatureData.uploadUrl.includes('cloudinary.com')) {
        // Step 2: Upload directly to Cloudinary from browser
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', signatureData.timestamp.toString());
        formData.append('folder', signatureData.folder);
        formData.append('signature', signatureData.signature);

        const cloudRes = await fetch(signatureData.uploadUrl, {
          method: 'POST',
          body: formData,
        });

        const cloudData = await cloudRes.json();
        if (!cloudRes.ok || cloudData.error) {
          throw new Error(cloudData.error?.message || 'Direct Cloudinary upload failed');
        }

        // Step 3: Finalize metadata in backend DB
        return await this.finalizeUpload({
          publicId: cloudData.public_id,
          secureUrl: cloudData.secure_url,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          width: cloudData.width,
          height: cloudData.height,
          entityType,
          entityId,
          isPrimary,
        });
      }
    } catch {
      // Fallback to server proxy upload below
    }

    // Server Proxy Upload Fallback
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);
    if (isPrimary !== undefined) formData.append('isPrimary', isPrimary.toString());

    const res = await fetch(`${this.getApiUrl()}/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Image upload failed');
    }

    return data.data;
  }

  /**
   * Set media asset as primary for entity
   */
  async setPrimaryImage(imageId: string): Promise<MediaAssetDTO> {
    const res = await fetch(`${this.getApiUrl()}/media/${imageId}/primary`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to set primary image');
    }
    return data.data;
  }

  /**
   * Delete media asset
   */
  async deleteImage(imageId: string): Promise<void> {
    const res = await fetch(`${this.getApiUrl()}/media/${imageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete image');
    }
  }

  /**
   * Get all active media assets for entity
   */
  async getEntityImages(entityType: string, entityId: string): Promise<MediaAssetDTO[]> {
    const res = await fetch(`${this.getApiUrl()}/media/entity/${entityType}/${entityId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return [];
    }
    return data.data;
  }
}

export const mediaService = new MediaService();
