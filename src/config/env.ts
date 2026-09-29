import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root of backend
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export function validateEnv(): void {
  const missing: string[] = [];

  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-project-id')) {
    missing.push('SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key')) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.includes('your_cloudinary')) {
    missing.push('CLOUDINARY_CLOUD_NAME');
  }
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes('your_cloudinary')) {
    missing.push('CLOUDINARY_API_KEY');
  }
  if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET.includes('your_cloudinary')) {
    missing.push('CLOUDINARY_API_SECRET');
  }

  if (missing.length > 0) {
    console.warn(
      `[CONFIG WARNING] Missing or default environment variables: ${missing.join(', ')}.\n` +
      `Please configure your .env file with actual Supabase and Cloudinary credentials.`
    );
  }
}
