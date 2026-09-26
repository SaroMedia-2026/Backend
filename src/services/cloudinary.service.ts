import { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { cloudinary, CLOUDINARY_FOLDERS, AgencyFolder } from '../config/cloudinary.js';
import { CloudinaryUploadResult } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export interface UploadOptions {
  folder?: AgencyFolder;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
  overwrite?: boolean;
}

export class CloudinaryService {
  /**
   * Automatically infers Cloudinary resource type from MIME type.
   */
  static inferResourceType(mimetype: string): 'image' | 'video' | 'raw' {
    if (mimetype.startsWith('image/')) {
      return 'image';
    }
    if (mimetype.startsWith('video/')) {
      return 'video';
    }
    return 'raw'; // PDF, DOCX, TXT, etc.
  }

  /**
   * Upload a memory buffer to Cloudinary using upload_stream.
   */
  static async uploadBuffer(
    buffer: Buffer,
    mimetype: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const resourceType = options.resourceType || this.inferResourceType(mimetype);
    const folder = options.folder || CLOUDINARY_FOLDERS.GENERAL;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: resourceType,
      overwrite: options.overwrite ?? true,
      ...(options.publicId && { public_id: options.publicId }),
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error('Cloudinary upload stream failed:', error);
            return reject(
              ApiError.internal(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`)
            );
          }

          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        }
      );

      // Create readable stream from memory buffer and pipe to uploadStream
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload an Express Multer file.
   */
  static async uploadMulterFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!file || !file.buffer) {
      throw ApiError.badRequest('No file buffer provided for upload.');
    }
    return this.uploadBuffer(file.buffer, file.mimetype, options);
  }

  /**
   * Delete an asset from Cloudinary using its public_id.
   */
  static async deleteAsset(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<boolean> {
    if (!publicId) return false;

    try {
      // First attempt with specified resource_type
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      // If not found as image, attempt raw or video fallback
      if (result.result !== 'ok' && resourceType === 'image') {
        const rawResult = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true,
        });
        if (rawResult.result === 'ok') return true;

        const videoResult = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'video',
          invalidate: true,
        });
        return videoResult.result === 'ok';
      }

      return result.result === 'ok';
    } catch (err: any) {
      logger.warn(`Failed to delete Cloudinary asset ${publicId}:`, err?.message);
      return false;
    }
  }

  /**
   * Generate an optimized and transformed URL dynamically from public_id.
   * Enables f_auto (best format like WebP/AVIF), q_auto (intelligent compression),
   * and optional width/height transformations.
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    } = {}
  ): string {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
    } = options;

    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: format,
      quality,
      ...(width && { width }),
      ...(height && { height }),
      ...(width && height && { crop }),
    });
  }
}
