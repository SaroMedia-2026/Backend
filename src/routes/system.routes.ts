import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { supabaseAnon } from '../config/supabase.js';
import { env } from '../config/env.js';
import { runDatabaseSeed } from '../services/seed.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const systemRoutes = Router();

const REQUIRED_TABLES = [
  'profiles',
  'client_logos',
  'testimonials',
  'portfolio_items',
  'portfolio_media',
  'careers',
  'job_applications',
  'contact_submissions',
  'site_settings',
];

// 1. System DB & Table Status Check
systemRoutes.get(
  '/status',
  asyncHandler(async (req, res) => {
    const missingTables: string[] = [];
    const existingTables: string[] = [];

    for (const table of REQUIRED_TABLES) {
      const { error } = await supabaseAnon.from(table).select('id').limit(1);
      if (error && error.message.includes('schema cache')) {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    }

    const isDatabaseReady = missingTables.length === 0;
    const projectRef = env.SUPABASE_URL ? new URL(env.SUPABASE_URL).hostname.split('.')[0] : '';

    res.json(
      ApiResponse.success('System status retrieved', {
        isDatabaseReady,
        existingTables,
        missingTables,
        requiredTablesCount: REQUIRED_TABLES.length,
        readyTablesCount: existingTables.length,
        sqlEditorUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      })
    );
  })
);

// 2. Return Schema Migration SQL Script
systemRoutes.get(
  '/schema-sql',
  asyncHandler(async (req, res) => {
    const possiblePaths = [
      path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql'),
      path.resolve(process.cwd(), '../backend/supabase/migrations/001_initial_schema.sql'),
      path.resolve(process.cwd(), 'dist/supabase/migrations/001_initial_schema.sql'),
    ];

    let sqlContent = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sqlContent = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!sqlContent) {
      throw ApiError.notFound('Migration SQL file 001_initial_schema.sql not found on server');
    }

    res.json(
      ApiResponse.success('Schema migration SQL loaded', {
        sql: sqlContent,
        filename: '001_initial_schema.sql',
        tablesCount: REQUIRED_TABLES.length,
      })
    );
  })
);

// 3. Trigger Database Seeding
systemRoutes.post(
  '/seed',
  asyncHandler(async (req, res) => {
    try {
      const result = await runDatabaseSeed();
      res.json(ApiResponse.success('Database seeded successfully', result));
    } catch (err: any) {
      throw ApiError.badRequest(`Seeding failed: ${err.message}`);
    }
  })
);

export default systemRoutes;
