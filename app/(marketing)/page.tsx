'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="animated-bg">
        <div 
          className="orb orb-1"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        <div 
          className="orb orb-2"
          style={{
            transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
          }}
        />
        <div 
          className="orb orb-3"
          style={{
            transform: `translate(${mousePosition.x * 0.01 - 50}%, ${mousePosition.y * 0.01 - 50}%)`,
          }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-xl bg-[var(--background)]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-lg glow-primary">
                  <span className="text-white font-bold text-lg">C</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <span className="text-xl font-bold text-[var(--foreground)]">Cyncro</span>
              </div>

              {/* Nav */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link 
                  href="/login" 
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup" 
                  className="btn btn-primary"
                >
                  Get Started
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 md:pt-32 lg:pt-40 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
                </span>
                <span className="text-sm font-medium text-[var(--foreground-secondary)]">Your warranty guardian is here</span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <span className="text-[var(--foreground)]">Never lose a</span>
                <br />
                <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--tertiary)] to-[var(--accent)] bg-clip-text text-transparent">warranty</span>
                <span className="text-[var(--foreground)]"> again</span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-in-up text-lg sm:text-xl text-[var(--muted-light)] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '0.2s', opacity: 0 }}>
                Upload your receipts, track warranty expiration dates, and generate claim packets instantly. 
                <span className="text-[var(--foreground)]"> AI-powered warranty management that saves you money.</span>
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <Link 
                  href="/signup" 
                  className="w-full sm:w-auto btn btn-primary px-8 py-4 text-base"
                >
                  Start for free
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link 
                  href="#features" 
                  className="w-full sm:w-auto btn btn-secondary px-8 py-4 text-base"
                >
                  See how it works
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="animate-fade-in-up mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--muted)]" style={{ animationDelay: '0.4s', opacity: 0 }}>
                {['Free to use', 'No credit card required', 'AI-powered'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Preview */}
            <div className="animate-fade-in-up mt-16 md:mt-24 relative" style={{ animationDelay: '0.5s', opacity: 0 }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative mx-auto max-w-5xl">
                <div className="glass-static rounded-2xl shadow-2xl overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[var(--background-secondary)] border-b border-[var(--border)]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[var(--error)]" />
                      <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
                      <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="glass rounded-lg px-4 py-1.5 text-sm text-[var(--muted)] font-mono max-w-xs mx-auto">
                        cyncro.app/dashboard
                      </div>
                    </div>
                  </div>
                  {/* App Preview */}
                  <div className="p-6 md:p-8 bg-[var(--background-secondary)]">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: 'Items Tracked', value: '47', icon: '📦' },
                        { label: 'Protected Value', value: '$12,450', icon: '💰' },
                        { label: 'Expiring Soon', value: '3', icon: '⚠️' },
                      ].map((stat, i) => (
                        <div key={i} className="glass rounded-xl p-4 text-center">
                          <div className="text-2xl mb-1">{stat.icon}</div>
                          <div className="text-xl font-bold text-[var(--foreground)]">{stat.value}</div>
                          <div className="text-xs text-[var(--muted)]">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Purchases</h3>
                        <p className="text-[var(--muted)] text-sm">3 items need attention</p>
                      </div>
                      <div className="btn btn-primary text-sm py-2">
                        + Add Purchase
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'MacBook Pro 14"', merchant: 'Apple Store', warranty: '12mo left', status: 'success', category: 'Electronics' },
                        { name: 'Sony WH-1000XM5', merchant: 'Best Buy', warranty: '8mo left', status: 'success', category: 'Audio' },
                        { name: 'LG OLED TV 55"', merchant: 'Amazon', warranty: '23d left', status: 'warning', category: 'Electronics' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 glass rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center">
                              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                              <p className="text-sm text-[var(--muted)]">{item.merchant} • {item.category}</p>
                            </div>
                          </div>
                          <span className={`badge ${item.status === 'warning' ? 'badge-warning' : 'badge-success'}`}>
                            {item.warranty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--foreground)]">
                Everything you need to protect your purchases
              </h2>
              <p className="text-lg text-[var(--muted-light)]">
                Powerful AI-driven tools to never miss a warranty claim again.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: 'AI Receipt Scanning',
                  description: 'Upload receipts and our AI instantly extracts item details, purchase date, and warranty info.',
                  gradient: 'from-violet-500 to-purple-600',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Smart Tracking',
                  description: 'Visual dashboard shows warranty status at a glance. Get alerts before warranties expire.',
                  gradient: 'from-cyan-500 to-blue-600',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Claim Packets',
                  description: 'Generate professional PDF packets with all documentation ready for warranty claims.',
                  gradient: 'from-pink-500 to-rose-600',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Email Forwarding',
                  description: 'Forward receipt emails directly to Cyncro. We auto-create purchase records for you.',
                  gradient: 'from-orange-500 to-amber-600',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  ),
                  title: 'Categories & Tags',
                  description: 'Organize purchases with categories. Filter by Electronics, Appliances, and more.',
                  gradient: 'from-emerald-500 to-teal-600',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: 'Secure & Private',
                  description: 'Your data is encrypted and stored securely. You control who sees your information.',
                  gradient: 'from-red-500 to-pink-600',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group glass stat-card p-8 hover:glow-primary"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--muted-light)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--primary)]/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--foreground)]">
                Get started in 3 simple steps
              </h2>
              <p className="text-lg text-[var(--muted-light)]">
                From receipt to warranty claim in minutes, not hours.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  step: '01',
                  title: 'Upload your receipt',
                  description: 'Take a photo or forward an email. Our AI does the rest.',
                  icon: '📤',
                },
                {
                  step: '02',
                  title: 'AI extracts details',
                  description: 'Item name, merchant, date, and warranty period - all automatic.',
                  icon: '🤖',
                },
                {
                  step: '03',
                  title: 'Generate claim packet',
                  description: 'One click creates a professional PDF ready for any claim.',
                  icon: '📋',
                },
              ].map((item, i) => (
                <div key={i} className="relative text-center">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <div className="text-sm font-bold text-[var(--primary)] mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
                  <p className="text-[var(--muted-light)]">{item.description}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 right-0 translate-x-1/2">
                      <svg className="w-8 h-8 text-[var(--border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials/Stats */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { value: '10K+', label: 'Receipts Processed' },
                { value: '$2M+', label: 'Warranties Protected' },
                { value: '500+', label: 'Successful Claims' },
                { value: '4.9★', label: 'User Rating' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[var(--muted)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-static p-12 md:p-16 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10" />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--foreground)]">
                  Ready to protect your purchases?
                </h2>
                <p className="text-lg text-[var(--muted-light)] mb-10 max-w-2xl mx-auto">
                  Join thousands of smart shoppers who never lose money on expired warranties. Start free today.
                </p>
                <Link 
                  href="/signup" 
                  className="btn btn-primary px-10 py-4 text-lg"
                >
                  Get started for free
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-lg font-semibold text-[var(--foreground)]">Cyncro</span>
              </div>
              <p className="text-sm text-[var(--muted)]">
                &copy; {new Date().getFullYear()} Cyncro. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
