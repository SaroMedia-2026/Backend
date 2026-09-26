import { Request, Response } from 'express';
import { ContactsService } from '../services/contacts.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ContactsController {
  static submit = asyncHandler(async (req: Request, res: Response) => {
    const submission = await ContactsService.submitContactForm(req.body);
    res.status(201).json(
      ApiResponse.success(
        'Thank you for reaching out! Your message has been received.',
        submission
      )
    );
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { status, limit, page } = req.query;

    const result = await ContactsService.getAll({
      status: status as any,
      limit: limit ? parseInt(limit as string, 10) : 20,
      page: page ? parseInt(page as string, 10) : 1,
    });

    res.json(
      ApiResponse.success('Contact submissions retrieved successfully', result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      })
    );
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const submission = await ContactsService.getById(req.params.id);
    res.json(ApiResponse.success('Contact submission retrieved successfully', submission));
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const updated = await ContactsService.updateStatus(req.params.id, status, notes);
    res.json(ApiResponse.success('Contact submission updated successfully', updated));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ContactsService.delete(req.params.id);
    res.json(ApiResponse.success('Contact submission deleted successfully', { id: req.params.id }));
  });
}
