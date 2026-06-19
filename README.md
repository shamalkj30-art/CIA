# Cyncro — Personal Proof & Money OS

A SaaS I built over several months that solves a stupid little problem with real money on the line: *you lost the receipt.*

When you need to claim a warranty, file an insurance claim, return a 2-month-old item, or prove a subscription charge — you go looking for the receipt and it's gone. Cyncro fixes that by connecting to your Gmail, finding order confirmations automatically, extracting the purchase details with AI, and tracking the deadlines for warranty / return windows / subscription renewals.

**Live site:** https://cyncro.vercel.app (landing page is live; the app/dashboard is paused — see *Status* below)

---

## What it actually does

- **Connects to Gmail** via OAuth. Reads order-confirmation emails — never anything else.
- **AI extracts the purchase** — store, item, amount, date, warranty terms — and saves it. Uses Anthropic Claude (vision + text) so it can handle PDFs, attached receipts, and inline images.
- **Tracks deadlines** automatically: warranty expiry, return window, subscription renewal, free-trial end.
- **Surfaces what needs action** — "your warranty on the headphones expires in 7 days," "your free trial renews tomorrow at full price."
- **Vault** — every receipt searchable, exportable, ready to send to insurance / customer service when something breaks.
- **AI chat over your purchases** — "find me the receipt for the espresso machine I bought in March."

I started this because I saw it from the **insurance side first**. I've worked in skadebehandling at Gjensidige for years, and the single most common friction in a claim is *"we need proof of purchase."* People don't have it. So I built the layer that means they always do.

## Stack

- **Next.js 16** (App Router) · **TypeScript** · **Tailwind v4** (deployed on Vercel)
- **Supabase** — PostgreSQL, Auth, and Storage for the receipt bucket
- **Anthropic Claude** (Sonnet) for receipt parsing — vision and text
- **Gmail API** (OAuth) for reading order emails
- **Resend** for email-forwarding webhooks (back-up capture method)
- An **LLM abstraction layer** I built so swapping providers is one config change

## Status (be honest)

I haven't shipped a new version in a few months. The Supabase project went into Supabase's auto-pause after a long inactive period, which means the dashboard / app routes don't connect to a database right now. The **landing page is still live and rendering fine** on Vercel, but the auth + receipt-vault parts need a fresh Supabase instance to come back online.

I'm bringing it back — new Supabase project, fresh schema migration, reconnect Gmail OAuth. The code itself builds cleanly (Next.js 16, ~70 commits of iterative work). If you want to see how it's put together, the most interesting reading is:

- `app/api/` — receipt-parsing webhook + Gmail sync routes
- `lib/llm/` — the multi-provider LLM abstraction layer
- `supabase/migrations/` — the schema
- `app/(app)/` — the authenticated app routes (dashboard, vault, upload)

## Where this came from

Cyncro started as one of several AI side projects I was building. The unlock was realising it sits **right next to my day job** — the insurance industry has the same "we need proof, you don't have it" problem at scale. Building Cyncro taught me a lot about end-to-end product work: OAuth flows, file-storage pipelines, AI pipelines that have to be reliable on messy inputs (real receipt PDFs), and deadline tracking with idempotent cron jobs.

It's also where I built the multi-provider LLM layer that I now reuse across other projects — same interface, different models behind it.

## Run it locally

```bash
git clone https://github.com/shamalkj30-art/CIA.git cyncro
cd cyncro
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic + Gmail OAuth keys
npm run dev
```

Then `http://localhost:3000`. You'll need your own Supabase project for auth and storage — `supabase/migrations/` has the schema.

## Notes on this repo

- No secrets in code or git history (audited and scrubbed).
- All real API keys and tokens live in `.env.local` (gitignored).
- The landing page on `cyncro.vercel.app` is the original deployment and is still serving.
