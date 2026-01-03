import { createClient } from '@/lib/supabase/server'
import CopyButton from './CopyButton'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'your-domain.com'
  const forwardingEmail = `receipts@${emailDomain}`
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)]">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account</h2>
              <p className="text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Account ID</p>
              <p className="font-mono text-sm text-[var(--text-primary)] truncate">{user?.id}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Member Since</p>
              <p className="font-medium text-[var(--text-primary)]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Forwarding */}
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Email Forwarding</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Forward receipt emails to automatically add them to your account.
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] mb-4">
            <label className="text-sm text-[var(--text-muted)] block mb-2">Forward receipts to</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-base bg-[var(--primary-soft)] text-[var(--primary)] px-4 py-3 rounded-lg truncate">
                {forwardingEmail}
              </code>
              <CopyButton text={forwardingEmail} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning)]/20 mb-6">
            <p className="text-sm text-[var(--text-primary)]">
              <strong>Important:</strong> Forward emails from <span className="text-[var(--primary)] font-medium">{user?.email}</span> — we identify your account by your sender email.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">How it works</h3>
            <div className="space-y-3">
              {[
                { step: 1, text: `Forward any receipt email to ${forwardingEmail}` },
                { step: 2, text: 'We match the sender email to your account' },
                { step: 3, text: 'AI extracts purchase details automatically' },
                { step: 4, text: 'Purchase appears in your account' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                    {item.step}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[var(--text-primary)]">Dashboard</span>
            </Link>
            <Link href="/purchases" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[var(--text-primary)]">All Purchases</span>
            </Link>
            <Link href="/upload" className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-[var(--text-primary)]">Upload Receipt</span>
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Support</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Need help? Contact us at{' '}
            <a href="mailto:support@cyncro.app" className="text-[var(--primary)] hover:underline">
              support@cyncro.app
            </a>
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
