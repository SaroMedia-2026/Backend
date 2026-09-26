import { Request, Response } from 'express';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { CLOUDINARY_FOLDERS, AgencyFolder } from '../config/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class UploadController {
  /**
   * POST /api/v1/upload
   * Uploads a single file to Cloudinary.
   * Query or Body params:
   * - folder: e.g. 'agency/client-logos', 'agency/testimonials', etc.
   * - resource_type: 'image' | 'video' | 'raw' | 'auto'
   */
  static uploadSingle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('No file provided. Please attach a file to field "file".');
    }

    const folder = (req.body.folder || req.query.folder || CLOUDINARY_FOLDERS.GENERAL) as AgencyFolder;
    const resourceType = req.body.resource_type || req.query.resource_type || 'auto';

    const result = await CloudinaryService.uploadMulterFile(req.file, {
      folder,
      resourceType: resourceType === 'auto' ? undefined : resourceType,
    });

    res.status(201).json(
      ApiResponse.success('File uploaded successfully to Cloudinary', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        optimized_url:
          result.resource_type === 'image'
            ? CloudinaryService.getOptimizedUrl(result.public_id)
            : result.secure_url,
      })
    );
  });

  /**
   * POST /api/v1/upload/multiple
   * Uploads multiple files to Cloudinary simultaneously.
   */
  static uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw ApiError.badRequest('No files provided. Please attach files to field "files".');
    }

    const folder = (req.body.folder || req.query.folder || CLOUDINARY_FOLDERS.GENERAL) as AgencyFolder;
    const resourceType = req.body.resource_type || req.query.resource_type || 'auto';

    const uploadPromises = files.map((file) =>
      CloudinaryService.uploadMulterFile(file, {
        folder,
        resourceType: resourceType === 'auto' ? undefined : resourceType,
      })
    );

    const results = await Promise.all(uploadPromises);

    res.status(201).json(
      ApiResponse.success('Files uploaded successfully to Cloudinary', results)
    );
  });

  /**
   * DELETE /api/v1/upload
   * Deletes an asset directly from Cloudinary by public_id.
   */
  static deleteAsset = asyncHandler(async (req: Request, res: Response) => {
    const { public_id, resource_type } = req.body;

    if (!public_id) {
      throw ApiError.badRequest('Cloudinary public_id is required');
    }

    const deleted = await CloudinaryService.deleteAsset(public_id, resource_type || 'image');

    if (!deleted) {
      throw ApiError.badRequest(`Could not delete asset '${public_id}' from Cloudinary or asset not found.`);
    }

    res.json(ApiResponse.success(`Asset '${public_id}' deleted from Cloudinary`, { public_id }));
  });
}
