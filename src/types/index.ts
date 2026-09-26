import { User as SupabaseAuthUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'editor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  auth: SupabaseAuthUser;
  profile: UserProfile;
}

export interface ClientLogo {
  id: string;
  client_name: string;
  logo_url: string;
  cloudinary_public_id: string;
  website_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  company: string | null;
  photo_url: string | null;
  cloudinary_public_id: string | null;
  testimonial_text: string;
  rating: number;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type PortfolioCategory =
  | 'photoshoot'
  | 'videography'
  | 'branding'
  | 'web-development'
  | 'social-media'
  | string;

export type PortfolioStatus = 'published' | 'draft' | 'featured';
export type MediaType = 'image' | 'video';

export interface PortfolioMedia {
  id: string;
  portfolio_item_id: string;
  public_id: string;
  url: string;
  resource_type: MediaType;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  client: string | null;
  category: PortfolioCategory;
  description: string | null;
  date: string | null;
  cover_image_url: string;
  cover_image_public_id: string;
  media_type: MediaType;
  tags: string[];
  status: PortfolioStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  media?: PortfolioMedia[];
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship';
export type CareerStatus = 'open' | 'closed' | 'draft';

export interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  deadline: string | null;
  status: CareerStatus;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';

export interface JobApplication {
  id: string;
  career_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string;
  resume_public_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string;
  updated_at: string;
  career?: Partial<Career>;
}

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta_text: string;
  hero_cta_link: string;
  meta_title: string | null;
  meta_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}
