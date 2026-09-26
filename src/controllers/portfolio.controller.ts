import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class PortfolioController {
  static getItems = asyncHandler(async (req: Request, res: Response) => {
    // If not authenticated, restrict to published/featured items
    const isPublic = !req.user;
    const { category, status, tag, featured, limit, page } = req.query;

    const result = await PortfolioService.getAll({
      category: category as string,
      status: status as string,
      tag: tag as string,
      featuredOnly: featured === 'true',
      publicOnly: isPublic,
      limit: limit ? parseInt(limit as string, 10) : 20,
      page: page ? parseInt(page as string, 10) : 1,
    });

    res.json(
      ApiResponse.success('Portfolio items retrieved successfully', result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      })
    );
  });

  static getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const isPublic = !req.user;
    const item = await PortfolioService.getBySlug(req.params.slug, isPublic);
    res.json(ApiResponse.success('Portfolio item retrieved successfully', item));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const isPublic = !req.user;
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let item;
    if (isUuid) {
      item = await PortfolioService.getById(id);
    } else {
      item = await PortfolioService.getBySlug(id, isPublic);
    }
    res.json(ApiResponse.success('Portfolio item retrieved successfully', item));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const item = await PortfolioService.create(req.body);
    res.status(201).json(ApiResponse.success('Portfolio item created successfully', item));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const updated = await PortfolioService.update(req.params.id, req.body);
    res.json(ApiResponse.success('Portfolio item updated successfully', updated));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await PortfolioService.delete(req.params.id);
    res.json(ApiResponse.success('Portfolio item deleted successfully', { id: req.params.id }));
  });

  static addMedia = asyncHandler(async (req: Request, res: Response) => {
    const media = await PortfolioService.addMedia(req.params.id, req.body.media);
    res.status(201).json(ApiResponse.success('Media added to portfolio successfully', media));
  });

  static deleteMedia = asyncHandler(async (req: Request, res: Response) => {
    await PortfolioService.deleteMedia(req.params.mediaId);
    res.json(ApiResponse.success('Media deleted successfully', { id: req.params.mediaId }));
  });
}
