import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/apiError.js';

// Memory storage keeps file buffer in memory for direct streaming to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/mpeg',
];

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
];

// Unified file filter supporting images, videos, and documents
const anyAgencyFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowed = [
    ...IMAGE_MIME_TYPES,
    ...VIDEO_MIME_TYPES,
    ...DOCUMENT_MIME_TYPES,
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPG, PNG, WEBP, SVG, MP4, MOV, WEBM, PDF, DOC, DOCX.`
      )
    );
  }
};

// Resume specific filter
const resumeFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid resume file type: ${file.mimetype}. Allowed: PDF, DOC, DOCX, RTF, TXT.`
      )
    );
  }
};

// General uploader (Max 50MB per file to allow video reels)
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: anyAgencyFileFilter,
});

// Resume uploader (Max 15MB)
export const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter: resumeFilter,
});

// Helper middlewares
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);

export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) =>
  upload.array(fieldName, maxCount);

export const uploadPortfolioFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]);
