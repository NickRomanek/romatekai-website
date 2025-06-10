# Blog Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:port/database"

# NextAuth (for admin authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (for admin login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

## Database Setup

1. Create a Neon database at https://neon.tech
2. Copy the connection string to your `.env.local` as `DATABASE_URL`
3. Push the schema to your database:

```bash
npm run db:push
```

## Features

- **Admin Panel**: `/aiadmin` - Create and manage blog posts
- **Blog Page**: `/blog` - View all published posts
- **Image Upload**: Support for JPEG, PNG, GIF (max 5MB)
- **Responsive Design**: Works on desktop and mobile

## Usage

1. Navigate to `/aiadmin`
2. Sign in with Google (configured in NextAuth)
3. Fill out the blog post form:
   - Title (required)
   - Image (optional)
   - Content (required)
4. Click "Publish Blog Post"
5. View your posts at `/blog`

## File Structure

- `src/app/lib/db.ts` - Database schema and connection
- `src/app/api/blog/route.ts` - Blog CRUD API
- `src/app/api/upload/route.ts` - Image upload API
- `src/app/aiadmin/page.tsx` - Admin interface
- `src/app/blog/page.tsx` - Public blog page
- `public/uploads/` - Uploaded images storage
- `drizzle.config.ts` - Drizzle ORM configuration 