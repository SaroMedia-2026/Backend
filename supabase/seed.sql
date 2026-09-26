-- ==============================================================================
-- Seed: seed.sql
-- Description: Sample mock data for Digital Marketing Agency CMS
-- ==============================================================================

-- 1. Client Logos
INSERT INTO public.client_logos (client_name, logo_url, cloudinary_public_id, website_link, display_order, is_active)
VALUES
  ('Hyperion Tech', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/hyperion.png', 'agency/client-logos/hyperion', 'https://hyperiontech.io', 1, true),
  ('Luminary Fashion', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/luminary.png', 'agency/client-logos/luminary', 'https://luminaryfashion.com', 2, true),
  ('Aura Wellness', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/aura.png', 'agency/client-logos/aura', 'https://aurawellness.co', 3, true),
  ('Vanguard Capital', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/vanguard.png', 'agency/client-logos/vanguard', 'https://vanguardcapital.com', 4, true),
  ('Nova Energy', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/nova.png', 'agency/client-logos/nova', 'https://novaenergy.org', 5, true)
ON CONFLICT DO NOTHING;

-- 2. Testimonials
INSERT INTO public.testimonials (client_name, company, photo_url, cloudinary_public_id, testimonial_text, rating, published, display_order)
VALUES
  ('Elena Rostova', 'Luminary Fashion', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/elena.jpg', 'agency/testimonials/elena', 'Saro elevated our luxury collection launch with breathtaking cinematic videography and a high-converting digital campaign that doubled our ROAS in 60 days.', 5, true, 1),
  ('Marcus Vance', 'Hyperion Tech', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/marcus.jpg', 'agency/testimonials/marcus', 'The team delivered an outstanding brand identity and interactive web experience. Our enterprise demo requests increased by 140% post-rebrand.', 5, true, 2),
  ('Sophia Chang', 'Aura Wellness', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/sophia.jpg', 'agency/testimonials/sophia', 'Their creative direction is unmatched. Every photoshoot and social reel feels bespoke, authentic, and impeccably aligned with our aesthetic.', 5, true, 3)
ON CONFLICT DO NOTHING;

-- 3. Portfolio Items & Media
DO $$
DECLARE
  item1_id UUID := gen_random_uuid();
  item2_id UUID := gen_random_uuid();
  item3_id UUID := gen_random_uuid();
BEGIN
  -- Portfolio Item 1: Luminary Fashion Campaign
  INSERT INTO public.portfolio_items (
    id, title, slug, client, category, description, date,
    cover_image_url, cover_image_public_id, media_type, tags, status, display_order
  ) VALUES (
    item1_id,
    'Ethereal Autumn Lookbook',
    'ethereal-autumn-lookbook',
    'Luminary Fashion',
    'photoshoot',
    'A high-fashion autumn campaign shot on location in Milan featuring editorial portraits, texture closeups, and short-form TikTok/Instagram reels.',
    'October 2025',
    'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/covers/luminary-cover.jpg',
    'agency/portfolio/covers/luminary-cover',
    'image',
    ARRAY['Fashion', 'Editorial', 'Milan', 'Creative Direction'],
    'featured',
    1
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.portfolio_media (portfolio_item_id, public_id, url, resource_type, caption, display_order)
  VALUES
    (item1_id, 'agency/portfolio/gallery/luminary-1', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/gallery/luminary-1.jpg', 'image', 'Editorial hero shot Milan fashion week', 1),
    (item1_id, 'agency/portfolio/gallery/luminary-2', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/gallery/luminary-2.jpg', 'image', 'Silk and wool textile details', 2),
    (item1_id, 'agency/portfolio/videos/luminary-reel', 'https://res.cloudinary.com/demo/video/upload/v1612345678/agency/portfolio/videos/luminary-reel.mp4', 'video', '15-second teaser reel for Instagram', 3)
  ON CONFLICT DO NOTHING;

  -- Portfolio Item 2: Hyperion Tech Brand Evolution
  INSERT INTO public.portfolio_items (
    id, title, slug, client, category, description, date,
    cover_image_url, cover_image_public_id, media_type, tags, status, display_order
  ) VALUES (
    item2_id,
    'Hyperion Next-Gen Cloud Platform',
    'hyperion-next-gen-cloud-platform',
    'Hyperion Tech',
    'branding',
    'Complete brand redesign, 3D motion graphics guidelines, and high-performance product website for an AI enterprise cloud platform.',
    'January 2026',
    'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/covers/hyperion-cover.jpg',
    'agency/portfolio/covers/hyperion-cover',
    'image',
    ARRAY['Branding', 'Enterprise', 'Motion Graphics', 'SaaS'],
    'featured',
    2
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.portfolio_media (portfolio_item_id, public_id, url, resource_type, caption, display_order)
  VALUES
    (item2_id, 'agency/portfolio/gallery/hyperion-1', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/gallery/hyperion-1.jpg', 'image', 'Logo mark geometry and typography guidelines', 1),
    (item2_id, 'agency/portfolio/gallery/hyperion-2', 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/gallery/hyperion-2.jpg', 'image', 'App dashboard UI redesign', 2)
  ON CONFLICT DO NOTHING;

  -- Portfolio Item 3: Aura Wellness Brand Film
  INSERT INTO public.portfolio_items (
    id, title, slug, client, category, description, date,
    cover_image_url, cover_image_public_id, media_type, tags, status, display_order
  ) VALUES (
    item3_id,
    'Mindful Living Documentary & Reel',
    'mindful-living-documentary-reel',
    'Aura Wellness',
    'videography',
    'A cinematic brand film shot across coastal California exploring mindful routines, sustainable botanicals, and holistic lifestyle routines.',
    'February 2026',
    'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/portfolio/covers/aura-cover.jpg',
    'agency/portfolio/covers/aura-cover',
    'video',
    ARRAY['Videography', 'Cinematic', 'Documentary', 'Wellness'],
    'published',
    3
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.portfolio_media (portfolio_item_id, public_id, url, resource_type, caption, display_order)
  VALUES
    (item3_id, 'agency/portfolio/videos/aura-film', 'https://res.cloudinary.com/demo/video/upload/v1612345678/agency/portfolio/videos/aura-film.mp4', 'video', 'Main cinematic brand film (4K)', 1)
  ON CONFLICT DO NOTHING;
END $$;

-- 4. Careers
DO $$
DECLARE
  career1_id UUID := gen_random_uuid();
  career2_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.careers (
    id, title, department, location, type, description, requirements, deadline, status
  ) VALUES (
    career1_id,
    'Senior Creative Director',
    'Creative & Design',
    'New York / Hybrid',
    'full-time',
    'Lead our multidisciplinary team of designers, videographers, and brand strategists to craft landmark campaigns for high-growth tech and luxury brands.',
    ARRAY[
      '7+ years experience leading creative teams in high-tier agencies',
      'Proven portfolio spanning editorial, video direction, and brand systems',
      'Mastery of Adobe Creative Cloud, Figma, and modern storytelling mediums',
      'Strong client presentation and pitching track record'
    ],
    NOW() + INTERVAL '45 days',
    'open'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.careers (
    id, title, department, location, type, description, requirements, deadline, status
  ) VALUES (
    career2_id,
    'Performance Marketing Manager',
    'Growth & Analytics',
    'Remote',
    'full-time',
    'Manage 7-figure multi-channel ad spend across Meta, Google Search/YouTube, TikTok, and programmatic channels, executing rigorous creative testing.',
    ARRAY[
      '4+ years scaling paid acquisition with demonstrable ROAS improvement',
      'Deep fluency in Google Ads, Meta Ads Manager, GA4, and attribution models',
      'Data-driven mindset with analytical proficiency in SQL and spreadsheet modeling',
      'Agile communication with creative teams to guide iteration'
    ],
    NOW() + INTERVAL '30 days',
    'open'
  ) ON CONFLICT DO NOTHING;

  -- 5. Sample Job Application
  INSERT INTO public.job_applications (
    career_id, name, email, phone, resume_url, resume_public_id, cover_letter, status, notes
  ) VALUES (
    career1_id,
    'Julian Davies',
    'julian.davies@example.com',
    '+1 (555) 987-6543',
    'https://res.cloudinary.com/demo/raw/upload/v1612345678/agency/resumes/julian_davies_resume.pdf',
    'agency/resumes/julian_davies_resume',
    'I have followed Saro creative work for years and would love to bring my decade of agency creative leadership to your growing roster of clients.',
    'new',
    'Strong portfolio from Pentagram alumni. Schedule initial portfolio screening.'
  ) ON CONFLICT DO NOTHING;
END $$;

-- 6. Sample Contact Submissions
INSERT INTO public.contact_submissions (name, email, phone, subject, message, status, notes)
VALUES
  (
    'Sarah Jenkins',
    's.jenkins@zenithcapital.com',
    '+1 (555) 443-2211',
    'Rebranding & Digital Strategy Inquiry',
    'Hi Saro team, we are preparing for a Series B funding round in Q3 and are looking for a complete overhaul of our digital brand identity and web presence. We would love to discuss a timeline and budget estimate.',
    'new',
    'High priority enterprise lead. Forwarded to Head of Growth.'
  ),
  (
    'David Miller',
    'dmiller@solisbeverages.com',
    '+1 (555) 321-9988',
    'Commercial Videography & Social Ads Campaign',
    'We are launching a new sparkling prebiotic tea line this summer across national retailers and need high-impact commercial video spots plus vertical TikTok ads.',
    'read',
    'Followed up with discovery questionnaire.'
  )
ON CONFLICT DO NOTHING;
