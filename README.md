# LocalHub

LocalHub is an AI-powered South African marketplace with autonomous SEO optimization, AI-generated content, premium UI, no-KYC onboarding (email or phone only), seller marketplace flows, lead system, messaging system, and admin control panel.

## Stack

- Frontend: Next.js (Pages Router), React, TypeScript, Tailwind CSS v4
- Backend: Next.js API routes
- Database: Supabase (Postgres)
- Search: Meilisearch
- Hosting: Vercel
- AI: External LLM API
- Analytics: GA4 + event capture hooks

## Features Included In This Scaffold

- Marketplace pages for category/suburb/service/listing
- Email or phone auth flows (no KYC)
- Seller, user, and admin dashboard route sets
- Messaging and leads UI components
- API route groups for auth, listings, leads, messages, SEO, auto-builder, and AI
- AI service modules and SEO scheduler primitives
- Supabase migration with full baseline schema
- Meilisearch and Vercel config templates

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
copy .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Important Paths

- App pages: `src/pages`
- API routes: `src/pages/api`
- UI components: `src/components`
- Services and integrations: `src/lib`
- Shared types: `src/types`
- Theme files: `src/styles`
- Supabase migration: `supabase/migrations/202607170001_localhub_init.sql`

## Milestone Roadmap

- Week 1: setup + migrations
- Week 2: listings + seller dashboard
- Week 3: messaging + leads + user dashboard + admin panel
- Week 4: AI engines + SEO scheduler + auto-builder + deployment

## Notes

- This repository currently provides a production-oriented scaffold with sane defaults.
- External AI provider and auth provider integrations are intentionally template-first and require real keys.
