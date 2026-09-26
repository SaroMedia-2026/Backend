import { supabaseAdmin } from '../config/supabase.js';
import { ContactSubmission, ContactStatus } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';

export interface ContactFilters {
  status?: ContactStatus;
  limit?: number;
  page?: number;
}

export class ContactsService {
  static async submitContactForm(payload: {
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
  }): Promise<ContactSubmission> {
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert([
        {
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          subject: payload.subject || null,
          message: payload.message,
          status: 'new',
        },
      ])
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to submit contact message: ${error.message}`);
    return data;
  }

  static async getAll(filters: ContactFilters = {}) {
    const { status, limit = 20, page = 1 } = filters;

    let query = supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false });

    const validStatuses: ContactStatus[] = ['new', 'read', 'replied', 'archived'];
    if (status && validStatuses.includes(status)) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch contact submissions: ${error.message}`);

    return {
      items: data as ContactSubmission[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getById(id: string): Promise<ContactSubmission> {
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Contact submission '${id}' not found`);
    return data;
  }

  static async updateStatus(
    id: string,
    status: ContactStatus,
    notes?: string | null
  ): Promise<ContactSubmission> {
    await this.getById(id);

    const updatePayload: any = { status };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to update contact submission: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    await this.getById(id);

    const { error } = await supabaseAdmin
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete contact submission: ${error.message}`);
  }
}
