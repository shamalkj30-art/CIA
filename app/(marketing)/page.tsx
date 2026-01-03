'use client'

import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import ParticlesBackground from '@/components/ParticlesBackground'

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      {/* Particles Background */}
      <ParticlesBackground />
      
      {/* Content wrapper - above particles */}
      <div className="relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">Cyncro</span>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Start free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--primary)]">Warranty protection made simple</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
              Never lose a warranty claim again
            </h1>

            {/* Workflow subheadline */}
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              Upload or forward receipts → AI extracts the details → Track warranty deadlines → Generate claim packets in one click
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/signup" className="btn btn-primary px-8 py-3 text-base w-full sm:w-auto">
                Start free
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button 
                onClick={() => setDemoOpen(true)}
                className="btn btn-secondary px-8 py-3 text-base w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Works in 30 seconds</span>
              </div>
            </div>
          </div>

          {/* Product Screenshot */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="card overflow-hidden">
                {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface-subtle)] border-b border-[var(--border)]">
                  <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--danger)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
                  </div>
                  <div className="flex-1 mx-4">
                  <div className="bg-[var(--background)] rounded-md px-3 py-1 text-sm text-[var(--text-muted)] font-mono max-w-xs mx-auto text-center">
                    cyncro.vercel.app/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Preview */}
              <div className="p-6 bg-[var(--background)]">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-1">Items Tracked</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">47</p>
                    </div>
                  <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-1">Protected Value</p>
                    <p className="text-2xl font-bold text-[var(--success)]">$12,450</p>
                    </div>
                  <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-1">Expiring Soon</p>
                    <p className="text-2xl font-bold text-[var(--warning)]">3</p>
                  </div>
                </div>

                {/* Sample Items */}
                  <div className="space-y-3">
                    {[
                    { name: 'MacBook Pro 14"', merchant: 'Apple Store', days: '289', status: 'active' },
                    { name: 'Sony WH-1000XM5', merchant: 'Best Buy', days: '156', status: 'active' },
                    { name: 'LG OLED TV 55"', merchant: 'Amazon', days: '23', status: 'warning' },
                    ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                        <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                          <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                          <p className="text-sm text-[var(--text-muted)]">{item.merchant}</p>
                        </div>
                      </div>
                      {/* Callout for warning item */}
                      {item.status === 'warning' ? (
                        <div className="flex items-center gap-2">
                          <span className="badge badge-warning">{item.days} days left</span>
                          <div className="hidden sm:block relative">
                            <div className="absolute -top-8 -right-2 bg-[var(--warning)] text-white text-xs font-medium px-2 py-1 rounded-md">
                              Act now!
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[var(--warning)]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-success">{item.days} days left</span>
                      )}
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            
            {/* Callouts */}
            <div className="hidden lg:block absolute -left-4 top-1/3 transform -translate-x-full">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg max-w-[180px]">
                <p className="text-xs font-medium text-[var(--primary)]">AI-extracted details</p>
                <p className="text-xs text-[var(--text-muted)]">Merchant, date, amount parsed automatically</p>
              </div>
            </div>
            <div className="hidden lg:block absolute -right-4 top-2/3 transform translate-x-full">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg max-w-[180px]">
                <p className="text-xs font-medium text-[var(--warning)]">Warranty deadline</p>
                <p className="text-xs text-[var(--text-muted)]">Never miss a claim window again</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              How it works
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              From receipt to warranty protection in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload or forward',
                description: 'Snap a photo, upload a PDF, or forward email receipts directly to your Cyncro inbox.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'AI extracts details',
                description: 'We automatically pull merchant, date, item name, amount, and warranty period. You verify and save.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Track & claim',
                description: 'See warranty deadlines at a glance. Generate a professional claim packet with one click when needed.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-[var(--primary)] mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Cyncro - Comparison */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Why Cyncro?
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Stop losing money on forgotten warranties
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-4 px-4 text-[var(--text-primary)] font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-[var(--text-muted)]">Email folders</th>
                  <th className="text-center py-4 px-4 text-[var(--text-muted)]">Spreadsheets</th>
                  <th className="text-center py-4 px-4 text-[var(--text-muted)]">Receipt scanners</th>
                  <th className="text-center py-4 px-4 bg-[var(--primary-soft)] rounded-t-lg text-[var(--primary)] font-semibold">Cyncro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Warranty tracking & alerts', '❌', '❌', '❌', '✓'],
                  ['AI data extraction', '❌', '❌', '✓', '✓'],
                  ['Claim packet generation', '❌', '❌', '❌', '✓'],
                  ['Email forwarding', '—', '❌', '❌', '✓'],
                  ['Expiry reminders', '❌', 'Manual', '❌', '✓'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="py-4 px-4 text-[var(--text-primary)] font-medium">{row[0]}</td>
                    <td className="py-4 px-4 text-center text-[var(--text-muted)]">{row[1]}</td>
                    <td className="py-4 px-4 text-center text-[var(--text-muted)]">{row[2]}</td>
                    <td className="py-4 px-4 text-center text-[var(--text-muted)]">{row[3]}</td>
                    <td className="py-4 px-4 text-center bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Claim Packet Proof */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                Professional claim packets
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-6">
                When you need to make a warranty claim, generate a ready-to-send PDF with everything the manufacturer needs.
              </p>
              
              <ul className="space-y-3 mb-8">
                {[
                  'Product name, model, and serial number',
                  'Purchase date and merchant details',
                  'Warranty period and expiration date',
                  'Original receipt image embedded',
                  'Your contact information',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--success)] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[var(--text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="btn btn-primary">
                Try it free
              </Link>
            </div>

            {/* Claim Packet Preview */}
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-lg p-8 receipt-texture">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Warranty Claim Packet</h3>
                <p className="text-sm text-[var(--text-muted)]">Generated by Cyncro</p>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-dashed border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">Product</span>
                  <span className="font-medium text-[var(--text-primary)]">Sony WH-1000XM5</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">Purchase Date</span>
                  <span className="font-medium text-[var(--text-primary)]">March 15, 2024</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">Merchant</span>
                  <span className="font-medium text-[var(--text-primary)]">Best Buy</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">Warranty Expires</span>
                  <span className="font-medium text-[var(--warning)]">March 15, 2025</span>
                </div>
                <div className="mt-6 p-4 bg-[var(--surface-subtle)] rounded-lg border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] text-center">📎 Receipt image attached</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Security & Privacy
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Your data is protected. Here's how.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '🔒', title: 'Encrypted storage', desc: 'All receipts and data encrypted at rest and in transit' },
              { icon: '🗑️', title: 'Delete anytime', desc: 'Export or permanently delete your data with one click' },
              { icon: '🤖', title: 'AI stays private', desc: 'AI extraction happens securely; we never train on your data' },
              { icon: '🔐', title: 'Secure auth', desc: 'Industry-standard authentication with optional 2FA' },
              { icon: '📍', title: 'Your data, your control', desc: 'We store receipt images + extracted fields only' },
              { icon: '💳', title: 'No payment data', desc: 'We never store credit card or payment information' },
            ].map((item, i) => (
              <div key={i} className="card">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[var(--text-muted)]">
            Read our full <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Simple pricing
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Free</h3>
                <div className="text-4xl font-bold text-[var(--text-primary)] mt-2">$0</div>
                <p className="text-sm text-[var(--text-muted)] mt-1">forever</p>
              </div>
              <ul className="space-y-3 mb-6">
                {['Up to 25 receipts', 'Basic warranty tracking', 'Claim packet generation', 'Email support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--text-muted)] text-center mb-4">Best for: Occasional purchases</p>
              <Link href="/signup" className="btn btn-secondary w-full justify-center">
                Get started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-[var(--primary)] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[var(--primary)] text-white text-xs font-medium px-3 py-1 rounded-full">Popular</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Pro</h3>
                <div className="text-4xl font-bold text-[var(--text-primary)] mt-2">$5</div>
                <p className="text-sm text-[var(--text-muted)] mt-1">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                {['Unlimited receipts', 'Priority AI processing', 'Email forwarding', 'Expiry alerts', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--text-muted)] text-center mb-4">Best for: Homeowners & families</p>
              <Link href="/signup" className="btn btn-primary w-full justify-center">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Ready to protect your purchases?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Join thousands who never lose money on expired warranties.
          </p>
          <Link href="/signup" className="btn btn-primary px-10 py-4 text-base">
            Start free today
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">Cyncro</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
              <Link href="/privacy" className="hover:text-[var(--primary)]">Privacy</Link>
              <Link href="/terms" className="hover:text-[var(--primary)]">Terms</Link>
              <Link href="mailto:support@cyncro.app" className="hover:text-[var(--primary)]">Contact</Link>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              © {new Date().getFullYear()} Cyncro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>{/* End content wrapper */}

      {/* Demo Modal */}
      {demoOpen && (
        <div 
          className="modal-backdrop" 
          onClick={() => setDemoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Demo video"
        >
          <div 
            className="modal-content w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[var(--surface)] rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">See Cyncro in action</h3>
                <button 
                  onClick={() => setDemoOpen(false)}
                  className="p-2 hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="aspect-video bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-[var(--text-muted)]">Demo video coming soon</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">Try the product — it takes 30 seconds!</p>
                  <Link href="/signup" className="btn btn-primary mt-4" onClick={() => setDemoOpen(false)}>
                    Start free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
