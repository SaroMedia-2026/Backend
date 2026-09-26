import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class AnalyticsController {
  static getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await AnalyticsService.getSummary();
    res.json(ApiResponse.success('Analytics summary retrieved successfully', summary));
  });
}
