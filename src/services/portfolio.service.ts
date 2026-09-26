import { supabaseAdmin } from '../config/supabase.js';
import { PortfolioItem, PortfolioMedia } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { CloudinaryService } from './cloudinary.service.js';

export interface PortfolioQueryFilters {
  category?: string;
  status?: string;
  tag?: string;
  featuredOnly?: boolean;
  publicOnly?: boolean;
  limit?: number;
  page?: number;
}

export class PortfolioService {
  static async getAll(filters: PortfolioQueryFilters = {}) {
    const {
      category,
      status,
      tag,
      featuredOnly,
      publicOnly = false,
      limit = 20,
      page = 1,
    } = filters;

    let query = supabaseAdmin
      .from('portfolio_items')
      .select('*, media:portfolio_media(*)', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (publicOnly) {
      query = query.in('status', ['published', 'featured']);
    } else if (status) {
      query = query.eq('status', status);
    }

    if (featuredOnly) {
      query = query.eq('status', 'featured');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw ApiError.internal(`Failed to fetch portfolio items: ${error.message}`);

    // Sort nested media by display_order
    const items = (data || []).map((item) => ({
      ...item,
      media: (item.media || []).sort(
        (a: PortfolioMedia, b: PortfolioMedia) => a.display_order - b.display_order
      ),
    }));

    return {
      items: items as PortfolioItem[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getById(id: string): Promise<PortfolioItem> {
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .select('*, media:portfolio_media(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw ApiError.notFound(`Portfolio item with id '${id}' not found`);

    return {
      ...data,
      media: (data.media || []).sort(
        (a: PortfolioMedia, b: PortfolioMedia) => a.display_order - b.display_order
      ),
    };
  }

  static async getBySlug(slug: string, publicOnly: boolean = false): Promise<PortfolioItem> {
    let query = supabaseAdmin
      .from('portfolio_items')
      .select('*, media:portfolio_media(*)')
      .eq('slug', slug);

    if (publicOnly) {
      query = query.in('status', ['published', 'featured']);
    }

    const { data, error } = await query.single();
    if (error || !data) throw ApiError.notFound(`Portfolio project '${slug}' not found`);

    return {
      ...data,
      media: (data.media || []).sort(
        (a: PortfolioMedia, b: PortfolioMedia) => a.display_order - b.display_order
      ),
    };
  }

  static async create(
    payload: Partial<PortfolioItem>,
    mediaItems?: Partial<PortfolioMedia>[]
  ): Promise<PortfolioItem> {
    const { media, ...itemData } = payload as any;

    const { data: item, error: itemError } = await supabaseAdmin
      .from('portfolio_items')
      .insert([itemData])
      .select()
      .single();

    if (itemError) throw ApiError.internal(`Failed to create portfolio item: ${itemError.message}`);

    const mediaToInsert = mediaItems || media;
    if (mediaToInsert && mediaToInsert.length > 0) {
      const formattedMedia = mediaToInsert.map((m: any, idx: number) => ({
        portfolio_item_id: item.id,
        public_id: m.public_id,
        url: m.url,
        resource_type: m.resource_type || 'image',
        caption: m.caption || null,
        display_order: m.display_order ?? idx + 1,
      }));

      const { data: insertedMedia, error: mediaError } = await supabaseAdmin
        .from('portfolio_media')
        .insert(formattedMedia)
        .select();

      if (!mediaError) {
        item.media = insertedMedia;
      }
    }

    return item;
  }

  static async update(id: string, payload: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const existing = await this.getById(id);

    // If cover image was replaced, delete old one from Cloudinary
    if (
      payload.cover_image_public_id &&
      payload.cover_image_public_id !== existing.cover_image_public_id
    ) {
      await CloudinaryService.deleteAsset(
        existing.cover_image_public_id,
        existing.media_type === 'video' ? 'video' : 'image'
      );
    }

    const { media, ...itemData } = payload as any;

    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .update(itemData)
      .eq('id', id)
      .select('*, media:portfolio_media(*)')
      .single();

    if (error) throw ApiError.internal(`Failed to update portfolio item: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const existing = await this.getById(id);

    // 1. Delete from DB (cascade deletes portfolio_media)
    const { error } = await supabaseAdmin
      .from('portfolio_items')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.internal(`Failed to delete portfolio item: ${error.message}`);

    // 2. Clean up cover asset
    if (existing.cover_image_public_id) {
      await CloudinaryService.deleteAsset(
        existing.cover_image_public_id,
        existing.media_type === 'video' ? 'video' : 'image'
      );
    }

    // 3. Clean up all gallery assets
    if (existing.media && existing.media.length > 0) {
      for (const m of existing.media) {
        if (m.public_id) {
          await CloudinaryService.deleteAsset(m.public_id, m.resource_type);
        }
      }
    }
  }

  static async addMedia(
    portfolioItemId: string,
    mediaList: Partial<PortfolioMedia>[]
  ): Promise<PortfolioMedia[]> {
    await this.getById(portfolioItemId); // Ensure item exists

    const formattedMedia = mediaList.map((m, idx) => ({
      portfolio_item_id: portfolioItemId,
      public_id: m.public_id!,
      url: m.url!,
      resource_type: m.resource_type || 'image',
      caption: m.caption || null,
      display_order: m.display_order ?? idx + 1,
    }));

    const { data, error } = await supabaseAdmin
      .from('portfolio_media')
      .insert(formattedMedia)
      .select();

    if (error) throw ApiError.internal(`Failed to attach media: ${error.message}`);
    return data || [];
  }

  static async deleteMedia(mediaId: string): Promise<void> {
    const { data, error: fetchError } = await supabaseAdmin
      .from('portfolio_media')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError || !data) {
      throw ApiError.notFound(`Media with id '${mediaId}' not found`);
    }

    const { error } = await supabaseAdmin
      .from('portfolio_media')
      .delete()
      .eq('id', mediaId);

    if (error) throw ApiError.internal(`Failed to delete media: ${error.message}`);

    if (data.public_id) {
      await CloudinaryService.deleteAsset(data.public_id, data.resource_type);
    }
  }
}
