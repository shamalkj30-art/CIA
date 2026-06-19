# Supabase setup (fresh install)

Use this when bringing Cyncro back online on a new Supabase project.

## 1. Create a new Supabase project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Pick org → name it `cyncro` → choose region **EU (Frankfurt)** → set a strong DB password (save it somewhere)
4. Wait ~2 minutes for it to provision

## 2. Run the schema

1. In the project, open **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase/setup-fresh.sql` (in this repo) — copy the whole file
4. Paste into the SQL editor → click **Run**
5. You should see "Success. No rows returned." — all 7 schemas + storage bucket + RLS policies are in.

## 3. Copy the keys

In your Supabase project → **Project Settings** → **API**:

- **Project URL** → goes into `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → goes into `SUPABASE_SERVICE_ROLE_KEY`

Paste them into `.env.local` (replacing the placeholders).

## 4. Configure auth redirects

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (for local dev)
- **Redirect URLs:** add these as allowed:
  - `http://localhost:3000/auth/callback`
  - `https://cyncro.vercel.app/auth/callback` (for production)

Save.

## 5. Verify locally

```bash
npm run dev
# → http://localhost:3000
```

Sign up with email/password → verify the user appears in **Authentication → Users**.

## 6. Deploy to Vercel

Update the env vars in your Vercel project (https://vercel.com/dashboard → cyncro → Settings → Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (already there)

Redeploy from the dashboard → done.

---

## Notes

- The setup SQL is **idempotent** — safe to re-run if you change something and need a fresh state.
- Storage `receipts` bucket is created automatically; RLS policies are scoped so users only see their own folders.
- Email/password sign-up is on by default. Google OAuth requires extra config (see `GMAIL_SETUP_GUIDE.md`).
