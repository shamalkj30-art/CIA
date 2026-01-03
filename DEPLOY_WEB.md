# Deploy via Vercel Web Dashboard (No Terminal!)

## Step 1: Create GitHub Account (Free, 2 minutes)

1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Create account (email + password)
4. Verify email

## Step 2: Create GitHub Repository

1. After login, click **"+"** (top right) → **"New repository"**
2. Repository name: `cyncro`
3. Keep it **Private** (or Public, your choice)
4. **Don't** check "Add README" or anything else
5. Click **"Create repository"**

## Step 3: Push Your Code to GitHub

In your Terminal (in Cyncro folder), run these commands **one at a time**:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cyncro.git
git branch -M main
git push -u origin main
```

*(Replace YOUR_USERNAME with your actual GitHub username)*

You'll be prompted for GitHub username and password (use a Personal Access Token if it asks).

## Step 4: Deploy on Vercel Web

1. Go back to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Find and select your `cyncro` repository
5. Click **"Import"**
6. **Add Environment Variables** (click "Environment Variables"):
   - Copy all environment variables from your `.env.local` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `OPENAI_API_KEY`
     - `EMAIL_WEBHOOK_SECRET`
     - `NEXT_PUBLIC_EMAIL_DOMAIN`
7. Click **"Deploy"**

## Step 5: Update Resend Webhook

1. Wait for deployment (takes ~2 minutes)
2. Copy your Vercel URL (e.g., `https://cyncro-abc123.vercel.app`)
3. Go to Resend → Webhooks
4. Update webhook URL to: `https://your-vercel-url.vercel.app/api/email/receive`
5. Test by forwarding a receipt email!

---

**Alternative: If you don't want to use GitHub**, I can help you deploy directly via Vercel CLI with all commands non-interactive. Just let me know!

