import { Request, Response } from 'express';
import { SiteSettingsService } from '../services/siteSettings.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class SiteSettingsController {
  static getSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await SiteSettingsService.getSettings();
    res.json(ApiResponse.success('Site settings retrieved successfully', settings));
  });

  static updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const updated = await SiteSettingsService.updateSettings(req.body);
    res.json(ApiResponse.success('Site settings updated successfully', updated));
  });
}
