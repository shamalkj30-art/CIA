# Cyncro MVP - Setup Instructions

## ✅ Completed Features

1. **Color Scheme**: Changed from blue/purple to green/emerald/teal throughout
2. **Dark/Light Mode**: Full theme toggle with system preference support
3. **AI Receipt Reading**: Automatically extracts purchase details from receipts
4. **Email Forwarding**: Infrastructure for email-to-receipt processing

## 🚀 Setup Required

### 1. Environment Variables

Add to `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-service-role-key-here

# OpenAI API Key (Required for AI receipt reading)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Webhook Secret (Optional, for email forwarding)
EMAIL_WEBHOOK_SECRET=your-secret-here
```

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Create a new secret key
5. Copy and add to `.env.local`

**Note**: The AI receipt reading uses GPT-4 Vision API which requires credits.

### 3. Email Forwarding Setup (Optional)

To enable email forwarding:

1. Choose an email service (Resend, SendGrid, etc.)
2. Set up a webhook endpoint pointing to: `https://your-domain.com/api/email/receive`
3. Configure email forwarding in your email provider
4. Add webhook secret to `.env.local`

**Example with Resend:**
- Create a Resend account
- Set up a domain
- Configure webhook in Resend dashboard
- Forward emails to your Cyncro email address

## 🎨 Theme

- **Light Mode**: Clean white/green theme
- **Dark Mode**: Dark slate with green accents
- **Toggle**: Available in app navigation (moon/sun icon)

## 🤖 AI Features

### Automatic Receipt Reading

When you upload a receipt:
1. File uploads to Supabase Storage
2. AI analyzes the receipt image/PDF
3. Extracts: item name, merchant, purchase date, warranty period
4. Auto-fills form fields
5. Shows confidence level (high/medium/low)
6. You can edit any field before submitting

### Supported Receipt Types
- JPG, PNG, WebP images
- PDF documents

### AI Confidence Levels
- **High**: All fields extracted correctly
- **Medium**: Some fields may need verification
- **Low**: Manual review recommended

## 📧 Email Integration

Users can forward receipts via email. The system will:
1. Receive email with receipt attachment
2. Extract attachment (image/PDF)
3. Use AI to analyze receipt
4. Create purchase record automatically
5. Store receipt in user's account

## 🎨 Color Scheme

- **Primary**: Emerald Green (`#10b981`)
- **Accent**: Teal (`#14b8a6`)
- **Success**: Green variants
- **No blue or purple** colors used

## 🚀 Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📝 Notes

- AI receipt reading requires OpenAI API key
- Email forwarding requires additional email service setup
- All receipts are stored privately in Supabase Storage
- Theme preference is saved in localStorage

