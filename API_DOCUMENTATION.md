# Saro Agency Backend CMS & Admin API Documentation

Base URL: `http://localhost:5000/api/v1`

---

## 🔐 Authentication & Authorization

All protected admin endpoints require a Supabase JWT in the `Authorization` header:

```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
```

When an admin user signs in through your Next.js frontend using Supabase Auth (Email/Password or Google OAuth), Supabase issues a session access token (`session.access_token`). Pass this token in the header of backend requests.

### User Roles
- `admin`: Full unrestricted access to manage content, leads, files, settings, and other profiles.
- `editor`: Access to manage content and review leads.
- `public / anonymous`: Read-only access to published content, ability to submit contact forms and job applications.

---

## 📌 Public Endpoints (No Auth Required)

### 1. Testimonials
- **`GET /api/v1/testimonials`**
  - Returns published testimonials ordered by `display_order` ascending.
  - Response:
    ```json
    {
      "success": true,
      "message": "Testimonials retrieved successfully",
      "data": [
        {
          "id": "e6a2...",
          "client_name": "Elena Rostova",
          "company": "Luminary Fashion",
          "photo_url": "https://res.cloudinary.com/...",
          "testimonial_text": "...",
          "rating": 5,
          "published": true,
          "display_order": 1
        }
      ]
    }
    ```

### 2. Portfolio Items
- **`GET /api/v1/portfolio`**
  - Query parameters:
    - `category` (optional, e.g. `photoshoot`, `videography`, `branding`)
    - `featured` (optional: `true` or `false`)
    - `tag` (optional: filter by tag)
    - `page` (default: 1)
    - `limit` (default: 20)
  - Returns published/featured portfolio items with attached gallery media (`portfolio_media`).

- **`GET /api/v1/portfolio/slug/:slug`**
  - Returns a single published portfolio item by its URL slug.

### 3. Career Listings
- **`GET /api/v1/careers`**
  - Query parameters: `department` (optional)
  - Returns open job listings.

- **`GET /api/v1/careers/:id`**
  - Returns full job description, requirements, and deadline for a listing.

- **`POST /api/v1/careers/:id/apply`**
  - Content-Type: `multipart/form-data`
  - Form fields:
    - `name` (string, required)
    - `email` (string, required)
    - `phone` (string, optional)
    - `cover_letter` (string, optional)
    - `resume` (file, binary PDF/DOC/DOCX - automatically streamed to Cloudinary `agency/resumes/` as `resource_type: 'raw'`)
  - Alternatively, if already uploaded via `/api/v1/upload`, provide JSON `{ name, email, resume_url, resume_public_id }`.

### 4. Contact Form Inquiries
- **`POST /api/v1/contact`** (also aliased to `POST /api/v1/contacts`)
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "name": "Sarah Jenkins",
      "email": "s.jenkins@zenithcapital.com",
      "phone": "+1 (555) 443-2211",
      "subject": "Rebranding & Digital Strategy",
      "message": "We would love to discuss a timeline and budget estimate."
    }
    ```

### 5. Client Logos & Site Settings
- **`GET /api/v1/client-logos`** (returns active logos)
- **`GET /api/v1/site-settings`** (returns hero headline, subheadline, CTA, contact info, social links)

---

## 🛡️ Protected Endpoints (Admin / Staff Only)

### 1. Dashboard & Analytics
- **`GET /api/v1/analytics/summary`**
  - Returns:
    - `counts`: Total testimonials, portfolio items, client logos, careers (total + open), contact leads (total + new), applications (total + new).
    - `breakdowns`: Status distribution for contacts (`new`, `read`, `replied`, `archived`) and applications (`new`, `reviewed`, `shortlisted`, `rejected`, `hired`).
    - `recent_activity`: 5 latest contacts, 5 latest job applications, 5 latest testimonials.

---

### 2. Cloudinary File Uploads
- **`POST /api/v1/upload`**
  - Content-Type: `multipart/form-data`
  - Form fields:
    - `file`: The binary file (Image, Video, or PDF/Doc)
    - `folder`: (optional) e.g. `agency/client-logos`, `agency/testimonials`, `agency/portfolio/covers`, `agency/portfolio/gallery`, `agency/portfolio/videos`, `agency/resumes`
    - `resource_type`: (optional) `'image' | 'video' | 'raw' | 'auto'`
  - Returns:
    ```json
    {
      "success": true,
      "message": "File uploaded successfully to Cloudinary",
      "data": {
        "public_id": "agency/portfolio/covers/luminary-cover",
        "secure_url": "https://res.cloudinary.com/...",
        "resource_type": "image",
        "format": "webp",
        "bytes": 245120,
        "width": 1920,
        "height": 1080,
        "optimized_url": "https://res.cloudinary.com/.../f_auto,q_auto/..."
      }
    }
    ```

- **`POST /api/v1/upload/multiple`**
  - Field: `files` (array of up to 10 files)
  - Returns array of upload results.

- **`DELETE /api/v1/upload`**
  - Body: `{ "public_id": "...", "resource_type": "image" }`
  - Removes asset from Cloudinary CDN.

---

### 3. Portfolio Management
- **`POST /api/v1/portfolio`**
  - Body:
    ```json
    {
      "title": "Quantum AI Brand System",
      "slug": "quantum-ai-brand-system",
      "client": "Quantum Dynamics",
      "category": "branding",
      "description": "Comprehensive identity and visual design system.",
      "date": "March 2026",
      "cover_image_url": "https://res.cloudinary.com/...",
      "cover_image_public_id": "agency/portfolio/covers/quantum",
      "media_type": "image",
      "tags": ["AI", "Branding", "3D"],
      "status": "published",
      "display_order": 1,
      "media": [
        {
          "public_id": "agency/portfolio/gallery/quantum-1",
          "url": "https://res.cloudinary.com/...",
          "resource_type": "image",
          "caption": "Typography guidelines",
          "display_order": 1
        }
      ]
    }
    ```

- **`PUT /api/v1/portfolio/:id`**
  - Update any fields. If `cover_image_public_id` is updated, the old asset is automatically deleted from Cloudinary.

- **`DELETE /api/v1/portfolio/:id`**
  - Deletes portfolio item and cascades deletion to delete cover and all gallery media from Cloudinary!

- **`POST /api/v1/portfolio/:id/media`**
  - Attach gallery images/videos to existing project.

- **`DELETE /api/v1/portfolio/media/:mediaId`**
  - Remove individual gallery media item from DB and Cloudinary.

---

### 4. Testimonials Management
- **`POST /api/v1/testimonials`**
- **`PUT /api/v1/testimonials/:id`**
- **`DELETE /api/v1/testimonials/:id`** (cleans up photo from Cloudinary)
- **`POST /api/v1/testimonials/reorder`**
  - Body: `{ "items": [{ "id": "uuid-1", "display_order": 1 }, { "id": "uuid-2", "display_order": 2 }] }`

---

### 5. Client Logos Management
- **`POST /api/v1/client-logos`**
- **`PUT /api/v1/client-logos/:id`**
- **`DELETE /api/v1/client-logos/:id`** (cleans up logo from Cloudinary)
- **`POST /api/v1/client-logos/reorder`**

---

### 6. Career & Application Management
- **`POST /api/v1/careers`**
- **`PUT /api/v1/careers/:id`**
- **`DELETE /api/v1/careers/:id`**
- **`GET /api/v1/applications`**
  - Query parameters: `career_id`, `status` (`new`, `reviewed`, `shortlisted`, `rejected`, `hired`), `page`, `limit`
- **`GET /api/v1/applications/:id`**
- **`PATCH /api/v1/applications/:id`**
  - Body: `{ "status": "shortlisted", "notes": "Interview set for Monday." }`
- **`DELETE /api/v1/applications/:id`** (cleans up resume from Cloudinary)

---

### 7. Contact Submissions Management
- **`GET /api/v1/contacts`**
  - Query parameters: `status` (`new`, `read`, `replied`, `archived`), `page`, `limit`
- **`GET /api/v1/contacts/:id`**
- **`PATCH /api/v1/contacts/:id`**
  - Body: `{ "status": "replied", "notes": "Sent rate card." }`
- **`DELETE /api/v1/contacts/:id`**

---

### 8. Site Settings Management
- **`PUT /api/v1/site-settings`**
  - Body:
    ```json
    {
      "hero_headline": "Crafting Iconic Digital Brands",
      "hero_subheadline": "We help ambitious brands scale with world-class marketing and production.",
      "hero_cta_text": "View Projects",
      "hero_cta_link": "/portfolio",
      "contact_email": "hello@saroagency.com",
      "contact_phone": "+1 (555) 234-5678",
      "social_links": {
        "instagram": "https://instagram.com/saroagency",
        "linkedin": "https://linkedin.com/company/saroagency"
      }
    }
    ```
