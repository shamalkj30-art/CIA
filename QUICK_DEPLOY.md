# 🚀 Quick Deploy Guide

Your code is ready! Follow these steps:

## Step 1: Create GitHub Account (2 minutes)
- Go to github.com and sign up (free)

## Step 2: Create Repository on GitHub
1. Click "+" → "New repository"
2. Name: `cyncro`
3. Click "Create repository"

## Step 3: Push Code (Copy these commands)

Open Terminal in your Cyncro folder and paste:

```bash
cd ~/cyncro
git remote add origin https://github.com/YOUR_USERNAME/cyncro.git
git push -u origin main
```

(Replace YOUR_USERNAME with your GitHub username)

**Note:** When asked for password, you'll need a GitHub Personal Access Token:
- Go to GitHub → Settings → Developer settings → Personal access tokens → Generate token
- Copy the token and use it as password

## Step 4: Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your `cyncro` repository
3. Add these Environment Variables (click "Environment Variables" button):
   - Copy from your `.env.local` file (all of them)
4. Click Deploy!

## Step 5: Update Resend Webhook
1. Copy your Vercel URL (after deployment)
2. Resend → Webhooks → Update URL to: `https://your-url.vercel.app/api/email/receive`

Done! ✅

