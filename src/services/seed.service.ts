import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface SeedResult {
  success: boolean;
  message: string;
  counts?: {
    clientLogos: number;
    testimonials: number;
    portfolioItems: number;
    careers: number;
    applications: number;
    contacts: number;
    siteSettings: boolean;
  };
  adminEmail?: string;
}

export async function runDatabaseSeed(): Promise<SeedResult> {
  logger.info('🌱 Starting Agency CMS Database Seeding...');

  // 1. Check if Supabase keys are configured
  if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('your-project-id')) {
    throw new Error('Supabase credentials are missing or default in .env file.');
  }

  // 2. Pre-check if tables exist in Supabase
  const { error: testTableError } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (testTableError && testTableError.message.includes('schema cache')) {
    throw new Error(
      'Database tables have not been created yet in Supabase! Please run backend/supabase/migrations/001_initial_schema.sql in the Supabase SQL editor first.'
    );
  }

  // 3. Create or verify initial Admin User in Supabase Auth
  let adminUserId: string | undefined;
  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u) => u.email === env.SEED_ADMIN_EMAIL);
    adminUserId = existingUser?.id;

    if (!existingUser) {
      logger.info(`Creating admin user in Supabase Auth: ${env.SEED_ADMIN_EMAIL}...`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: env.SEED_ADMIN_EMAIL,
        password: env.SEED_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: env.SEED_ADMIN_NAME,
          role: 'admin',
        },
      });

      if (createError) {
        logger.warn(`Could not create auth admin user: ${createError.message}`);
      } else if (newUser?.user) {
        adminUserId = newUser.user.id;
      }
    }

    if (adminUserId) {
      await supabaseAdmin.from('profiles').upsert({
        id: adminUserId,
        email: env.SEED_ADMIN_EMAIL,
        full_name: env.SEED_ADMIN_NAME,
        role: 'admin',
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    logger.warn(`Admin creation notice: ${err.message}`);
  }

  // 4. Seed Client Logos
  const clientLogos = [
    {
      client_name: 'Hyperion Tech',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/hyperion.png',
      cloudinary_public_id: 'agency/client-logos/hyperion',
      website_link: 'https://hyperiontech.io',
      display_order: 1,
      is_active: true,
    },
    {
      client_name: 'Luminary Fashion',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/luminary.png',
      cloudinary_public_id: 'agency/client-logos/luminary',
      website_link: 'https://luminaryfashion.com',
      display_order: 2,
      is_active: true,
    },
    {
      client_name: 'Aura Wellness',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/aura.png',
      cloudinary_public_id: 'agency/client-logos/aura',
      website_link: 'https://aurawellness.co',
      display_order: 3,
      is_active: true,
    },
    {
      client_name: 'Vanguard Capital',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/vanguard.png',
      cloudinary_public_id: 'agency/client-logos/vanguard',
      website_link: 'https://vanguardcapital.com',
      display_order: 4,
      is_active: true,
    },
    {
      client_name: 'Nova Energy',
      logo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/client-logos/nova.png',
      cloudinary_public_id: 'agency/client-logos/nova',
      website_link: 'https://novaenergy.org',
      display_order: 5,
      is_active: true,
    },
  ];

  for (const logo of clientLogos) {
    await supabaseAdmin.from('client_logos').upsert(logo, { onConflict: 'client_name' as any });
  }

  // 5. Seed Testimonials
  const testimonials = [
    {
      client_name: 'Elena Rostova',
      company: 'Luminary Fashion',
      photo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/elena.jpg',
      cloudinary_public_id: 'agency/testimonials/elena',
      testimonial_text:
        'Saro elevated our luxury collection launch with breathtaking cinematic videography and a high-converting digital campaign that doubled our ROAS in 60 days.',
      rating: 5,
      published: true,
      display_order: 1,
    },
    {
      client_name: 'Marcus Vance',
      company: 'Hyperion Tech',
      photo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/marcus.jpg',
      cloudinary_public_id: 'agency/testimonials/marcus',
      testimonial_text:
        'The team delivered an outstanding brand identity and interactive web experience. Our enterprise demo requests increased by 140% post-rebrand.',
      rating: 5,
      published: true,
      display_order: 2,
    },
    {
      client_name: 'Sophia Chang',
      company: 'Aura Wellness',
      photo_url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/agency/testimonials/sophia.jpg',
      cloudinary_public_id: 'agency/testimonials/sophia',
      testimonial_text:
        'Their creative direction is unmatched. Every photoshoot and social reel feels bespoke, authentic, and impeccably aligned with our aesthetic.',
      rating: 5,
      published: true,
      display_order: 3,
    },
  ];

  for (const t of testimonials) {
    await supabaseAdmin.from('testimonials').upsert(t, { onConflict: 'client_name' as any });
  }

  // 6. Seed Portfolio Items & Media
  const portfolioItems = [
    {
      title: 'Ethereal Autumn Lookbook',
      slug: 'ethereal-autumn-lookbook',
      client: 'Luminary Fashion',
      category: 'photoshoot',
      description:
        'A high-fashion luxury autumn campaign shot on location in Milan featuring editorial portraits, textile details, and viral short-form TikTok & Instagram reels that drove a 2.4x increase in direct e-commerce sales.',
      date: 'October 2025',
      cover_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80',
      cover_image_public_id: 'agency/portfolio/covers/luminary-cover',
      media_type: 'image',
      tags: ['Fashion', 'Editorial', 'Milan', 'Creative Direction', 'Social Reels'],
      status: 'featured',
      display_order: 1,
      media: [
        {
          public_id: 'agency/portfolio/videos/luminary-fashion-reel',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          resource_type: 'video',
          caption: '15-second teaser reel produced for Instagram & TikTok',
          display_order: 1,
        },
        {
          public_id: 'agency/portfolio/gallery/luminary-1',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
          resource_type: 'image',
          caption: 'Editorial hero look for Milan Fashion Week',
          display_order: 2,
        },
        {
          public_id: 'agency/portfolio/gallery/luminary-2',
          url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
          resource_type: 'image',
          caption: 'Textile texture and bespoke tailoring details',
          display_order: 3,
        },
      ],
    },
    {
      title: 'Hyperion Next-Gen Cloud Platform',
      slug: 'hyperion-next-gen-cloud-platform',
      client: 'Hyperion Tech',
      category: 'branding',
      description:
        'Complete enterprise brand redesign, 3D motion graphics guidelines, and high-performance product website for an AI enterprise cloud platform, driving a 140% surge in enterprise pipeline demo requests.',
      date: 'January 2026',
      cover_image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
      cover_image_public_id: 'agency/portfolio/covers/hyperion-cover',
      media_type: 'image',
      tags: ['Branding', 'Enterprise', 'Motion Graphics', 'SaaS', 'Web Design'],
      status: 'featured',
      display_order: 2,
      media: [
        {
          public_id: 'agency/portfolio/videos/hyperion-3d-reel',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
          resource_type: 'video',
          caption: '3D motion design guidelines and product UI launch reel',
          display_order: 1,
        },
        {
          public_id: 'agency/portfolio/gallery/hyperion-1',
          url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
          resource_type: 'image',
          caption: 'Logo geometry, typography system, and dark UI palette',
          display_order: 2,
        },
      ],
    },
    {
      title: 'Mindful Living Documentary & Reel',
      slug: 'mindful-living-documentary-reel',
      client: 'Aura Wellness',
      category: 'videography',
      description:
        'A cinematic brand film shot across coastal California exploring mindful routines, sustainable botanicals, and holistic lifestyle routines, reaching over 1.2M views across YouTube and Meta ad networks.',
      date: 'February 2026',
      cover_image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80',
      cover_image_public_id: 'agency/portfolio/covers/aura-cover',
      media_type: 'video',
      tags: ['Videography', 'Cinematic', 'Documentary', 'Wellness', 'Meta Ads'],
      status: 'published',
      display_order: 3,
      media: [
        {
          public_id: 'agency/portfolio/videos/aura-film',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          resource_type: 'video',
          caption: 'Full 4K commercial brand spot and documentary teaser',
          display_order: 1,
        },
        {
          public_id: 'agency/portfolio/gallery/aura-1',
          url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
          resource_type: 'image',
          caption: 'Coastal sunrise location photography in Big Sur',
          display_order: 2,
        },
      ],
    },
  ];

  for (const item of portfolioItems) {
    const { media, ...itemData } = item;
    const { data: insertedItem } = await supabaseAdmin
      .from('portfolio_items')
      .upsert(itemData, { onConflict: 'slug' })
      .select()
      .single();

    if (insertedItem && media && media.length > 0) {
      await supabaseAdmin.from('portfolio_media').delete().eq('portfolio_item_id', insertedItem.id);
      const mediaToInsert = media.map((m) => ({
        portfolio_item_id: insertedItem.id,
        ...m,
      }));
      await supabaseAdmin.from('portfolio_media').insert(mediaToInsert);
    }
  }

  // 7. Seed Careers & Sample Application
  const careers = [
    {
      title: 'Senior Creative Director',
      department: 'Creative & Design',
      location: 'New York / Hybrid',
      type: 'full-time',
      description:
        'Lead our multidisciplinary team of designers, videographers, and brand strategists to craft landmark campaigns for high-growth tech and luxury brands.',
      requirements: [
        '7+ years experience leading creative teams in high-tier agencies',
        'Proven portfolio spanning editorial, video direction, and brand systems',
        'Mastery of Adobe Creative Cloud, Figma, and modern storytelling mediums',
        'Strong client presentation and pitching track record',
      ],
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
    },
    {
      title: 'Performance Marketing Manager',
      department: 'Growth & Analytics',
      location: 'Remote',
      type: 'full-time',
      description:
        'Manage 7-figure multi-channel ad spend across Meta, Google Search/YouTube, TikTok, and programmatic channels, executing rigorous creative testing.',
      requirements: [
        '4+ years scaling paid acquisition with demonstrable ROAS improvement',
        'Deep fluency in Google Ads, Meta Ads Manager, GA4, and attribution models',
        'Data-driven mindset with analytical proficiency in SQL and spreadsheet modeling',
        'Agile communication with creative teams to guide iteration',
      ],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
    },
  ];

  let firstCareerId: string | null = null;
  for (const c of careers) {
    const { data } = await supabaseAdmin
      .from('careers')
      .upsert(c, { onConflict: 'title' as any })
      .select()
      .single();

    if (data && !firstCareerId) {
      firstCareerId = data.id;
    }
  }

  if (firstCareerId) {
    await supabaseAdmin.from('job_applications').insert([
      {
        career_id: firstCareerId,
        name: 'Julian Davies',
        email: 'julian.davies@example.com',
        phone: '+1 (555) 987-6543',
        resume_url:
          'https://res.cloudinary.com/demo/raw/upload/v1612345678/agency/resumes/julian_davies_resume.pdf',
        resume_public_id: 'agency/resumes/julian_davies_resume',
        cover_letter:
          'I have followed Saro creative work for years and would love to bring my decade of agency creative leadership to your growing roster of clients.',
        status: 'new',
        notes: 'Strong portfolio from Pentagram alumni. Schedule initial portfolio screening.',
      },
    ]);
  }

  // 8. Seed Contact Form Inquiries
  const contacts = [
    {
      name: 'Sarah Jenkins',
      email: 's.jenkins@zenithcapital.com',
      phone: '+1 (555) 443-2211',
      subject: 'Rebranding & Digital Strategy Inquiry',
      message:
        'Hi Saro team, we are preparing for a Series B funding round in Q3 and are looking for a complete overhaul of our digital brand identity and web presence. We would love to discuss a timeline and budget estimate.',
      status: 'new',
      notes: 'High priority enterprise lead. Forwarded to Head of Growth.',
    },
    {
      name: 'David Miller',
      email: 'dmiller@solisbeverages.com',
      phone: '+1 (555) 321-9988',
      subject: 'Commercial Videography & Social Ads Campaign',
      message:
        'We are launching a new sparkling prebiotic tea line this summer across national retailers and need high-impact commercial video spots plus vertical TikTok ads.',
      status: 'read',
      notes: 'Followed up with discovery questionnaire.',
    },
  ];

  await supabaseAdmin.from('contact_submissions').insert(contacts);

  // 9. Seed Site Settings
  await supabaseAdmin.from('site_settings').upsert([
    {
      hero_headline: 'Transforming Brands Into Digital Legacies',
      hero_subheadline:
        'We craft compelling digital experiences, high-converting campaigns, and visual stories that elevate your brand.',
      hero_cta_text: 'Explore Our Work',
      hero_cta_link: '/portfolio',
      meta_title: 'Saro Agency | Digital Marketing & Creative Production',
      meta_description:
        'Award-winning digital marketing, brand strategy, videography, and web design agency.',
      contact_email: 'hello@saroagency.com',
      contact_phone: '+1 (555) 234-5678',
      social_links: {
        instagram: 'https://instagram.com/saroagency',
        linkedin: 'https://linkedin.com/company/saroagency',
        twitter: 'https://twitter.com/saroagency',
        youtube: 'https://youtube.com/@saroagency',
      },
    },
  ]);

  return {
    success: true,
    message: 'Agency CMS database seeded successfully!',
    counts: {
      clientLogos: clientLogos.length,
      testimonials: testimonials.length,
      portfolioItems: portfolioItems.length,
      careers: careers.length,
      applications: 1,
      contacts: contacts.length,
      siteSettings: true,
    },
    adminEmail: env.SEED_ADMIN_EMAIL,
  };
}
