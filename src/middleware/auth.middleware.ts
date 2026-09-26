import { Request, Response, NextFunction } from 'express';
import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserProfile, UserRole } from '../types/index.js';

/**
 * Middleware to authenticate requests using Supabase JWT.
 * Verifies token via Supabase Auth and loads user profile from DB.
 */
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access denied. No Bearer token provided.');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      throw ApiError.unauthorized('Invalid or expired authentication token.');
    }

    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Auto-fallback: if profile row is missing, create a default profile row
      const fallbackRole: UserRole = (user.user_metadata?.role as UserRole) || 'admin';
      const fallbackProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        role: fallbackRole,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin.from('profiles').upsert(fallbackProfile);
      req.user = { auth: user, profile: fallbackProfile };
    } else {
      req.user = { auth: user, profile: profile as UserProfile };
    }

    next();
  }
);

/**
 * Optional authentication: attaches user if valid token is provided,
 * but proceeds without error if unauthenticated.
 */
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          req.user = { auth: user, profile: profile as UserProfile };
        }
      }
    } catch {
      // Ignore errors for optional authentication
    }

    next();
  }
);

/**
 * Enforces role-based access control.
 * Requires user to have one of the specified roles.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.profile) {
      throw ApiError.unauthorized('Authentication required.');
    }

    const userRole = req.user.profile.role;
    if (!allowedRoles.includes(userRole)) {
      throw ApiError.forbidden(
        `Access denied. Requires one of [${allowedRoles.join(', ')}] roles, but user has '${userRole}'.`
      );
    }

    next();
  };
};

/**
 * Convenience middleware: requires role === 'admin'
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Convenience middleware: requires role === 'admin' or 'editor'
 */
export const requireStaff = requireRole(['admin', 'editor']);
