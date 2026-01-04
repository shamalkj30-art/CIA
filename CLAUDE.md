# Cyncro - Claude Code Context

> This file is automatically read by Claude Code at the start of each session.
> Last updated: 2026-01-04

## What is Cyncro?

Cyncro is an **AI-powered warranty and order management app**. Users connect their Gmail, and the app automatically detects order confirmation emails, extracts purchase details using AI, and tracks warranties/return deadlines.

**Live site:** https://cyncro.vercel.app

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (receipts bucket) |
| AI | Anthropic Claude (claude-sonnet-4-5-20250929) |
| Email | Gmail API (OAuth) for reading, Resend for webhooks |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

## Key Features

1. **Gmail Auto-Sync** - Connect Gmail, automatically scan for order confirmations
2. **AI Extraction** - Claude extracts merchant, items, prices, warranty, return deadlines
3. **Manual Upload** - Upload receipt images/PDFs for AI analysis
4. **Email Forwarding** - Forward receipts to `receipts@your-domain.resend.app` (backup method)
5. **Warranty Tracking** - Notifications before warranties expire
6. **Return Deadline Alerts** - Never miss a return window

## Project Structure

```
app/
  (app)/           # Authenticated routes (dashboard, settings, purchases)
  api/
    ai/analyze-receipt/   # Manual receipt upload AI analysis
    auth/google/          # Gmail OAuth flow
    email/receive/        # Resend webhook for forwarded emails
    gmail/sync/           # Gmail sync endpoint
    cron/check-expiries/  # Daily cron for notifications
    purchases/            # CRUD for purchases
lib/
  gmail.ts         # Gmail API + AI extraction (uses Claude)
  ai-extraction.ts # Email forwarding AI extraction (uses Claude)
  email-parser.ts  # HTML parsing, forwarding header stripping
  email-schemas.ts # Zod validation schemas
  supabase/        # Supabase client helpers
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` - Claude AI
- `GOOGLE_CLIENT_ID` - Gmail OAuth
- `GOOGLE_CLIENT_SECRET` - Gmail OAuth
- `NEXT_PUBLIC_APP_URL` - https://cyncro.vercel.app

## Database Tables (Supabase)

- `purchases` - Main purchase records
- `documents` - Receipt attachments
- `processed_emails` - Track which emails have been processed
- `email_connections` - Gmail OAuth tokens per user
- `notifications` - User notifications
- `notification_settings` - User preferences

## Current State (as of 2026-01-04)

### What's Working:
- ✅ Gmail OAuth connection
- ✅ Gmail sync with Claude AI extraction
- ✅ Manual receipt upload with AI
- ✅ Purchase CRUD
- ✅ Warranty/return tracking
- ✅ Dark/light mode

### Recent Changes:
1. **Gmail sync now uses Anthropic Claude** (was OpenAI)
2. **Email forwarding improved** - strips forwarding headers, extracts merchant from subject
3. **Validation fixed** - no more "merchant cannot be email provider" loops

### Known Issues / TODO:
- Email forwarding via Resend is less reliable than Gmail API (forwarded emails lose original sender info)
- Gmail sync is manual (user clicks "Sync Now") - could add push notifications for real-time

## Important Quirks

### AI Extraction
- The AI sometimes extracts "gmail" as merchant from forwarded emails
- Solution: We strip forwarding headers and extract merchant hint from subject line
- Always use Claude's tool calling for structured output

### Gmail vs Email Forwarding
- **Gmail API** (preferred): Reads original emails directly, more reliable
- **Email Forwarding** (backup): Forwarded emails have messy headers, sender becomes the user not the store

### Norwegian Market Focus
- App supports Norwegian stores (Elkjøp, Komplett, etc.)
- "Angrerett" = 14-day return right by law
- Currency: NOK, prices like "kr 1.234,56"

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npx vercel       # Deploy to Vercel
```

## Next Steps for User

1. **Connect Gmail** at /settings to enable automatic order detection
2. **Test sync** by clicking "Sync Now" after connecting
3. **Check purchases** at /purchases to see extracted orders

---

*When making significant changes, update this file so the next session has context.*
