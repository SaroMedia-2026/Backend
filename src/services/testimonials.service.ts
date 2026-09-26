import { supabaseAdmin } from '../config/supabase.js';
import { Testimonial } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { CloudinaryService } from './cloudinary.service.js';

export class TestimonialsService {
  static async getAll(onlyPublished: boolean = false): Promise<Testimonial[]> {
    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (onlyPublished) {
      query = query.eq('published', true);
    }

    const { data, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch testimonials: ${error.message}`);
    return data || [];
  }

  static async getById(id: string): Promise<Testimonial> {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Testimonial with id '${id}' not found`);
    return data;
  }

  static async create(payload: Partial<Testimonial>): Promise<Testimonial> {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert([payload])
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to create testimonial: ${error.message}`);
    return data;
  }

  static async update(id: string, payload: Partial<Testimonial>): Promise<Testimonial> {
    const existing = await this.getById(id);

    // Clean up old Cloudinary photo if replaced
    if (
      payload.cloudinary_public_id &&
      existing.cloudinary_public_id &&
      payload.cloudinary_public_id !== existing.cloudinary_public_id
    ) {
      await CloudinaryService.deleteAsset(existing.cloudinary_public_id, 'image');
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to update testimonial: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const existing = await this.getById(id);

    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete testimonial: ${error.message}`);

    if (existing.cloudinary_public_id) {
      await CloudinaryService.deleteAsset(existing.cloudinary_public_id, 'image');
    }
  }

  static async reorder(items: { id: string; display_order: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await supabaseAdmin
        .from('testimonials')
        .update({ display_order: item.display_order })
        .eq('id', item.id);

      if (error) throw ApiError.internal(`Failed to reorder testimonial ${item.id}: ${error.message}`);
    }
  }
}
