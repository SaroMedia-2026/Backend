-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Digital Marketing Agency CMS Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Profiles Table (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. Helper Functions for Role Checking
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create or update profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'admin'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. Client Logos Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.client_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL UNIQUE,
  logo_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  website_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_client_logos_modtime
  BEFORE UPDATE ON public.client_logos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. Testimonials Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL UNIQUE,
  company TEXT,
  photo_url TEXT,
  cloudinary_public_id TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_testimonials_modtime
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. Portfolio Items Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  client TEXT,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT,
  cover_image_url TEXT NOT NULL,
  cover_image_public_id TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'featured')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_portfolio_items_modtime
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. Portfolio Media Table (Gallery of Images & Videos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id UUID NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  public_id TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'image' CHECK (resource_type IN ('image', 'video')),
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. Careers Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'remote', 'internship')),
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_careers_modtime
  BEFORE UPDATE ON public.careers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. Job Applications Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES public.careers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT NOT NULL,
  resume_public_id TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_job_applications_modtime
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. Contact Submissions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_contact_submissions_modtime
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. Site Settings Table (Single-row or key-value global config)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_headline TEXT NOT NULL DEFAULT 'Transforming Brands Into Digital Legacies',
  hero_subheadline TEXT NOT NULL DEFAULT 'We craft compelling digital experiences, high-converting campaigns, and visual stories that elevate your brand.',
  hero_cta_text TEXT NOT NULL DEFAULT 'Explore Our Work',
  hero_cta_link TEXT NOT NULL DEFAULT '/portfolio',
  meta_title TEXT DEFAULT 'Saro Agency | Digital Marketing & Creative Production',
  meta_description TEXT DEFAULT 'Award-winning digital marketing, brand strategy, videography, and web design agency.',
  contact_email TEXT DEFAULT 'hello@saroagency.com',
  contact_phone TEXT DEFAULT '+1 (555) 234-5678',
  social_links JSONB DEFAULT '{"instagram": "https://instagram.com", "linkedin": "https://linkedin.com", "twitter": "https://twitter.com", "youtube": "https://youtube.com"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_site_settings_modtime
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure single settings row exists
INSERT INTO public.site_settings (
  hero_headline,
  hero_subheadline,
  hero_cta_text,
  hero_cta_link
) VALUES (
  'Transforming Brands Into Digital Legacies',
  'We craft compelling digital experiences, high-converting campaigns, and visual stories that elevate your brand.',
  'Explore Our Work',
  '/portfolio'
) ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 12. Create High-Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_client_logos_order ON public.client_logos (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_client_logos_active ON public.client_logos (is_active);
CREATE INDEX IF NOT EXISTS idx_client_logos_active_order ON public.client_logos (is_active, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_testimonials_order ON public.testimonials (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials (published);
CREATE INDEX IF NOT EXISTS idx_testimonials_published_order ON public.testimonials (published, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_status ON public.portfolio_items (status);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category ON public.portfolio_items (category);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_slug ON public.portfolio_items (slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_order ON public.portfolio_items (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_status_order ON public.portfolio_items (status, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_cat_status ON public.portfolio_items (category, status);

CREATE INDEX IF NOT EXISTS idx_portfolio_media_item ON public.portfolio_media (portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_order ON public.portfolio_media (display_order ASC);

CREATE INDEX IF NOT EXISTS idx_careers_status ON public.careers (status);
CREATE INDEX IF NOT EXISTS idx_careers_department ON public.careers (department);
CREATE INDEX IF NOT EXISTS idx_careers_status_created ON public.careers (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_career ON public.job_applications (career_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_date ON public.job_applications (applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_career_date ON public.job_applications (career_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions (status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_date ON public.contact_submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_date ON public.contact_submissions (status, submitted_at DESC);

-- ==============================================================================
-- 13. Enable Row Level Security (RLS) on All Tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 14. Row Level Security Policies
-- ==============================================================================

-- --- PROFILES ---
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- --- CLIENT LOGOS ---
CREATE POLICY "Public read active client logos"
  ON public.client_logos FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Staff manage client logos"
  ON public.client_logos FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- TESTIMONIALS ---
CREATE POLICY "Public read published testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Staff manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- PORTFOLIO ITEMS ---
CREATE POLICY "Public read published or featured portfolio items"
  ON public.portfolio_items FOR SELECT
  TO anon, authenticated
  USING (status IN ('published', 'featured'));

CREATE POLICY "Staff manage portfolio items"
  ON public.portfolio_items FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- PORTFOLIO MEDIA ---
CREATE POLICY "Public read media for published portfolio items"
  ON public.portfolio_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_items
      WHERE public.portfolio_items.id = portfolio_media.portfolio_item_id
        AND public.portfolio_items.status IN ('published', 'featured')
    )
  );

CREATE POLICY "Staff manage portfolio media"
  ON public.portfolio_media FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- CAREERS ---
CREATE POLICY "Public read open career listings"
  ON public.careers FOR SELECT
  TO anon, authenticated
  USING (status = 'open');

CREATE POLICY "Staff manage career listings"
  ON public.careers FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- JOB APPLICATIONS ---
CREATE POLICY "Public can submit job applications"
  ON public.job_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff manage job applications"
  ON public.job_applications FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- CONTACT SUBMISSIONS ---
CREATE POLICY "Public can submit contact messages"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff manage contact submissions"
  ON public.contact_submissions FOR ALL
  TO authenticated
  USING (public.is_staff());

-- --- SITE SETTINGS ---
CREATE POLICY "Public read site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin());
