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

## Design system

> The instructions a designer or AI coding agent must follow when building or
> touching customer-facing surfaces in Cyncro. This is the canonical source —
> any earlier `Theme` / `Color Scheme` notes are obsolete.

### Point of view

Cyncro is a quiet utility, not a startup pitch. It manages people's money and
proof of purchase — they need to feel a filing cabinet that pays attention,
not a launch announcement. The visual language is **restrained,
Nordic-functional, warm paper instead of glass-and-neon**. Closer to Hay
furniture than to a generic VC-backed SaaS.

The one feeling every page must produce: *"this thing is paying attention for
me."* If a design choice cannot be defended against that sentence, it does
not ship.

### Visual identity

**Type pairing**
- Headings: `Inter Display`, weight 500 only — never bold display weights.
  Wide tracking on H1 (`+0.5px`), tight on labels (`-0.2px`).
- Body: `Inter`, weights 400 and 500.
- Numerics: `Inter` with `font-feature-settings: "tnum"`. **Tabular numerals
  are mandatory** wherever an amount or a date appears.
  *Why: a money product where columns of numbers don't line up looks careless.*

**Color system** (one accent, two semantic, no decorative color)
- `--ink-paper`: `#FAF7F2` — page background. Warm paper, not white, not grey.
- `--ink-surface`: `#FFFFFF` — cards on the paper background.
- `--ink-primary`: `#161513` — near-black with a warm cast. Never `#000`.
- `--ink-muted`: `#6B6A66` — secondary text, labels.
- `--ink-hairline`: `#E6E2D9` — dividers, card borders.
- `--accent-moss`: `#3A6B57` — the single accent. Used only for primary CTAs,
  links, and the active state on deadline timelines.
- `--semantic-warn`: `#C2541B` — burnt sienna, used for "approaching deadline."
- `--semantic-critical`: `#8E1F1F` — deep brick, used only for "expired."

*Why one accent, not three: a product about clarity should not force users to
disambiguate red-vs-green-vs-blue states.* No emerald, no teal, no purple, no
gradient blue. The previous palette was inherited from generic SaaS
templates; it is discarded.

**Imagery**
- Real receipts (paper texture, slight rotation, mild grain) as page elements
  — they ARE the product.
- No stock photography of happy customers with laptops.
- No abstract gradient orbs.
- Icons: thin-line, 1.5px stroke, slight roundness. Never filled glyphs.

### Layout principles

- **Asymmetric**, not centered. The web defaults to "centered hero + 3
  feature cards" — that's the shape that feels generic. Hero copy on the
  left, an artifact (a stylised receipt) on the right.
- **Editorial rhythm.** Text column max-width `62ch`. Sections breathe with
  `80–120px` vertical spacing at desktop.
- **Anchor each section on one specific number.** "1 247 kr saved last
  month." "14 days left on the warranty." A money product earns trust by
  being specific, not by waving hands.

### Spacing & rhythm

- Base unit: `8px`. Only multiples (8, 16, 24, 32, 48, 64, 96, 128).
- Page gutters: `48px` desktop, `24px` mobile.
- Card padding: `32px` desktop, `20px` mobile.
- Line-height: `1.5` for body, `1.15` for display headings.

### Components

- **Buttons.** Rectangular, 2px radius, no shadow. Primary uses `--accent-moss`
  with no gradient. Secondary uses a 1px hairline border. Hover darkens 8% —
  never glows.
- **Cards.** White surface, 1px `--ink-hairline` border, max 6px radius. Drop
  shadow only on hover, only `0 4px 12px rgba(0,0,0,0.05)`.
- **Forms.** Labels above fields. Hairline bottom border only (no full box).
  Focus state darkens the hairline — no blue glow.
- **Timelines.** Horizontal line with tick marks, accent fill from "today" to
  "deadline." Date labels in tabular numerals.

### Accessibility (non-negotiable)

- All text-on-background pairs must meet WCAG AA contrast (4.5:1). Verified:
  `#161513` on `#FAF7F2` = 14.8:1 ✓.
- All interactive elements: 44×44 px minimum hit area.
- Every interactive element has a visible text label OR an `aria-label` —
  never icon-only without a name.
- Copy works in **Norwegian first, English second**. No
  string-concatenated grammar that breaks in either language.

### Banned (do not ship these — known generic patterns)

- Centered hero with 3 feature cards underneath.
- Glassmorphism / frosted-glass / backdrop-blur cards.
- Blue, purple, indigo, or teal gradients of any kind.
- Lucide / Heroicons as the hero visual.
- Generic "Get started" / "Sign up free" CTAs. CTAs must be specific:
  *"Connect Gmail and find everything"*, *"See last month's spending."*
- Animated gradient orbs.
- "Hero with laptop" stock photography.

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

