import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

export class AnalyticsService {
  static async getSummary() {
    try {
      // Execute count queries in parallel
      const [
        testimonialsRes,
        portfolioRes,
        careersRes,
        openCareersRes,
        contactsRes,
        newContactsRes,
        applicationsRes,
        newApplicationsRes,
        logosRes,
      ] = await Promise.all([
        supabaseAdmin.from('testimonials').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('portfolio_items').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('careers').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('careers').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabaseAdmin.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabaseAdmin.from('job_applications').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabaseAdmin.from('client_logos').select('*', { count: 'exact', head: true }),
      ]);

      // Fetch recent items for activity feed
      const [recentContacts, recentApplications, recentTestimonials] = await Promise.all([
        supabaseAdmin
          .from('contact_submissions')
          .select('id, name, email, phone, subject, message, status, submitted_at')
          .order('submitted_at', { ascending: false })
          .limit(5),
        supabaseAdmin
          .from('job_applications')
          .select('id, name, email, phone, career_id, resume_url, cover_letter, status, applied_at, career:careers(title)')
          .order('applied_at', { ascending: false })
          .limit(5),
        supabaseAdmin
          .from('testimonials')
          .select('id, client_name, company, rating, published, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Status breakdowns
      const [contactStatusData, appStatusData] = await Promise.all([
        supabaseAdmin.from('contact_submissions').select('status'),
        supabaseAdmin.from('job_applications').select('status'),
      ]);

      const contactsByStatus = (contactStatusData.data || []).reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, { new: 0, read: 0, replied: 0, archived: 0 });

      const applicationsByStatus = (appStatusData.data || []).reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, { new: 0, reviewed: 0, shortlisted: 0, rejected: 0, hired: 0 });

      return {
        counts: {
          testimonials: testimonialsRes.count || 0,
          portfolio_items: portfolioRes.count || 0,
          client_logos: logosRes.count || 0,
          careers: {
            total: careersRes.count || 0,
            open: openCareersRes.count || 0,
          },
          contacts: {
            total: contactsRes.count || 0,
            new: newContactsRes.count || 0,
          },
          job_applications: {
            total: applicationsRes.count || 0,
            new: newApplicationsRes.count || 0,
          },
        },
        breakdowns: {
          contacts: contactsByStatus,
          applications: applicationsByStatus,
        },
        recent_activity: {
          contacts: recentContacts.data || [],
          applications: recentApplications.data || [],
          testimonials: recentTestimonials.data || [],
        },
      };
    } catch (error: any) {
      throw ApiError.internal(`Failed to aggregate analytics summary: ${error.message}`);
    }
  }
}
