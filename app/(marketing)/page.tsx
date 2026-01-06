'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import Link from 'next/link'
import './landing.css'

export default function HomePage() {
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSecurityAccordion, setActiveSecurityAccordion] = useState<number | null>(null)
  const [activeFaqAccordion, setActiveFaqAccordion] = useState<number | null>(null)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState('')
  const [updates, setUpdates] = useState(false)

  // Intersection Observer for fade-up animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.fade-up').forEach(el => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Scroll listener for header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on body scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError(true)
      return
    }
    setEmailError(false)
    setFormSubmitted(true)
  }

  const openDemo = () => {
    alert('Demo video coming soon! For now, explore the features on this page.')
  }

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.querySelector(id)
    if (target) {
      const headerHeight = 80
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight
      window.scrollTo({ top: targetPosition, behavior: 'smooth' })
    }
    closeMobileMenu()
  }

  const securityAccordionItems = [
    { title: 'What Cyncro reads', content: "Purchase confirmations, invoices, and subscription signals—based on the integrations you enable. We don't scan personal emails, messages, or unrelated content." },
    { title: 'What Cyncro does not do', content: "Cyncro never initiates payments, changes your accounts, messages your contacts, or accesses data beyond what's needed for the features you use." },
    { title: 'How exports work', content: "You select items, you generate the pack, you share it. Cyncro doesn't automatically send your data anywhere—exports are always user-initiated." },
    { title: 'Access controls', content: 'Revoke access inside the app and via your provider settings at any time. When you disconnect, Cyncro stops accessing that source immediately.' }
  ]

  const faqItems = [
    { question: 'How does Cyncro detect subscriptions?', answer: 'It looks for recurring payment signals and subscription confirmations (based on what you connect), then suggests candidates for you to approve.' },
    { question: 'Can I use Cyncro without connecting anything?', answer: 'Yes. Manual mode supports subscriptions, receipts, and organization from day one.' },
    { question: 'What receipts can Cyncro extract?', answer: 'Order confirmations, invoices, and purchase emails. You can also upload receipts manually.' },
    { question: 'What if Cyncro mislabels something?', answer: 'You can edit categories, rename items, and add notes. The system improves as you correct it.' },
    { question: 'Can I export receipts for insurance or warranty claims?', answer: 'Yes—Vault helps you find and organize; Ledger adds one-click Claims Pack exports.' },
    { question: 'How do I revoke access?', answer: 'Disconnect inside the app and revoke permissions through your provider settings at any time.' }
  ]

  return (
    <div className="desert-noir">
      {/* Ambient Background */}
      <div className="ambient-bg" />

      {/* Header */}
      <header className={`header ${headerScrolled ? 'scrolled' : ''}`} id="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            Cyncro
          </Link>

          <nav className="nav">
            <ul className="nav-links">
              <li><a href="#features" className="nav-link" onClick={(e) => scrollToSection(e, '#features')}>Product</a></li>
              <li><a href="#how-it-works" className="nav-link" onClick={(e) => scrollToSection(e, '#how-it-works')}>How it works</a></li>
              <li><a href="#security" className="nav-link" onClick={(e) => scrollToSection(e, '#security')}>Security</a></li>
              <li><a href="#pricing" className="nav-link" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a></li>
              <li><a href="#faq" className="nav-link" onClick={(e) => scrollToSection(e, '#faq')}>FAQ</a></li>
            </ul>

            <div className="nav-buttons">
              <button className="btn btn-secondary" onClick={openDemo}>Watch 45s demo</button>
              <Link href="/signup" className="btn btn-primary">Get early access</Link>
            </div>
          </nav>

          <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-links">
          <li><a href="#features" onClick={(e) => scrollToSection(e, '#features')}>Product</a></li>
          <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, '#how-it-works')}>How it works</a></li>
          <li><a href="#security" onClick={(e) => scrollToSection(e, '#security')}>Security</a></li>
          <li><a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a></li>
          <li><a href="#faq" onClick={(e) => scrollToSection(e, '#faq')}>FAQ</a></li>
        </ul>
        <div className="mobile-menu-footer">
          <p>Privacy-first. Manual mode always available.</p>
          <div className="mobile-menu-buttons">
            <button className="btn btn-secondary" onClick={openDemo}>Watch 45s demo</button>
            <Link href="/signup" className="btn btn-primary" onClick={closeMobileMenu}>Get early access</Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-headline fade-up">Subscriptions and receipts—organized automatically.</h1>
            <p className="hero-subheadline fade-up stagger-1">Cyncro is a smart expense hub that detects subscriptions, saves receipts from your inbox, and keeps every important purchase instantly retrievable—so warranties, claims, and refunds take minutes, not hours.</p>

            <div className="hero-ctas fade-up stagger-2">
              <Link href="/signup" className="btn btn-primary btn-lg">Get early access</Link>
              <button className="btn btn-secondary btn-lg" onClick={openDemo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Watch 45s demo
              </button>
            </div>

            <div className="hero-trust fade-up stagger-3">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>You choose what to connect. Use manual mode anytime. Revoke access whenever you want.</span>
            </div>
          </div>

          <div className="hero-preview fade-up stagger-2">
            <div className="preview-container">
              {/* Active Subscriptions Card */}
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-card-title">Active subscriptions</span>
                  <span className="preview-badge">Detected renewals</span>
                </div>
                <div className="subscription-chips">
                  <div className="sub-chip">
                    <div className="sub-chip-icon">N</div>
                    <span>Netflix</span>
                    <span className="sub-chip-amount">$15.99</span>
                  </div>
                  <div className="sub-chip">
                    <div className="sub-chip-icon">S</div>
                    <span>Spotify</span>
                    <span className="sub-chip-amount">$10.99</span>
                  </div>
                  <div className="sub-chip">
                    <div className="sub-chip-icon">A</div>
                    <span>Adobe CC</span>
                    <span className="sub-chip-amount">$54.99</span>
                  </div>
                  <div className="sub-chip">
                    <div className="sub-chip-icon">G</div>
                    <span>Gym</span>
                    <span className="sub-chip-amount">$29.00</span>
                  </div>
                </div>
                <div className="sub-total">
                  <span className="sub-total-label">Monthly total</span>
                  <span className="sub-total-amount">$110.97</span>
                </div>
              </div>

              {/* Receipt Vault Card */}
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-card-title">Receipt Vault</span>
                  <span className="preview-badge green">Receipt verified</span>
                </div>
                <div className="receipt-grid">
                  <div className="receipt-item">
                    <span className="receipt-item-icon">📱</span>
                    <span>iPhone 15</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-item-icon">💻</span>
                    <span>MacBook</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-item-icon">🎧</span>
                    <span>AirPods</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-item-icon">📺</span>
                    <span>LG TV</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-item-icon">🧊</span>
                    <span>Fridge</span>
                  </div>
                  <div className="receipt-item">
                    <span className="receipt-item-icon">🛋️</span>
                    <span>Sofa</span>
                  </div>
                </div>
              </div>

              {/* Claims Pack Card */}
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-card-title">Claims Pack</span>
                  <span className="preview-badge green">Export ready</span>
                </div>
                <div className="claims-list">
                  <div className="claims-item">
                    <div className="claims-check">
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Purchase receipt</span>
                  </div>
                  <div className="claims-item">
                    <div className="claims-check">
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Warranty document</span>
                  </div>
                  <div className="claims-item">
                    <div className="claims-check">
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Serial number</span>
                  </div>
                </div>
                <button className="claims-export-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Export Claims Pack
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Strip */}
      <section className="problem-strip section">
        <div className="container">
          <h2 className="problem-title fade-up">Money leaks quietly. Proof disappears faster.</h2>

          <div className="problem-list">
            <div className="problem-item fade-up stagger-1">
              <div className="problem-bullet"></div>
              <p>Subscriptions pile up—then you forget what you're paying for.</p>
            </div>
            <div className="problem-item fade-up stagger-2">
              <div className="problem-bullet"></div>
              <p>Receipts vanish into email threads, apps, and old order confirmations.</p>
            </div>
            <div className="problem-item fade-up stagger-3">
              <div className="problem-bullet"></div>
              <p>When warranty or insurance asks for documentation, you start digging.</p>
            </div>
          </div>

          <p className="problem-closing fade-up stagger-4">Cyncro turns the mess into a clean system—without turning you into an accountant.</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features section-lg" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Everything you need to stay in control—without the busywork.</h2>
          </div>

          <div className="feature-grid">
            {/* Feature 1: Subscription Radar */}
            <div className="feature-card fade-up stagger-1">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="feature-title">Subscription Radar</h3>
              <p className="feature-desc">Detect recurring payments and keep renewals visible.</p>
              <ul className="feature-bullets">
                <li>Renewal dates and monthly total</li>
                <li>Duplicate subscriptions flagged</li>
                <li>Price changes highlighted</li>
              </ul>
            </div>

            {/* Feature 2: Receipt Vault */}
            <div className="feature-card fade-up stagger-2">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3 className="feature-title">Receipt Vault</h3>
              <p className="feature-desc">Receipts from order confirmations, invoices, and purchase emails—automatically stored.</p>
              <ul className="feature-bullets">
                <li>Search by store, date, amount</li>
                <li>Category tags and notes</li>
                <li>Attach photos for offline receipts</li>
              </ul>
            </div>

            {/* Feature 3: Warranty-Ready Library */}
            <div className="feature-card fade-up stagger-3">
              <div className="feature-icon green">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="feature-title">Warranty-Ready Library</h3>
              <p className="feature-desc">Keep high-value purchases easy to retrieve when it matters.</p>
              <ul className="feature-bullets">
                <li>Mac, phone, TV, appliances, more</li>
                <li>Add warranty details and serial fields</li>
                <li>"Found it instantly" retrieval flow</li>
              </ul>
            </div>

            {/* Feature 4: Claims Pack Export */}
            <div className="feature-card fade-up stagger-4">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <h3 className="feature-title">Claims Pack Export</h3>
              <p className="feature-desc">Generate clean documentation when insurance asks for proof.</p>
              <ul className="feature-bullets">
                <li>Select timeframe + category</li>
                <li>Export receipts + summary overview</li>
                <li>Share-ready format</li>
              </ul>
            </div>

            {/* Feature 5: Manual Control */}
            <div className="feature-card fade-up stagger-5">
              <div className="feature-icon green">
                <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3 className="feature-title">Manual Control</h3>
              <p className="feature-desc">Full value even without integrations.</p>
              <ul className="feature-bullets">
                <li>Add subscriptions manually</li>
                <li>Upload receipts anytime</li>
                <li>Edit categories and labels</li>
              </ul>
            </div>

            {/* Feature 6: Cyncro Intelligence */}
            <div className="feature-card fade-up stagger-6">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3 className="feature-title">Cyncro Intelligence</h3>
              <p className="feature-desc">Ask questions in plain language and get actionable answers.</p>
              <ul className="feature-bullets">
                <li>"Show subscriptions above $15/month"</li>
                <li>"Find my iPhone receipt"</li>
                <li>"List purchases over $500 this year"</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works section-lg" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Set it up in minutes. Benefit for years.</h2>
          </div>

          <div className="steps-grid">
            <div className="step fade-up stagger-1">
              <div className="step-number">1</div>
              <h3 className="step-title">Connect</h3>
              <p className="step-desc">Connect email and/or transactions to detect subscriptions and receipts automatically.</p>
              <span className="step-optional">Optional</span>
            </div>

            <div className="step fade-up stagger-2">
              <div className="step-number">2</div>
              <h3 className="step-title">Review</h3>
              <p className="step-desc">Cyncro suggests what it found. You approve, edit, or ignore.</p>
            </div>

            <div className="step fade-up stagger-3">
              <div className="step-number">3</div>
              <h3 className="step-title">Organize</h3>
              <p className="step-desc">Subscriptions and receipts become a searchable library—clean, categorized, and ready.</p>
            </div>

            <div className="step fade-up stagger-4">
              <div className="step-number">4</div>
              <h3 className="step-title">Use</h3>
              <p className="step-desc">Export documentation, find warranties fast, and stay ahead of renewals.</p>
            </div>
          </div>

          <p className="steps-microcopy fade-up">Manual mode works end-to-end. Connections are optional.</p>
        </div>
      </section>

      {/* Security Section */}
      <section className="security section-lg" id="security">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Built for privacy. Designed for control.</h2>
          </div>

          <div className="security-columns">
            <div className="security-col fade-up stagger-1">
              <div className="security-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </div>
              <h3 className="security-col-title">You choose what connects</h3>
              <p className="security-col-desc">Email, transactions, both, or neither. Manual mode is always available.</p>
            </div>

            <div className="security-col fade-up stagger-2">
              <div className="security-icon">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="security-col-title">Data minimization</h3>
              <p className="security-col-desc">Cyncro extracts only what's needed for the features you enable—nothing else.</p>
            </div>

            <div className="security-col fade-up stagger-3">
              <div className="security-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h3 className="security-col-title">Revoke anytime</h3>
              <p className="security-col-desc">Disconnect, delete, and remove access whenever you want.</p>
            </div>
          </div>

          <div className="accordion fade-up">
            {securityAccordionItems.map((item, index) => (
              <div key={index} className={`accordion-item ${activeSecurityAccordion === index ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => setActiveSecurityAccordion(activeSecurityAccordion === index ? null : index)}>
                  <span>{item.title}</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div className="accordion-content">
                  <div className="accordion-body">{item.content}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="security-note fade-up">Designed with privacy-first principles. Formal audits are on our roadmap.</p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases section-lg">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Made for real life—not spreadsheets.</h2>
          </div>

          <div className="use-cases-grid">
            <div className="use-case-card fade-up stagger-1">
              <div className="use-case-icon">👤</div>
              <h3 className="use-case-title">Individuals</h3>
              <p className="use-case-desc">Know what you pay for. Find receipts instantly. Keep purchases warranty-ready.</p>
            </div>

            <div className="use-case-card fade-up stagger-2">
              <div className="use-case-icon">👨‍👩‍👧‍👦</div>
              <h3 className="use-case-title">Families</h3>
              <p className="use-case-desc">Shared subscriptions and shared proof of purchase—without chaos.</p>
            </div>

            <div className="use-case-card fade-up stagger-3">
              <div className="use-case-icon">💼</div>
              <h3 className="use-case-title">Busy professionals</h3>
              <p className="use-case-desc">Claims and warranty documentation in minutes, not an evening of inbox searching.</p>
            </div>
          </div>

          <p className="use-cases-closing fade-up">Less digging. More certainty.</p>
        </div>
      </section>

      {/* Cyncro Intelligence */}
      <section className="intelligence section-lg">
        <div className="container">
          <div className="intelligence-content">
            <div className="intelligence-text">
              <h2 className="section-title fade-up">Smart help—without the noise.</h2>
              <p className="intelligence-subtitle fade-up stagger-1">Cyncro Intelligence turns your organized data into answers you can use. Ask, filter, export, and move on.</p>

              <div className="prompt-chips fade-up stagger-2">
                <div className="prompt-chip">
                  <div className="prompt-chip-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <span>"Show subscriptions I haven't used recently."</span>
                </div>
                <div className="prompt-chip">
                  <div className="prompt-chip-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <span>"Find my Apple purchase receipts."</span>
                </div>
                <div className="prompt-chip">
                  <div className="prompt-chip-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <span>"Export receipts for my travel claim."</span>
                </div>
                <div className="prompt-chip">
                  <div className="prompt-chip-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <span>"List purchases over $500 this year."</span>
                </div>
              </div>
            </div>

            <div className="intelligence-preview fade-up stagger-3">
              <div className="intel-panel-header">
                <div className="intel-panel-dot"></div>
                <span className="intel-panel-title">Cyncro Intelligence</span>
              </div>
              <div className="intel-panel-body">
                <div className="intel-query">
                  <div className="intel-query-avatar"></div>
                  <div className="intel-query-text">Show subscriptions above $15/month</div>
                </div>
                <div className="intel-response">
                  <p className="intel-response-text">Found 3 subscriptions above $15/month:</p>
                  <div className="intel-result-list">
                    <div className="intel-result-item">
                      <span className="intel-result-name">Adobe Creative Cloud</span>
                      <span className="intel-result-amount">$54.99</span>
                    </div>
                    <div className="intel-result-item">
                      <span className="intel-result-name">Gym Membership</span>
                      <span className="intel-result-amount">$29.00</span>
                    </div>
                    <div className="intel-result-item">
                      <span className="intel-result-name">Netflix Premium</span>
                      <span className="intel-result-amount">$22.99</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof section">
        <div className="container">
          <div className="social-proof-badge fade-up">
            <h3>Early access is limited.</h3>
            <p>We're onboarding in small waves to keep quality high and feedback tight.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing section-lg" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Choose the level of clarity you want.</h2>
            <p className="section-subtitle fade-up stagger-1">Start free. Upgrade when you want automation, exports, and deeper organization.</p>
          </div>

          <div className="billing-toggle fade-up stagger-2">
            <span className={`billing-option ${!billingAnnual ? 'active' : ''}`}>Monthly</span>
            <button className={`billing-switch ${billingAnnual ? 'annual' : ''}`} aria-label="Toggle billing period" onClick={() => setBillingAnnual(!billingAnnual)}></button>
            <span className={`billing-option ${billingAnnual ? 'active' : ''}`}>Annual<span className="billing-save">Save 20%</span></span>
          </div>

          <div className="pricing-grid">
            {/* Signal - Free */}
            <div className="pricing-card fade-up stagger-1">
              <h3 className="pricing-name">Signal</h3>
              <p className="pricing-tagline">Clean basics. Full control.</p>
              <div className="pricing-price">
                <span className="pricing-amount">Free</span>
              </div>

              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Manual subscription tracking</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Manual receipt uploads + basic tagging</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Basic search (merchant, date, amount)</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>High-value purchase library (limited)</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Single-device sync</span>
                </li>
              </ul>

              <ul className="pricing-limits">
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>Limited receipt storage</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>No email extraction</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>No claims export</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>No Cyncro Intelligence</span>
                </li>
              </ul>

              <Link href="/signup" className="btn btn-secondary pricing-cta">Get started free</Link>
              <p className="pricing-micro">No card required.</p>
            </div>

            {/* Vault - Most chosen */}
            <div className="pricing-card featured fade-up stagger-2">
              <span className="pricing-popular">Most chosen</span>
              <h3 className="pricing-name">Vault</h3>
              <p className="pricing-tagline">Automation that keeps everything retrievable.</p>
              <div className="pricing-price">
                <span className="pricing-amount">{billingAnnual ? '$9' : '$11'}</span>
                <span className="pricing-period">/ month</span>
              </div>

              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Everything in Signal, plus:</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Email receipt extraction</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Subscription detection</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Price-change + renewal alerts</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Unlimited high-value library</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Advanced search filters</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Multi-device sync</span>
                </li>
              </ul>

              <Link href="/signup" className="btn btn-primary pricing-cta">Unlock Vault</Link>
              <p className="pricing-micro">Try it. Cancel anytime.</p>
            </div>

            {/* Ledger */}
            <div className="pricing-card fade-up stagger-3">
              <h3 className="pricing-name">Ledger</h3>
              <p className="pricing-tagline">Built for documentation, claims, and households.</p>
              <div className="pricing-price">
                <span className="pricing-amount">{billingAnnual ? '$17' : '$21'}</span>
                <span className="pricing-period">/ month</span>
              </div>

              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Everything in Vault, plus:</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Claims Pack Export</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Family space (shared vault)</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Rules + folders (auto-organize)</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Priority support</span>
                </li>
              </ul>

              <Link href="/signup" className="btn btn-secondary pricing-cta">Get Ledger access</Link>
              <p className="pricing-micro">Best for families and frequent purchases.</p>
            </div>
          </div>

          <div className="pricing-faq fade-up">
            <h4 className="pricing-faq-title">Quick answers</h4>
            <div className="pricing-faq-grid">
              <div className="pricing-faq-item">
                <p className="pricing-faq-q">Can I switch plans?</p>
                <p className="pricing-faq-a">Yes—upgrade or downgrade anytime.</p>
              </div>
              <div className="pricing-faq-item">
                <p className="pricing-faq-q">Do I need to connect email/transactions?</p>
                <p className="pricing-faq-a">No—manual mode works on every plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq section-lg" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title fade-up">Frequently asked questions</h2>
          </div>

          <div className="accordion fade-up">
            {faqItems.map((item, index) => (
              <div key={index} className={`accordion-item ${activeFaqAccordion === index ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => setActiveFaqAccordion(activeFaqAccordion === index ? null : index)}>
                  <span>{item.question}</span>
                  <svg className="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div className="accordion-content">
                  <div className="accordion-body">{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta section-lg" id="signup">
        <div className="container">
          <h2 className="final-cta-headline fade-up">Stop paying blindly. Stop searching endlessly.</h2>
          <p className="final-cta-sub fade-up stagger-1">Cyncro keeps subscriptions visible and receipts retrievable—so you're ready for warranties, claims, and real-life surprises.</p>

          {!formSubmitted ? (
            <div className="waitlist-form fade-up stagger-2" id="waitlistForm">
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="you@domain.com"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false) }}
                  />
                  {emailError && <p className="form-error">Please enter a valid email address.</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal">Primary goal</label>
                  <select
                    id="goal"
                    className="form-select"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="" disabled>Select your main use case</option>
                    <option value="subscriptions">Track subscriptions</option>
                    <option value="receipts">Save receipts automatically</option>
                    <option value="claims">Claims &amp; warranties</option>
                    <option value="family">Family organization</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      id="updates"
                      checked={updates}
                      onChange={(e) => setUpdates(e.target.checked)}
                    />
                    <span className="form-checkbox-label">Send me product updates (rare and useful).</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-lg form-submit">Request early access</button>
              </form>
              <p className="form-micro">Takes 30 seconds. No spam.</p>
            </div>
          ) : (
            <div className="waitlist-form fade-up stagger-2">
              <div className="form-success">
                <div className="form-success-icon">
                  <svg viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="form-success-title">You're on the list.</h3>
                <p className="form-success-text">We'll reach out when your access is ready.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-links">
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
            <a href="#security" className="footer-link" onClick={(e) => scrollToSection(e, '#security')}>Security</a>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
          <p className="footer-copy">© 2026 Cyncro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
