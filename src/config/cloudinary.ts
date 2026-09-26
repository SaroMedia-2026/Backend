import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Standardized Cloudinary folder structure for the agency
 */
export const CLOUDINARY_FOLDERS = {
  CLIENT_LOGOS: 'agency/client-logos',
  TESTIMONIALS: 'agency/testimonials',
  PORTFOLIO_COVERS: 'agency/portfolio/covers',
  PORTFOLIO_GALLERY: 'agency/portfolio/gallery',
  PORTFOLIO_VIDEOS: 'agency/portfolio/videos',
  RESUMES: 'agency/resumes',
  GENERAL: 'agency/general',
} as const;

export type AgencyFolder = typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS] | string;

export { cloudinary };
