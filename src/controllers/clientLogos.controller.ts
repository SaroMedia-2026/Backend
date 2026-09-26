import { Request, Response } from 'express';
import { ClientLogosService } from '../services/clientLogos.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ClientLogosController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    // If request is from public frontend, only return active logos.
    // If admin requests ?all=true, return all logos.
    const isPublic = !req.user || req.query.all !== 'true';
    const logos = await ClientLogosService.getAll(isPublic);
    res.json(ApiResponse.success('Client logos retrieved successfully', logos));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const logo = await ClientLogosService.getById(req.params.id);
    res.json(ApiResponse.success('Client logo retrieved successfully', logo));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const created = await ClientLogosService.create(req.body);
    res.status(201).json(ApiResponse.success('Client logo created successfully', created));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const updated = await ClientLogosService.update(req.params.id, req.body);
    res.json(ApiResponse.success('Client logo updated successfully', updated));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ClientLogosService.delete(req.params.id);
    res.json(ApiResponse.success('Client logo deleted successfully', { id: req.params.id }));
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    await ClientLogosService.reorder(req.body.items);
    res.json(ApiResponse.success('Client logos reordered successfully', null));
  });
}
