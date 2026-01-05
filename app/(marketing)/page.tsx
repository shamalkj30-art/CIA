'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button, Section, Page, Card, Badge } from '@/components/ui'
import { ScrollReveal } from '@/components/ScrollReveal'

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO - Dark gradient background with floating elements */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#09090B]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-[80px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-600/10 to-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <Page size="wide" className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div>
              <ScrollReveal direction="up" delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-white/70">Now with Vault & Insurance Packs</span>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] text-white mb-6 leading-[1.05]">
                  Your{' '}
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Personal Proof
                  </span>{' '}
                  & Money OS
                </h1>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={200}>
                <p className="text-xl text-white/60 mb-10 max-w-lg leading-relaxed">
                  Auto-capture receipts. Track warranties & subscriptions. Generate claim packets. Never lose money on expired protection again.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                  >
                    Start free
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all"
                  >
                    See features
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={400}>
                <div className="flex items-center gap-8 text-sm text-white/40">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Free forever plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Gmail sync</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: App Preview */}
            <ScrollReveal direction="scale" delay={200}>
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl scale-95" />

                {/* App mockup card */}
                <div className="relative bg-[#18181B] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  {/* App header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1.5 bg-white/5 rounded-lg text-sm text-white/50">
                        cyncro.app/dashboard
                      </div>
                    </div>
                  </div>

                  {/* App content preview */}
                  <div className="p-6 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/40 mb-1">Purchases</p>
                        <p className="text-2xl font-bold text-white">47</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/40 mb-1">Subscriptions</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/40 mb-1">Vault Items</p>
                        <p className="text-2xl font-bold text-white">89</p>
                      </div>
                    </div>

                    {/* Alert card */}
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <span className="text-xl">⚡</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Netflix charges tomorrow</p>
                          <p className="text-xs text-white/50">kr 169/month • Renews Jan 6</p>
                        </div>
                      </div>
                    </div>

                    {/* Purchase items */}
                    <div className="space-y-2">
                      {[
                        { name: 'MacBook Pro 14"', merchant: 'Apple Store', status: 'Claim Ready', color: 'green' },
                        { name: 'Sony WH-1000XM5', merchant: 'Elkjøp', status: 'Expiring Soon', color: 'orange' },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                          <div>
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <p className="text-xs text-white/50">{item.merchant}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.color === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Page>
      </section>

      {/* STATS BAR */}
      <section className="py-12 bg-[var(--surface)] border-y border-[var(--border)]">
        <Page>
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20">
            {[
              { value: '10K+', label: 'Receipts tracked' },
              { value: '€2.3M', label: 'Warranties protected' },
              { value: '847', label: 'Claims filed' },
              { value: '99.2%', label: 'AI accuracy' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </Page>
      </section>

      {/* PROBLEM SECTION */}
      <Section spacing="normal" className="mesh-gradient">
        <Page>
          <ScrollReveal direction="up">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">The Problem</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
                You're losing money every year
              </h2>
              <p className="text-xl text-[var(--text-secondary)]">
                Warranties expire. Subscriptions auto-renew. Receipts get lost. Sound familiar?
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '📦', stat: '€847', label: 'Average lost to expired warranties per year', color: 'red' },
              { icon: '🔄', stat: '€312', label: 'Wasted on forgotten subscriptions', color: 'orange' },
              { icon: '📄', stat: '73%', label: 'Of people can\'t find receipts when needed', color: 'yellow' },
            ].map((item, i) => (
              <ScrollReveal key={item.label} direction="up" delay={i * 100}>
                <div className="text-center p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover-lift">
                  <span className="text-4xl mb-4 block">{item.icon}</span>
                  <p className={`text-4xl font-bold mb-2 ${
                    item.color === 'red' ? 'text-red-500' :
                    item.color === 'orange' ? 'text-orange-500' : 'text-yellow-500'
                  }`}>{item.stat}</p>
                  <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Page>
      </Section>

      {/* FEATURES - THE 4 PILLARS */}
      <Section id="features" spacing="loose" bg="subtle">
        <Page>
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">Features</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
                Everything you need to protect your purchases
              </h2>
            </div>
          </ScrollReveal>

          {/* Feature 1: Purchases */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
            <ScrollReveal direction="right">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                  <span>📦</span> Purchases
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
                  Auto-capture every receipt
                </h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6">
                  Connect Gmail and we'll automatically detect order confirmations. AI extracts merchant, items, prices, and warranty info. Upload photos or forward emails for manual adds.
                </p>
                <ul className="space-y-3">
                  {['Gmail auto-sync', 'AI-powered extraction', 'Photo & PDF upload', 'Warranty deadline tracking'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="left">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-[var(--text-primary)]">Recent Purchases</h4>
                  <span className="text-xs text-[var(--text-muted)]">47 total</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'iPhone 15 Pro', merchant: 'Apple Store', price: 'kr 13,990', badge: 'Claim Ready', badgeColor: 'green' },
                    { name: 'AirPods Pro', merchant: 'Elkjøp', price: 'kr 2,990', badge: 'AI Verified', badgeColor: 'indigo' },
                    { name: 'Standing Desk', merchant: 'IKEA', price: 'kr 4,999', badge: 'Needs Review', badgeColor: 'orange' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-subtle)]">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">{item.merchant} • {item.price}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.badgeColor === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                        item.badgeColor === 'indigo' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Feature 2: Subscriptions */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
            <ScrollReveal direction="right" className="lg:order-2">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
                  <span>🔄</span> Subscriptions
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
                  "Netflix charges tomorrow" alerts
                </h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6">
                  Track every recurring payment. Get notified before charges hit. Generate AI-powered cancel kits with step-by-step instructions when you're ready to cut the cord.
                </p>
                <ul className="space-y-3">
                  {['Charge date alerts', 'Monthly spend tracking', 'AI cancel kits', 'Price change detection'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="left" className="lg:order-1">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-[var(--text-primary)]">Active Subscriptions</h4>
                  <span className="text-sm font-medium text-[var(--text-muted)]">kr 1,247/mo</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Netflix', price: 'kr 169', next: 'Tomorrow', color: '#E50914', urgent: true },
                    { name: 'Spotify', price: 'kr 119', next: 'Jan 15', color: '#1DB954', urgent: false },
                    { name: 'Adobe CC', price: 'kr 599', next: 'Jan 20', color: '#FF0000', urgent: false },
                  ].map((item) => (
                    <div key={item.name} className={`flex items-center justify-between p-4 rounded-xl ${item.urgent ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[var(--surface-subtle)]'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: item.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                          <p className="text-sm text-[var(--text-muted)]">{item.price}/mo</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${item.urgent ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                        {item.next}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Feature 3: Cases */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
            <ScrollReveal direction="right">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium mb-6">
                  <span>📋</span> Cases
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
                  Returns & complaints made easy
                </h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6">
                  Open a case, and AI generates professional messages in your language. Track status, set follow-up reminders, and escalate when needed. Norwegian consumer law built-in.
                </p>
                <ul className="space-y-3">
                  {['AI-generated messages', 'Multi-language support', '3-day follow-up reminders', 'Escalation templates'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="left">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-[var(--text-primary)]">Active Case</h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">Waiting</span>
                </div>
                <div className="mb-4">
                  <p className="font-medium text-[var(--text-primary)]">Return: Defective Headphones</p>
                  <p className="text-sm text-[var(--text-muted)]">Sony WH-1000XM5 • Elkjøp</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[var(--text-muted)]">Created case</span>
                    <span className="text-[var(--text-muted)] ml-auto">Jan 2</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[var(--text-muted)]">Sent initial message</span>
                    <span className="text-[var(--text-muted)] ml-auto">Jan 2</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-[var(--text-primary)]">Awaiting response</span>
                    <span className="text-[var(--text-muted)] ml-auto">Now</span>
                  </div>
                </div>
                <button className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors">
                  Send Follow-up
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Feature 4: Vault */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <ScrollReveal direction="right" className="lg:order-2">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                  <span>🗄️</span> Vault
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
                  Your document fortress
                </h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6">
                  Organize receipts, warranties, manuals, insurance docs, and contracts in secure libraries. Generate insurance claim packs organized by room with one click.
                </p>
                <ul className="space-y-3">
                  {['5 document libraries', '8 insurance rooms', 'One-click claim packs', 'Expiry tracking'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="left" className="lg:order-1">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-[var(--text-primary)]">Insurance Vault</h4>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">kr 847,000 total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { room: 'Kitchen', icon: '🍳', items: 12, value: 'kr 145K' },
                    { room: 'Living Room', icon: '🛋️', items: 8, value: 'kr 285K' },
                    { room: 'Office', icon: '💼', items: 15, value: 'kr 189K' },
                    { room: 'Bedroom', icon: '🛏️', items: 6, value: 'kr 78K' },
                  ].map((room) => (
                    <div key={room.room} className="p-4 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--border)] transition-colors cursor-pointer">
                      <span className="text-2xl mb-2 block">{room.icon}</span>
                      <p className="font-medium text-[var(--text-primary)]">{room.room}</p>
                      <p className="text-xs text-[var(--text-muted)]">{room.items} items • {room.value}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors">
                  Generate Claim Pack
                </button>
              </div>
            </ScrollReveal>
          </div>
        </Page>
      </Section>

      {/* EVIDENCE MODE HIGHLIGHT */}
      <Section spacing="normal" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <Page className="relative">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal direction="up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                <span>✨</span> Evidence Mode
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
                AI-verified, claim-ready proof
              </h2>
              <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">
                Every purchase shows a Proof Score. See what's claim-ready, what needs review, and exactly what's missing for complete documentation.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { status: 'Claim Ready', color: 'green', icon: '✓', desc: 'All evidence present' },
                  { status: 'Almost Ready', color: 'yellow', icon: '◐', desc: 'Missing 1-2 fields' },
                  { status: 'Needs Review', color: 'orange', icon: '!', desc: 'Auto-detected, verify' },
                ].map((item) => (
                  <div key={item.status} className={`p-6 rounded-2xl border ${
                    item.color === 'green' ? 'bg-green-500/5 border-green-500/20' :
                    item.color === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    'bg-orange-500/5 border-orange-500/20'
                  }`}>
                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${
                      item.color === 'green' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      item.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      {item.icon}
                    </div>
                    <p className="font-semibold text-[var(--text-primary)] mb-1">{item.status}</p>
                    <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </Page>
      </Section>

      {/* HOW IT WORKS - SIMPLE */}
      <Section spacing="normal" bg="surface">
        <Page>
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                Three steps to peace of mind
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Connect', desc: 'Link your Gmail or upload receipts manually. Takes 30 seconds.' },
              { step: '2', title: 'Relax', desc: 'AI extracts details, tracks deadlines, and alerts you before things expire.' },
              { step: '3', title: 'Claim', desc: 'Generate professional claim packets or cancel kits with one click.' },
            ].map((item, i) => (
              <ScrollReveal key={item.step} direction="up" delay={i * 100}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                  <p className="text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Page>
      </Section>

      {/* PRICING */}
      <Section id="pricing" spacing="normal">
        <Page>
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">Pricing</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                Start free, upgrade when ready
              </h2>
              <p className="text-lg text-[var(--text-secondary)]">No credit card required</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <ScrollReveal direction="up" delay={0}>
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 hover-lift h-full">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Free</h3>
                  <div className="text-5xl font-bold text-[var(--text-primary)]">$0</div>
                  <p className="text-sm text-[var(--text-muted)] mt-1">forever</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {['25 purchases', 'Basic warranty tracking', 'Claim packet generation', '5 vault items', 'Email support'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full py-4 rounded-xl border-2 border-[var(--border)] text-center font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors">
                  Get started
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="gradient-border h-full">
                <div className="bg-[var(--surface)] rounded-2xl p-8 h-full relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg">
                      Popular
                    </span>
                  </div>
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Pro</h3>
                    <div className="text-5xl font-bold text-[var(--text-primary)]">$5</div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">per month</p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {['Unlimited purchases', 'Gmail auto-sync', 'Subscription tracking', 'Cases & follow-ups', 'Unlimited vault', 'Insurance packs', 'Priority support'].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-[var(--text-secondary)]">
                        <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-center font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                    Start free trial
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Page>
      </Section>

      {/* FAQ */}
      <Section spacing="normal" bg="subtle">
        <Page size="narrow">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                Questions?
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              { q: 'How does Gmail sync work?', a: 'Connect your Gmail account via OAuth (secure, we never see your password). We scan for order confirmation emails and extract purchase details using AI. You control which purchases to save.' },
              { q: 'Is my data secure?', a: 'Yes. All data is encrypted at rest and in transit. We never train AI on your personal data, and you can export or delete everything with one click.' },
              { q: 'What makes a purchase "Claim Ready"?', a: 'A purchase is claim-ready when it has: receipt/proof of purchase, merchant info, purchase date, price, and warranty period. Our Proof Score shows exactly what\'s missing.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely. No contracts, cancel anytime. Your data remains accessible and exportable even on the free plan.' },
            ].map((faq, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 50}>
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    <h3 className="font-semibold text-[var(--text-primary)] pr-4">{faq.q}</h3>
                    <svg
                      className={`w-5 h-5 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`accordion-content ${openFaq === i ? 'open' : ''}`}>
                    <div className="accordion-inner">
                      <p className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Page>
      </Section>

      {/* FINAL CTA */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#09090B]">
        {/* Gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-[80px]" />
        </div>

        <Page className="relative z-10">
          <ScrollReveal direction="up">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                Stop losing money on{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  forgotten protection
                </span>
              </h2>
              <p className="text-xl text-white/60 mb-10">
                Join thousands protecting their purchases with Cyncro.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-10 py-5 rounded-xl bg-white text-[#09090B] font-semibold text-lg shadow-2xl hover:scale-[1.02] transition-all"
              >
                Start free today
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </Page>
      </section>
    </>
  )
}
