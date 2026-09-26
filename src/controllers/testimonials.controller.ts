import { Request, Response } from 'express';
import { TestimonialsService } from '../services/testimonials.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class TestimonialsController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const isPublic = !req.user || req.query.all !== 'true';
    const testimonials = await TestimonialsService.getAll(isPublic);
    res.json(ApiResponse.success('Testimonials retrieved successfully', testimonials));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await TestimonialsService.getById(req.params.id);
    res.json(ApiResponse.success('Testimonial retrieved successfully', testimonial));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const created = await TestimonialsService.create(req.body);
    res.status(201).json(ApiResponse.success('Testimonial created successfully', created));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const updated = await TestimonialsService.update(req.params.id, req.body);
    res.json(ApiResponse.success('Testimonial updated successfully', updated));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await TestimonialsService.delete(req.params.id);
    res.json(ApiResponse.success('Testimonial deleted successfully', { id: req.params.id }));
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    await TestimonialsService.reorder(req.body.items);
    res.json(ApiResponse.success('Testimonials reordered successfully', null));
  });
}
