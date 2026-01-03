# Deploy to Vercel - No GitHub Needed!

## Step 1: Deploy via CLI

Run this command in your terminal:
```bash
cd ~/cyncro
npx vercel
```

Follow the prompts:
- Login to Vercel (it will open browser)
- Press Enter to use current directory
- Press Enter to confirm project settings
- Press Enter to deploy

## Step 2: Add Environment Variables in Vercel

After deployment, go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (get the values from your `.env.local` file):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
EMAIL_WEBHOOK_SECRET=your-email-webhook-secret
NEXT_PUBLIC_EMAIL_DOMAIN=your-email-domain
```

## Step 3: Redeploy

After adding env vars, go to Deployments → Click the three dots → Redeploy

## Step 4: Update Resend Webhook

1. Get your Vercel URL (e.g., `https://cyncro-abc123.vercel.app`)
2. Go to Resend → Webhooks
3. Update webhook URL to: `https://your-vercel-url.vercel.app/api/email/receive`
4. Save

Done! 🎉

