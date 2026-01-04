# Gmail Auto-Sync Setup Guide

This guide explains how to set up Gmail OAuth for automatic order detection in Cyncro.

## Prerequisites

- A Google Cloud Platform account
- Your Cyncro app deployed (or running locally)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Cyncro" (or any name you prefer)
4. Click "Create"

## Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Fill in the required fields:
   - **App name**: Cyncro
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**

### Add Scopes

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
3. Click **Update** → **Save and Continue**

### Add Test Users (for development)

1. Click **Add Users**
2. Add your Gmail address
3. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name: "Cyncro Web"
5. Add **Authorized redirect URIs**:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://your-domain.com/api/auth/google/callback`
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these!

## Step 5: Add Environment Variables

Add these to your `.env.local` file (local) or Vercel environment variables (production):

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# App URL (required for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron job secret (optional, for securing the cron endpoint)
CRON_SECRET=generate-a-random-secret-here
```

## Step 6: Run Database Migrations

Run the new schema in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Open `supabase/schema-v2.sql`
3. Run all the SQL commands

This adds:
- Email connections table (stores OAuth tokens)
- Notifications table
- Notification settings table
- Merchants table (with default return/warranty periods)
- New fields on purchases (order_number, return_deadline, source, etc.)

## Step 7: Test the Integration

1. Start your app: `npm run dev`
2. Go to Settings page
3. Click "Connect Gmail"
4. Authorize with your Google account
5. Click "Sync Now" to test

## How It Works

### Order Detection Flow

1. **User connects Gmail** → OAuth tokens stored securely
2. **Sync triggered** → App searches last 7 days of emails for order keywords
3. **AI analysis** → GPT-4 analyzes each email to detect order confirmations
4. **Data extraction** → Extracts: items, merchant, price, order number, return deadline, warranty
5. **Purchase created** → Automatically added to user's account
6. **Notification sent** → User sees "New purchase detected" notification

### Automatic Sync (Cron Job)

The cron job runs daily at 8 AM UTC and:
- Syncs Gmail for all connected users
- Checks for expiring warranties
- Checks for approaching return deadlines
- Creates notifications as needed

### Notification Types

- **New purchase detected** - When auto-synced from Gmail
- **Warranty expiring** - X days before warranty ends
- **Return deadline approaching** - X days before return window closes

## Security Notes

- We only request **read-only** access to Gmail
- Tokens are stored securely in your database
- Users can disconnect anytime
- We never send emails or modify inbox

## Troubleshooting

### "Google hasn't verified this app"

This appears in development. Click "Advanced" → "Go to Cyncro (unsafe)" to proceed.

For production, you'll need to:
1. Submit your app for Google verification
2. Complete the verification process

### "Access blocked: Authorization Error"

Make sure your redirect URI exactly matches what's in Google Cloud Console.

### No orders detected

- Check that you have order confirmation emails in the last 7 days
- Verify the emails are from recognizable merchants
- Try clicking "Sync Now" manually

### Token refresh errors

If sync fails after a while, the user may need to reconnect Gmail.

## Production Checklist

- [ ] Add production redirect URI to Google Cloud Console
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel
- [ ] Set `CRON_SECRET` for securing cron endpoint
- [ ] Submit app for Google verification (optional but recommended)
- [ ] Run schema-v2.sql on production database

