import { Request, Response } from 'express';
import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticates user via email & password, returns JWT session & profile
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw ApiError.unauthorized(`Login failed: ${error?.message || 'Invalid email or password'}`);
    }

    // Fetch profile role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json(
      ApiResponse.success('Login successful', {
        user: data.user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        },
        profile: profile || {
          id: data.user.id,
          email: data.user.email,
          role: (data.user.user_metadata?.role as any) || 'admin',
          full_name: data.user.user_metadata?.full_name || 'Agency Admin',
        },
      })
    );
  });

  /**
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    res.json(ApiResponse.success('Logged out successfully', null));
  });

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user and profile information
   */
  static getMe = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    res.json(
      ApiResponse.success('User profile retrieved successfully', {
        user: req.user.auth,
        profile: req.user.profile,
      })
    );
  });

  /**
   * PATCH /api/v1/auth/profile
   * Updates profile details for the currently logged-in user
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const { full_name, avatar_url } = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...(full_name !== undefined && { full_name }),
        ...(avatar_url !== undefined && { avatar_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.auth.id)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Failed to update profile: ${error.message}`);
    }

    res.json(ApiResponse.success('Profile updated successfully', data));
  });
}
