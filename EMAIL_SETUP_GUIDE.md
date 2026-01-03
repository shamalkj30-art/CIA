# Email Forwarding Setup Guide for Cyncro

## Quick Setup with Resend Subdomain

### Your Receiving Address Format
Resend provided you with: `your-domain.resend.app`

Your forwarding email will be: `receipts+{YOUR_USER_ID}@your-domain.resend.app`

### Step 1: Get Your User ID

1. Go to your Cyncro app: http://localhost:3000/settings
2. Copy your User ID (shown on the settings page)

### Step 2: Set Up Webhook in Resend

1. In Resend dashboard, go to **Webhooks** (in the left sidebar)
2. Click **"Create Webhook"**
3. Configure:
   - **Name**: "Cyncro Receipts"
   - **Events**: Select "Email Received" or "Email Inbound"
   - **URL**: `https://your-production-domain.com/api/email/receive`
     - For testing locally: Use a tool like ngrok: `ngrok http 3000` then use the ngrok URL
   - **Secret**: Generate a random secret (copy it!)
4. Save the webhook

### Step 3: Add Environment Variables

Add to `.env.local`:
```env
EMAIL_WEBHOOK_SECRET=your-secret-from-step-2
NEXT_PUBLIC_EMAIL_DOMAIN=your-domain.resend.app
```

### Step 4: Test It

1. Forward an email to: `receipts+YOUR_USER_ID@your-domain.resend.app`
2. Replace `YOUR_USER_ID` with your actual user ID from Settings page
3. Check your Cyncro purchases - it should appear automatically!

### Example

If your User ID is `abc-123-def`, your forwarding email would be:
```
receipts+abc-123-def@your-domain.resend.app
```

## Production Setup (Custom Domain)

When ready for production:

1. **Add Domain in Resend**: 
   - Go to **Domains** → **Add Domain**
   - Verify domain ownership via DNS
   
2. **Update Environment Variable**:
   ```env
   NEXT_PUBLIC_EMAIL_DOMAIN=your-custom-domain.com
   ```

3. **Your forwarding email becomes**:
   ```
   receipts+{USER_ID}@your-custom-domain.com
   ```

## Troubleshooting

- **Emails not being received?** Check webhook logs in Resend dashboard
- **Receipt not processed?** Check browser console and server logs
- **Can't find webhook settings?** Look under **Webhooks** in left sidebar, not under Emails

