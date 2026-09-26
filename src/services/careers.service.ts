import { supabaseAdmin } from '../config/supabase.js';
import { Career, JobApplication, ApplicationStatus } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { CloudinaryService } from './cloudinary.service.js';

export interface ApplicationFilters {
  careerId?: string;
  status?: ApplicationStatus;
  limit?: number;
  page?: number;
}

export class CareersService {
  // --- CAREER LISTINGS ---

  static async getAllCareers(onlyOpen: boolean = false, department?: string): Promise<Career[]> {
    let query = supabaseAdmin
      .from('careers')
      .select('*')
      .order('created_at', { ascending: false });

    if (onlyOpen) {
      query = query.eq('status', 'open');
    }

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch careers: ${error.message}`);
    return data || [];
  }

  static async getCareerById(id: string): Promise<Career> {
    const { data, error } = await supabaseAdmin
      .from('careers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Career listing '${id}' not found`);
    return data;
  }

  static async createCareer(payload: Partial<Career>): Promise<Career> {
    const { data, error } = await supabaseAdmin
      .from('careers')
      .insert([payload])
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to create career listing: ${error.message}`);
    return data;
  }

  static async updateCareer(id: string, payload: Partial<Career>): Promise<Career> {
    await this.getCareerById(id);

    const { data, error } = await supabaseAdmin
      .from('careers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to update career: ${error.message}`);
    return data;
  }

  static async deleteCareer(id: string): Promise<void> {
    await this.getCareerById(id);

    const { error } = await supabaseAdmin
      .from('careers')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete career listing: ${error.message}`);
  }

  // --- JOB APPLICATIONS ---

  static async submitApplication(
    careerId: string,
    payload: {
      name: string;
      email: string;
      phone?: string | null;
      resume_url: string;
      resume_public_id: string;
      cover_letter?: string | null;
    }
  ): Promise<JobApplication> {
    // Validate career exists and is open
    const career = await this.getCareerById(careerId);
    if (career.status !== 'open') {
      throw ApiError.badRequest('This job listing is currently closed to new applications.');
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .insert([
        {
          career_id: careerId,
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          resume_url: payload.resume_url,
          resume_public_id: payload.resume_public_id,
          cover_letter: payload.cover_letter || null,
          status: 'new',
        },
      ])
      .select('*, career:careers(title, department, location)')
      .single();

    if (error) throw ApiError.internal(`Failed to submit job application: ${error.message}`);
    return data;
  }

  static async getApplications(filters: ApplicationFilters = {}) {
    const { careerId, status, limit = 20, page = 1 } = filters;

    let query = supabaseAdmin
      .from('job_applications')
      .select('*, career:careers(title, department, location, type)', { count: 'exact' })
      .order('applied_at', { ascending: false });

    if (careerId) {
      query = query.eq('career_id', careerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch job applications: ${error.message}`);

    return {
      items: data as JobApplication[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getApplicationById(id: string): Promise<JobApplication> {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select('*, career:careers(title, department, location, type, status)')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Job application '${id}' not found`);
    return data;
  }

  static async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    notes?: string | null
  ): Promise<JobApplication> {
    await this.getApplicationById(id);

    const updatePayload: any = { status };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update(updatePayload)
      .eq('id', id)
      .select('*, career:careers(title, department, location)')
      .single();

    if (error) throw ApiError.internal(`Failed to update application: ${error.message}`);
    return data;
  }

  static async deleteApplication(id: string): Promise<void> {
    const existing = await this.getApplicationById(id);

    const { error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete application: ${error.message}`);

    // Clean up resume from Cloudinary (uploaded as 'raw')
    if (existing.resume_public_id) {
      await CloudinaryService.deleteAsset(existing.resume_public_id, 'raw');
    }
  }
}
