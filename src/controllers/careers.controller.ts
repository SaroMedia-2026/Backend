import { Request, Response } from 'express';
import { CareersService } from '../services/careers.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { CLOUDINARY_FOLDERS } from '../config/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CareersController {
  // --- CAREER LISTINGS ---

  static getCareers = asyncHandler(async (req: Request, res: Response) => {
    const isPublic = !req.user;
    const department = req.query.department as string;
    const careers = await CareersService.getAllCareers(isPublic, department);
    res.json(ApiResponse.success('Careers retrieved successfully', careers));
  });

  static getCareerById = asyncHandler(async (req: Request, res: Response) => {
    const career = await CareersService.getCareerById(req.params.id);
    res.json(ApiResponse.success('Career retrieved successfully', career));
  });

  static createCareer = asyncHandler(async (req: Request, res: Response) => {
    const career = await CareersService.createCareer(req.body);
    res.status(201).json(ApiResponse.success('Career listing created successfully', career));
  });

  static updateCareer = asyncHandler(async (req: Request, res: Response) => {
    const updated = await CareersService.updateCareer(req.params.id, req.body);
    res.json(ApiResponse.success('Career listing updated successfully', updated));
  });

  static deleteCareer = asyncHandler(async (req: Request, res: Response) => {
    await CareersService.deleteCareer(req.params.id);
    res.json(ApiResponse.success('Career listing deleted successfully', { id: req.params.id }));
  });

  // --- JOB APPLICATIONS ---

  static apply = asyncHandler(async (req: Request, res: Response) => {
    const careerId = req.params.id;
    let resumeUrl = req.body.resume_url;
    let resumePublicId = req.body.resume_public_id;

    // If file is uploaded directly via multipart form
    if (req.file) {
      const uploadResult = await CloudinaryService.uploadMulterFile(req.file, {
        folder: CLOUDINARY_FOLDERS.RESUMES,
        resourceType: 'raw',
      });
      resumeUrl = uploadResult.secure_url;
      resumePublicId = uploadResult.public_id;
    }

    if (!resumeUrl || !resumePublicId) {
      throw ApiError.badRequest('Resume file is required (upload as multipart "resume" or provide resume_url and resume_public_id).');
    }

    let answers = req.body.answers;
    if (typeof answers === 'string') {
      try {
        answers = JSON.parse(answers);
      } catch (e) {
        // ignore parse error
      }
    }

    const application = await CareersService.submitApplication(careerId, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      cover_letter: req.body.cover_letter,
      answers: answers || null,
      resume_url: resumeUrl,
      resume_public_id: resumePublicId,
    });

    res.status(201).json(
      ApiResponse.success('Application submitted successfully', application)
    );
  });

  static getApplications = asyncHandler(async (req: Request, res: Response) => {
    const { career_id, status, limit, page } = req.query;

    const result = await CareersService.getApplications({
      careerId: career_id as string,
      status: status as any,
      limit: limit ? parseInt(limit as string, 10) : 20,
      page: page ? parseInt(page as string, 10) : 1,
    });

    res.json(
      ApiResponse.success('Applications retrieved successfully', result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      })
    );
  });

  static getApplicationById = asyncHandler(async (req: Request, res: Response) => {
    const application = await CareersService.getApplicationById(req.params.id);
    res.json(ApiResponse.success('Application retrieved successfully', application));
  });

  static updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const updated = await CareersService.updateApplicationStatus(
      req.params.id,
      status,
      notes
    );
    res.json(ApiResponse.success('Application updated successfully', updated));
  });

  static deleteApplication = asyncHandler(async (req: Request, res: Response) => {
    await CareersService.deleteApplication(req.params.id);
    res.json(ApiResponse.success('Application deleted successfully', { id: req.params.id }));
  });
}
