# Cyncro - Claude Code Context

> This file is automatically read by Claude Code at the start of each session.
> Last updated: 2026-01-05

## What is Cyncro?

Cyncro is evolving into a **Personal Proof & Money OS** that automatically captures receipts, tracks return/warranty/subscription deadlines, and turns problems into ready-to-send action packs. Users connect their Gmail, and the app automatically detects order confirmation emails, extracts purchase details using AI, and tracks everything.

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
7. **Subscription Tracking** - Track recurring payments with "charges tomorrow" alerts
8. **Cancel Kits** - AI-generated step-by-step cancellation guides

## Project Structure

```
app/
  (marketing)/     # Public marketing pages (landing, pricing, security, examples)
  (app)/           # Authenticated routes (dashboard, inbox, purchases, subscriptions, cases, vault, notifications, settings, upload)
  (auth)/          # Login/signup
  api/
    ai/analyze-receipt/   # Manual receipt upload AI analysis
    auth/google/          # Gmail OAuth flow
    email/receive/        # Resend webhook for forwarded emails
    gmail/sync/           # Gmail sync endpoint
    cron/check-expiries/  # Daily cron for notifications
    purchases/            # CRUD for purchases
components/
  ui/              # Design system primitives (Card, Button, Badge, Tabs, Dialog, etc.)
  app/             # App shell components (AppSidebar, CommandPalette, QuickAddMenu)
  marketing/       # Marketing components (MarketingHeader, Footer, HeroInteractive)
content/           # Content model JSON files (examples, pricing, features)
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
- `subscriptions` - Recurring payment tracking
- `subscription_alerts` - Pre-computed charge alerts
- `subscription_history` - Price changes, renewals
- `cases` - Return/warranty/complaint tracking
- `case_events` - Case timeline events
- `case_messages` - AI-generated draft messages
- `vault_items` - Document vault for organizing receipts, warranties, manuals, insurance, contracts (NEW)
- `insurance_packs` - Generated insurance claim packages (NEW)

## Current State (as of 2026-01-05)

### What's Working:
- ✅ Gmail OAuth connection
- ✅ Gmail sync with Claude AI extraction
- ✅ Manual receipt upload with AI
- ✅ Purchase CRUD
- ✅ Warranty/return tracking
- ✅ Dark/light mode
- ✅ Notifications page with settings
- ✅ List/grid view toggle on Purchases
- ✅ **Subscriptions page** (Phase 1 of Premium upgrade)
- ✅ **Cases page** (Phase 2 of Premium upgrade)
- ✅ **Evidence Mode** (Phase 3 of Premium upgrade) - Proof scores and trust indicators
- ✅ **Vault System** (Phase 4 of Premium upgrade) - Document libraries, insurance packs
- ✅ **Enhanced Inbox** (Phase 5 of Premium upgrade) - Tabs, evidence viewer, quick fixes
- ✅ **Dashboard Upgrade** (Phase 6 of Premium upgrade) - Weekly digest, subscription timeline, improved attention queue

### Recent Changes:
1. **Complete UI redesign** (Jan 2026) - Premium design system inspired by aura.build
   - New design system with primitives in `/components/ui/`
   - Collapsible sidebar with keyboard shortcuts (Cmd+B)
   - Command palette for quick search (Cmd+K)
   - Rebuilt marketing site with unique section layouts
   - New dashboard with Attention Queue, Recent Captures
   - Content model in `/content/` for easy updates
2. **Gmail sync now uses Anthropic Claude** (was OpenAI)
3. **Email forwarding improved** - strips forwarding headers, extracts merchant from subject
4. **Validation fixed** - no more "merchant cannot be email provider" loops
5. **Notifications redesign** (Jan 4, 2026)
   - Moved from popup to dedicated page at `/app/(app)/notifications/page.tsx`
   - Added to main sidebar navigation (under Purchases)
   - Two-column layout: notifications list + settings panel
   - Custom dropdown components for day selection (replacing native selects)
   - Toggle switches for notification types (warranty expiring, return deadline, new purchase)
6. **Purchases page enhancements** (Jan 4, 2026)
   - Added list/grid view toggle (icons next to sort dropdown)
   - Grid view shows cards similar to Examples page (2-3 columns)
   - List view remains the default with checkboxes for multi-select
7. **Upload page fix** - Price input padding corrected ($ sign no longer overlaps value)
8. **Subscriptions System** (Jan 5, 2026) - Phase 1 of Premium upgrade
   - New `/subscriptions` page with grid/list views
   - Add subscription modal with billing cadence, confidence levels
   - Summary cards: Active count, Next 7 days, Monthly cost
   - Service-specific colors for popular services (Netflix, Spotify, etc.)
   - Renewal confidence states: Confirmed/Estimated/Needs confirmation
   - API routes: `/api/subscriptions`, `/api/subscriptions/[id]`, `/api/subscriptions/[id]/cancel-kit`
   - Cancel kit generation with AI-powered steps and draft messages
   - Daily cron job for "Netflix charges tomorrow" alerts
   - Database migration in `/supabase/migrations/001_subscriptions.sql`
   - Sidebar renamed: Dashboard → Home, added Subscriptions link
9. **Cases System** (Jan 5, 2026) - Phase 2 of Premium upgrade
   - New `/cases` page with grid/list views
   - Case types: Return, Warranty, Complaint, Cancellation
   - Status workflow: Draft → Sent → Waiting → Escalated → Resolved
   - Case detail page with timeline, edit mode, delete
   - AI-powered Action Pack generation (Norwegian consumer rights aware)
   - Generates draft messages in Norwegian for returns/complaints
   - Follow-up automation: 3-day reminders, 7-day escalation alerts
   - API routes: `/api/cases`, `/api/cases/[id]`, `/api/cases/[id]/events`, `/api/cases/[id]/generate-message`
   - Daily cron job for follow-up notifications
   - Database migration in `/supabase/migrations/002_cases.sql`
   - Added Cases link to sidebar navigation
10. **Evidence Mode & Trust** (Jan 5, 2026) - Phase 3 of Premium upgrade
    - **ProofScoreBadge** component - Shows "Claim Ready" / "Almost Ready" / "Missing Info"
    - **NeedsReviewBanner** - Alert banner for auto-detected purchases needing verification
    - **TrustIndicator** component - Per-field confidence indicators (AI Verified / AI Detected / Low Confidence)
    - New "Needs Review" filter on purchases list page
    - Proof score badges on purchase list (both list and grid views)
    - "Mark as Verified" functionality on purchase detail page
    - No database migration needed - uses existing `needs_review` and `email_metadata.confidence` fields
    - New utility: `lib/proof-score.ts` for calculating proof scores client-side
11. **Message Tone Selector** (Jan 5, 2026)
    - AI-generated messages (cases) now support 4 tones: Friendly, Professional, Firm, Concise
    - Dropdown selector in case detail page Actions sidebar
    - API accepts `tone` parameter for message generation
12. **Vault System** (Jan 5, 2026) - Phase 4 of Premium upgrade
    - New `/vault` page with 5 document libraries: Receipts, Warranties, Manuals, Insurance, Contracts
    - Library tabs with document counts
    - Grid/list view toggle with sorting options
    - Document upload with drag-and-drop support
    - 8 insurance rooms: Kitchen, Bedroom, Living Room, Bathroom, Garage, Office, Outdoor, Other
    - Room-based organization for insurance documents
    - Estimated value tracking for insurance items
    - Expiry date tracking with "Expiring Soon" filter
    - Custom tags for document organization
    - **Insurance Overview** page at `/vault/insurance` with room grid showing item counts and values
    - **Insurance Pack Generator** at `/vault/insurance/pack` - creates ZIP files with all documents organized by room
    - Pack includes SUMMARY.txt with detailed item list and values
    - API routes: `/api/vault`, `/api/vault/[id]`, `/api/vault/[id]/signed-url`, `/api/vault/stats`, `/api/vault/insurance-pack`, `/api/vault/insurance-pack/[id]`
    - New utility: `lib/insurance-pack-generator.ts` for ZIP generation using jszip
    - Database migration in `/supabase/migrations/003_vault.sql`
    - Added Vault link to sidebar navigation
13. **Landing Page Premium Redesign** (Jan 5, 2026) - Frontend design skill applied
    - **Atmospheric effects** - Gradient mesh backgrounds, grain texture overlays
    - **Premium animations** - Scroll-triggered reveals, floating animations, staggered children
    - **ScrollReveal component** - New component at `/components/ScrollReveal.tsx` using Intersection Observer
    - **Hero enhancements** - Larger typography (7xl), floating interactive demo, glow effects
    - **Bento grid upgrade** - Oversized step numbers, shine-on-hover effect, hover-lift transitions
    - **3D effects** - Tilt cards on claim packet showcase
    - **Infinite marquee** - CSS-only marquee animation for integrations section
    - **Asymmetric layouts** - Security cards with offset positioning
    - **Animated gradient border** - Pro pricing card with rotating gradient border
    - **Interactive FAQ accordion** - Click-to-expand with smooth height animation
    - **Final CTA** - Full gradient background with floating shapes
    - **Accessibility** - Respects `prefers-reduced-motion` media query
    - New CSS utilities in `globals.css`: `.mesh-gradient`, `.grain-overlay`, `.glow-primary`, `.hover-lift`, `.shine-on-hover`, `.gradient-border`, `.marquee-container`, `.accordion-content`
14. **Enhanced Inbox System** (Jan 5, 2026) - Phase 5 of Premium upgrade
    - New `/inbox` page with master-detail layout for reviewing purchases
    - **Tab navigation**: Inbox (new auto-detected), All, Action Needed, Archive
    - **EvidencePanel** component - Shows extracted data, email metadata, documents side-by-side
    - **QuickFixModal** component - Inline editing for correcting AI extraction errors
    - **Keyboard navigation**: Arrow keys (↑↓ or j/k) to navigate, Enter to open, E to toggle evidence panel, 1-4 for tabs
    - Trust indicators on each extracted field (merchant, price, item, date)
    - Verify/Dismiss actions for reviewing auto-detected purchases
    - Document preview with signed URLs in evidence panel
    - Common merchant suggestions for quick fixes
    - Added Inbox link to sidebar navigation (between Home and Purchases)
    - Components: `/components/app/EvidencePanel.tsx`, `/components/app/QuickFixModal.tsx`
    - Updated `TrustIndicator` to support simple confidence-based rendering
15. **Dashboard Upgrade** (Jan 5, 2026) - Phase 6 of Premium upgrade
    - **Weekly Digest Banner** - Shows activity summary: new purchases, upcoming deadlines, subscription charges, total tracked
    - **Subscription Timeline** - Visual timeline of upcoming charges (next 14 days) with urgency indicators
    - **Enhanced Stats Grid** - Now 5 columns including "Needs Review" with link to inbox
    - **Improved Attention Queue** - Categorized by type (Return, Warranty, Review) with distinct icons and colors
    - **Quick Actions** - Updated to include inbox and subscriptions links
    - Dashboard now fetches both purchases AND subscriptions data in parallel
    - Timeline shows color-coded dots: red (today), warning (3 days), purple (future)
    - Needs Review stat card links directly to inbox for easy access
16. **Smart AI Cancel Kit** (Jan 5, 2026) - Real-time cancellation guides
    - **Web Search Integration** - AI searches the web to find current cancellation procedures for ANY subscription
    - **Cancel URL Auto-Fill** - When adding a subscription, AI automatically fills in the Cancel URL based on service name
    - **Database Caching** - Results cached for 24 hours to reduce API calls
    - **Verification Indicators** - Cancel Kit modal shows "Last verified", confidence badge, and source
    - **URL Verification** - Links are verified before being returned to ensure they're still valid
    - New library: `/lib/cancel-kit-ai.ts` for smart AI logic
    - New API: `/api/subscriptions/lookup-service` for auto-fill functionality
    - Database migration: `/supabase/migrations/004_cancel_guides.sql` for caching
    - Updated Cancel Kit modal with verification metadata display
    - Updated Add Subscription modal with auto-fill Cancel URL (with loading spinner and "AI-suggested" badge)
17. **Subscription Showcase Section** (Jan 5, 2026) - Landing page enhancement
    - **Animated floating icons** - 27 subscription service logos flowing horizontally in continuous marquee animation
    - **Two-row layout** - Top row moves right, bottom row moves left, creating dynamic effect
    - **Real brand logos** - All SVG paths sourced from Simple Icons (Netflix, Spotify, YouTube, Disney+, Adobe, Figma, OpenAI, etc.)
    - **Brand colors** - Each icon has its official brand color for recognition
    - **Central content** - "Take control of every subscription" headline with feature pills and CTA
    - **Feature pills**: Monthly spend tracking, "Charges tomorrow" alerts, AI cancel kits, Price change detection
    - **Dark theme section** - Matches premium landing page aesthetic with gradient orbs and grid pattern
    - **Accessibility** - Respects `prefers-reduced-motion` media query
    - New component: `/components/marketing/SubscriptionMarquee.tsx` with `SubscriptionFloat` export
    - Services included: Netflix, Spotify, YouTube, Disney+, HBO Max, Apple TV+, Prime Video, Hulu, Paramount+, Peacock, Adobe, Figma, Notion, Microsoft, Google, Dropbox, Slack, Zoom, Canva, Linear, OpenAI, GitHub, Anthropic, Duolingo, Headspace, Strava, Grammarly

### Known Issues / TODO:
- Email forwarding via Resend is less reliable than Gmail API (forwarded emails lose original sender info)
- **Gmail OAuth blocked** - App is in Google "Testing" mode. Needs OAuth consent screen verification to go live (requires privacy policy, verification process). Code is ready in `lib/gmail.ts`.
- Gmail sync is manual (user clicks "Sync Now") - could add push notifications for real-time
- **Run SQL migrations** - Run migrations in Supabase dashboard:
  - `/supabase/migrations/001_subscriptions.sql` for subscriptions tables
  - `/supabase/migrations/002_cases.sql` for cases tables
  - `/supabase/migrations/003_vault.sql` for vault tables
  - `/supabase/migrations/004_cancel_guides.sql` for smart cancel kit cache

### Premium Upgrade Plan (COMPLETE):
- **Phase 1: Subscriptions** ✅ DONE - "Netflix charges tomorrow" alerts
- **Phase 2: Cases System** ✅ DONE - Return/warranty/complaint tracking with follow-up automation
- **Phase 3: Evidence Mode** ✅ DONE - Proof scores, trust indicators, needs review filter
- **Phase 4: Vault** ✅ DONE - Document libraries, insurance packs
- **Phase 5: Enhanced Inbox** ✅ DONE - Tabs, evidence viewer, quick fixes
- **Phase 6: Dashboard Upgrade** ✅ DONE - Attention queue, weekly digest, subscription timeline

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
