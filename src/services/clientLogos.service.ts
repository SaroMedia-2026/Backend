import { supabaseAdmin } from '../config/supabase.js';
import { ClientLogo } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { CloudinaryService } from './cloudinary.service.js';

export class ClientLogosService {
  static async getAll(onlyActive: boolean = false): Promise<ClientLogo[]> {
    let query = supabaseAdmin
      .from('client_logos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch client logos: ${error.message}`);
    return data || [];
  }

  static async getById(id: string): Promise<ClientLogo> {
    const { data, error } = await supabaseAdmin
      .from('client_logos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Client logo with id '${id}' not found`);
    return data;
  }

  static async create(payload: Partial<ClientLogo>): Promise<ClientLogo> {
    const { data, error } = await supabaseAdmin
      .from('client_logos')
      .insert([payload])
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to create client logo: ${error.message}`);
    return data;
  }

  static async update(id: string, payload: Partial<ClientLogo>): Promise<ClientLogo> {
    const existing = await this.getById(id);

    // If logo_url or cloudinary_public_id is being replaced, clean up old asset
    if (
      payload.cloudinary_public_id &&
      payload.cloudinary_public_id !== existing.cloudinary_public_id
    ) {
      await CloudinaryService.deleteAsset(existing.cloudinary_public_id, 'image');
    }

    const { data, error } = await supabaseAdmin
      .from('client_logos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to update client logo: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const existing = await this.getById(id);

    // Remove from DB first
    const { error } = await supabaseAdmin
      .from('client_logos')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete client logo: ${error.message}`);

    // Clean up Cloudinary asset
    if (existing.cloudinary_public_id) {
      await CloudinaryService.deleteAsset(existing.cloudinary_public_id, 'image');
    }
  }

  static async reorder(items: { id: string; display_order: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await supabaseAdmin
        .from('client_logos')
        .update({ display_order: item.display_order })
        .eq('id', item.id);

      if (error) throw ApiError.internal(`Failed to reorder logo ${item.id}: ${error.message}`);
    }
  }
}
