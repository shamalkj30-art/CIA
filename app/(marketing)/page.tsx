'use client'

import Link from 'next/link'
import { Button, Section, Page, Card, Badge, Grid } from '@/components/ui'
import { HeroInteractive } from '@/components/marketing/HeroInteractive'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="loose" className="overflow-hidden">
        <Page size="wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <Badge variant="primary" className="mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse mr-2" />
                AI-powered warranty tracking
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-[1.1]">
                Never lose a warranty claim again
              </h1>

              <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-lg">
                Upload receipts, let AI extract the details, track warranty deadlines, and generate professional claim packets in one click.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button as="link" href="/signup" size="lg">
                  Get started free
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
                <Button as="link" href="/#how-it-works" variant="secondary" size="lg">
                  See how it works
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-[var(--text-muted)]">
                {['Free forever plan', 'No credit card required', 'Works in 30 seconds'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Demo */}
            <div className="lg:pl-8">
              <HeroInteractive />
            </div>
          </div>
        </Page>
      </Section>

      {/* How It Works - Bento Grid */}
      <Section id="how-it-works" spacing="normal" bg="surface">
        <Page>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              How it works
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              From receipt to warranty protection in under a minute
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Step 1 - Large */}
            <div className="md:col-span-2 lg:col-span-2 bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Upload or forward
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-4">
                    Snap a photo, upload a PDF, or forward email receipts directly to your Cyncro inbox. We accept all formats.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Photos', 'PDFs', 'Emails', 'Screenshots'].map((format) => (
                      <span key={format} className="px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-full text-sm text-[var(--text-muted)]">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[var(--primary-soft)] border border-[var(--primary)]/20 rounded-2xl p-6 lg:p-8">
              <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                AI extracts details
              </h3>
              <p className="text-[var(--text-secondary)]">
                We automatically pull merchant, date, item name, amount, and warranty period. You verify and save.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6 lg:p-8">
              <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Track deadlines
              </h3>
              <p className="text-[var(--text-secondary)]">
                See warranty and return deadlines at a glance. Get notified before they expire.
              </p>
            </div>

            {/* Step 4 - Wide */}
            <div className="md:col-span-2 bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-2xl p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                <div className="w-14 h-14 rounded-xl bg-[var(--warning)] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Generate claim packets
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    When you need to make a claim, generate a professional PDF with everything the manufacturer needs — receipt, product details, warranty info, and your contact information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Page>
      </Section>

      {/* Claim Packet Showcase */}
      <Section spacing="normal">
        <Page>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge variant="warning" className="mb-6">Flagship feature</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
                Professional claim packets
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                When you need to make a warranty claim, generate a ready-to-send PDF with everything the manufacturer needs.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Product name, model, and serial number',
                  'Purchase date and merchant details',
                  'Warranty period and expiration date',
                  'Original receipt image embedded',
                  'Your contact information',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--success-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[var(--text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>

              <Button as="link" href="/signup">
                Try it free
              </Button>
            </div>

            {/* Packet Preview */}
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl p-8 lg:p-10">
              <div className="text-center mb-8 pb-6 border-b border-dashed border-[var(--border)]">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">Warranty Claim Packet</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Generated by Cyncro</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Product', value: 'Sony WH-1000XM5' },
                  { label: 'Purchase Date', value: 'March 15, 2024' },
                  { label: 'Merchant', value: 'Best Buy' },
                  { label: 'Warranty Expires', value: 'March 15, 2025', highlight: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-3 border-b border-dashed border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">{item.label}</span>
                    <span className={`font-medium ${item.highlight ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-[var(--surface-subtle)] rounded-xl text-center">
                <p className="text-sm text-[var(--text-muted)]">📎 Receipt image attached</p>
              </div>
            </div>
          </div>
        </Page>
      </Section>

      {/* Integrations */}
      <Section spacing="tight" bg="subtle">
        <Page>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 text-[var(--text-muted)]">
            {[
              { icon: '📧', label: 'Email forwarding' },
              { icon: '📅', label: 'Calendar reminders' },
              { icon: '📄', label: 'PDF export' },
              { icon: '📊', label: 'CSV export' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </Page>
      </Section>

      {/* Security */}
      <Section spacing="normal">
        <Page>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Your data is protected
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-12">
              We take security seriously. Your receipts and personal data are encrypted and never shared.
            </p>

            <Grid cols={3} gap="md">
              {[
                { icon: '🔒', title: 'Encrypted storage', desc: 'All data encrypted at rest and in transit' },
                { icon: '🗑️', title: 'Delete anytime', desc: 'Export or delete your data with one click' },
                { icon: '🤖', title: 'AI stays private', desc: 'We never train on your personal data' },
              ].map((item) => (
                <Card key={item.title} variant="outline" padding="md">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                </Card>
              ))}
            </Grid>

            <p className="mt-8 text-sm text-[var(--text-muted)]">
              Read our full{' '}
              <Link href="/security" className="text-[var(--primary)] hover:underline">
                Security page
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </Page>
      </Section>

      {/* Pricing */}
      <Section id="pricing" spacing="normal" bg="surface">
        <Page>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Simple pricing
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card padding="lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Free</h3>
                <div className="text-4xl font-bold text-[var(--text-primary)] mt-2">$0</div>
                <p className="text-sm text-[var(--text-muted)] mt-1">forever</p>
              </div>
              <ul className="space-y-3 mb-6">
                {['Up to 25 receipts', 'Basic warranty tracking', 'Claim packet generation', 'Email support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button as="link" href="/signup" variant="secondary" fullWidth>
                Get started
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card padding="lg" className="border-2 border-[var(--primary)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="primary">Popular</Badge>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Pro</h3>
                <div className="text-4xl font-bold text-[var(--text-primary)] mt-2">$5</div>
                <p className="text-sm text-[var(--text-muted)] mt-1">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                {['Unlimited receipts', 'Priority AI processing', 'Email forwarding', 'Expiry alerts', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button as="link" href="/signup" fullWidth>
                Start free trial
              </Button>
            </Card>
          </div>
        </Page>
      </Section>

      {/* FAQ */}
      <Section spacing="normal">
        <Page size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Questions?
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What happens to my data if I cancel?',
                a: 'You can export all your data (receipts, warranty info, claim packets) at any time. If you delete your account, all data is permanently removed within 30 days.',
              },
              {
                q: 'Is my receipt data secure?',
                a: 'Yes. All data is encrypted at rest and in transit. We use industry-standard security practices and never share your data with third parties.',
              },
              {
                q: 'Can I import existing receipts?',
                a: 'Absolutely. You can upload photos, PDFs, or forward email receipts. Our AI will extract the details automatically.',
              },
              {
                q: 'What if the AI extracts wrong information?',
                a: 'You can always edit any field before saving. We show confidence scores so you know which fields to double-check.',
              },
            ].map((faq, i) => (
              <Card key={i} variant="outline" padding="md">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{faq.q}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{faq.a}</p>
              </Card>
            ))}
          </div>
        </Page>
      </Section>

      {/* Final CTA */}
      <Section spacing="loose" bg="surface">
        <Page>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Ready to protect your purchases?
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              Join thousands who never lose money on expired warranties.
            </p>
            <Button as="link" href="/signup" size="lg">
              Start free today
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </Page>
      </Section>
    </>
  )
}
