# ⚡ Saro Agency Backend CMS & Admin API

> Standalone Content Management System (CMS) & Lead Management API for a Digital Marketing Agency, powered by **Express.js**, **TypeScript**, **PostgreSQL via Supabase**, and **Cloudinary CDN**.

---

## 🧰 Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL on Supabase with Row Level Security (RLS)
- **Authentication:** Supabase Auth (JWT verification, RBAC via `profiles` table)
- **Media Storage:** Cloudinary (Images, Videos, and Resumes as raw files)
- **Upload Engine:** Multer (in-memory buffer) streamed directly to Cloudinary
- **Request Validation:** Zod
- **Security:** Helmet, CORS, parameterized queries, RLS policies

---

## 📂 Architecture & Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts             # Environment variables validation & defaults
│   │   ├── supabase.ts        # Supabase Anon & Admin (Service Role) clients
│   │   └── cloudinary.ts      # Cloudinary SDK config & folder constants
│   ├── controllers/
│   │   ├── analytics.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── careers.controller.ts
│   │   ├── clientLogos.controller.ts
│   │   ├── contacts.controller.ts
│   │   ├── portfolio.controller.ts
│   │   ├── siteSettings.controller.ts
│   │   ├── testimonials.controller.ts
│   │   └── upload.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Supabase JWT verification & RBAC check
│   │   ├── error.middleware.ts   # Global error handling (Zod, Multer, Postgres)
│   │   ├── upload.middleware.ts  # Multer memory storage & MIME filters
│   │   └── validate.middleware.ts# Zod request validator
│   ├── routes/
│   │   ├── index.ts              # Main router mounting /api/v1/*
│   │   ├── analytics.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── careers.routes.ts
│   │   ├── clientLogos.routes.ts
│   │   ├── contacts.routes.ts
│   │   ├── portfolio.routes.ts
│   │   ├── siteSettings.routes.ts
│   │   ├── testimonials.routes.ts
│   │   └── upload.routes.ts
│   ├── services/
│   │   ├── analytics.service.ts
│   │   ├── careers.service.ts
│   │   ├── clientLogos.service.ts
│   │   ├── cloudinary.service.ts # Stream upload, delete, transformations
│   │   ├── contacts.service.ts
│   │   ├── portfolio.service.ts
│   │   ├── siteSettings.service.ts
│   │   └── testimonials.service.ts
│   ├── types/
│   │   ├── index.ts              # Model interfaces & DB types
│   │   └── express.d.ts          # Express Request extension (req.user)
│   ├── utils/
│   │   ├── apiResponse.ts        # Uniform JSON response structure
│   │   ├── apiError.ts           # Custom operational error classes
│   │   ├── asyncHandler.ts       # Async controller wrapper
│   │   └── logger.ts             # Structured logging helper
│   ├── validators/               # Zod validation schemas
│   ├── scripts/
│   │   └── seed.ts               # Programmatic admin user & data seeder
│   ├── app.ts                    # Express app configuration & middlewares
│   └── server.ts                 # Server entry point & graceful shutdown
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql# Complete SQL schema & RLS policies
│   └── seed.sql                  # Raw SQL seed dataset
├── .env.example                  # Environment variables template
├── API_DOCUMENTATION.md          # Complete API reference guide
├── postman_collection.json       # Ready-to-import Postman Collection v2.1
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your actual credentials:

```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase (Project Settings -> API)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Cloudinary (Dashboard -> Settings -> Access Keys)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Initial Admin Credentials (used by seed script)
SEED_ADMIN_EMAIL=admin@saroagency.com
SEED_ADMIN_PASSWORD=AdminSecurePassword123!
SEED_ADMIN_NAME=Agency Admin
```

---

## 🗄️ Database Setup (Supabase)

### Option A: Via Supabase Web Dashboard (Easiest)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. Navigate to the **SQL Editor** on the left menu.
3. Open `backend/supabase/migrations/001_initial_schema.sql`, copy its entire content, paste it into the SQL Editor, and click **RUN**.
4. *(Optional Sample Data)*: Open `backend/supabase/seed.sql`, paste it into the SQL Editor, and click **RUN**.

### Option B: Via Programmatic Seed Script
Once `001_initial_schema.sql` has run in your Supabase project, execute:

```bash
npm run seed
```

This will:
- Check or create your initial admin user in Supabase Auth.
- Create their profile with `role: 'admin'`.
- Insert sample client logos, testimonials, portfolio items (with photos & video reels), job listings, mock applications, and contact submissions.

---

## 🏃 Running the Application

### Development Mode (with hot-reload via tsx):
```bash
npm run dev
```

The server will start at `http://localhost:5000`.

### Production Build:
```bash
npm run build
npm start
```

### Type Checking:
```bash
npm run lint
```

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

1. The frontend authenticates users with **Supabase Auth** (email/password or Google OAuth).
2. The frontend sends the Supabase access token in the header:
   ```http
   Authorization: Bearer <access_token>
   ```
3. The backend middleware (`src/middleware/auth.middleware.ts`):
   - Verifies the JWT with Supabase Auth: `supabaseAnon.auth.getUser(token)`.
   - Fetches the user's role from the `profiles` table.
   - Restricts sensitive dashboard routes to `admin` (or `editor`).
4. **Row Level Security (RLS)** is enabled on all tables:
   - Public users can only read published testimonials, portfolio items, open careers, active logos, and site settings.
   - Public users can INSERT contact submissions and job applications.
   - Only admins and editors can view leads or perform mutations.

---

## 🖼️ Cloudinary Media Architecture

All uploads go through the Express backend rather than browser-to-Cloudinary direct upload, keeping your `CLOUDINARY_API_SECRET` completely secure.

### Folder Structure in Cloudinary:
- `agency/client-logos/`
- `agency/testimonials/`
- `agency/portfolio/covers/`
- `agency/portfolio/gallery/`
- `agency/portfolio/videos/`
- `agency/resumes/` (uploaded with `resource_type: 'raw'` for PDFs/DOCs)

### Database Storage Principle:
- Only the `cloudinary_public_id` and `secure_url` are stored in PostgreSQL.
- Deletions are synchronized: deleting a portfolio item or testimonial automatically destroys the associated files from Cloudinary using `cloudinary.uploader.destroy()`.
- Dynamic on-the-fly transformations can be generated at any time using `CloudinaryService.getOptimizedUrl(public_id)` (e.g. `f_auto,q_auto,w_1200`).

---

## 📡 Key API Routes

Detailed documentation for all request/response schemas is available in [API_DOCUMENTATION.md](file:///d:/Documents/All%20Programing/Saro/backend/API_DOCUMENTATION.md).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Service health & metadata |
| `GET` | `/api/v1/testimonials` | Public | List published client testimonials |
| `GET` | `/api/v1/portfolio` | Public | Filter portfolio by category, tags, featured |
| `GET` | `/api/v1/portfolio/slug/:slug` | Public | Portfolio item detail with gallery media |
| `GET` | `/api/v1/careers` | Public | List open career vacancies |
| `POST` | `/api/v1/careers/:id/apply` | Public | Apply for job (multipart upload with resume) |
| `POST` | `/api/v1/contact` | Public | Submit contact inquiry form |
| `GET` | `/api/v1/client-logos` | Public | Active client logos |
| `GET` | `/api/v1/site-settings` | Public | Hero headline, CTA, contact info |
| `GET` | `/api/v1/analytics/summary` | Admin | Total counts, status breakdown, recent feed |
| `POST` | `/api/v1/upload` | Admin | Upload single image/video/resume to Cloudinary |
| `POST` | `/api/v1/upload/multiple` | Admin | Batch upload up to 10 files to Cloudinary |
| `POST/PUT/DELETE` | `/api/v1/portfolio` | Admin | Full portfolio CRUD |
| `POST/PUT/DELETE` | `/api/v1/testimonials`| Admin | Full testimonials CRUD |
| `POST/PUT/DELETE` | `/api/v1/careers` | Admin | Career listings management |
| `GET/PATCH/DELETE`| `/api/v1/applications`| Admin | Job applications review & status management |
| `GET/PATCH/DELETE`| `/api/v1/contacts` | Admin | Contact leads management & internal notes |
| `PUT` | `/api/v1/site-settings` | Admin | Update agency hero, contact info, social links |

---

## 🧪 Testing with Postman / Thunder Client

Import [`postman_collection.json`](file:///d:/Documents/All%20Programing/Saro/backend/postman_collection.json) directly into Postman or Thunder Client.

1. Set the collection variable `baseUrl` to `http://localhost:5000/api/v1`.
2. When testing protected routes, set `adminToken` to your Supabase session access token.
