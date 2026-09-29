# Database Backup and Restoration Guide

This document describes the automated and manual procedures for backing up and restoring the Saro Agency PostgreSQL database (Supabase).

---

## 1. Automated Supabase Backups (Production)
- Supabase automatically takes daily logical backups of your PostgreSQL database.
- Point-In-Time Recovery (PITR) is enabled for Pro projects, allowing restoration down to the second.
- Location in Supabase Dashboard: **Project Settings > Database > Backups**.

---

## 2. Manual Backup with `pg_dump`

To generate a full SQL snapshot of the database (schema + data):

```bash
# Set your database password
export PGPASSWORD="your-db-password"

# Dump the public schema to a compressed file
pg_dump \
  -h db.<your-project-ref>.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --clean \
  --if-exists \
  --format=c \
  --file=saro_backup_$(date +%Y%m%d_%H%M%S).dump
```

Or as plaintext SQL:
```bash
pg_dump \
  -h db.<your-project-ref>.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --no-owner \
  --no-privileges \
  -f saro_backup.sql
```

---

## 3. Restoration Test Procedure

To test restoring the database to a fresh staging database or local Postgres container:

### Step 3.1: Start Local Clean PostgreSQL Container (or Staging DB)
```bash
docker run --name saro-test-db -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:15
```

### Step 3.2: Restore from SQL Backup
```bash
# If using custom binary format (.dump):
pg_restore -h localhost -p 5433 -U postgres -d postgres --clean --if-exists saro_backup_*.dump

# If using plaintext SQL:
psql -h localhost -p 5433 -U postgres -d postgres -f saro_backup.sql
```

### Step 3.3: Schema Baseline & Seed Restoration
If starting completely fresh without a dump:
```bash
# 1. Apply schema and indexes
npm run migrate

# 2. Seed baseline initial configuration
npm run seed
```

---

## 4. Disaster Recovery Checklist
- [x] Schema migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- [x] Compound performance indexes are preserved in version control (`supabase/migrations/001_initial_schema.sql`).
- [x] Cloudinary assets are referenced by persistent public IDs and can be synced independently.
- [x] Storage buckets for resumes (`resumes`) can be recreated with private access and signed URLs.
