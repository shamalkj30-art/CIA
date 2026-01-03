import { createClient } from '@/lib/supabase/server'
import CopyButton from './CopyButton'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'your-domain.com'
  const forwardingEmail = `receipts@${emailDomain}`
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Settings</h1>
        <p className="text-[var(--muted-light)]">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="glass p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Account</h2>
              <p className="text-[var(--muted)]">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
              <p className="text-sm text-[var(--muted)] mb-1">Account ID</p>
              <p className="font-mono text-sm text-[var(--foreground)] truncate">{user?.id}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
              <p className="text-sm text-[var(--muted)] mb-1">Member Since</p>
              <p className="font-medium text-[var(--foreground)]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Forwarding */}
        <div className="glass p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Email Forwarding</h2>
              <p className="text-sm text-[var(--muted)]">
                Forward receipt emails to automatically add them to your account.
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] mb-4">
            <label className="text-sm text-[var(--muted)] block mb-2">Forward receipts to</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-lg bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-3 rounded-xl truncate">
                {forwardingEmail}
              </code>
              <CopyButton text={forwardingEmail} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 mb-6">
            <p className="text-sm text-[var(--foreground)]">
              <strong>Important:</strong> Forward emails from <span className="text-[var(--primary)]">{user?.email}</span> — we identify your account by your sender email.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">How it works</h3>
            <div className="space-y-3">
              {[
                { step: 1, text: `Forward any receipt email to ${forwardingEmail}` },
                { step: 2, text: 'We match the sender email to your account' },
                { step: 3, text: 'AI extracts purchase details automatically' },
                { step: 4, text: 'Purchase appears in your account' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                    {item.step}
                  </div>
                  <span className="text-sm text-[var(--muted-light)]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/upload"
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">Add Purchase</p>
                <p className="text-xs text-[var(--muted)]">Upload a new receipt</p>
              </div>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">Dashboard</p>
                <p className="text-xs text-[var(--muted)]">View your stats</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Pro Tips</h2>
          <div className="space-y-3">
            {[
              { icon: '⚡', text: 'Set up an email filter to auto-forward receipts' },
              { icon: '🛒', text: 'Works with Amazon, Apple, and most online store receipts' },
              { icon: '📎', text: 'Attachments (images, PDFs) are also processed' },
              { icon: '🤖', text: 'AI automatically extracts item details and warranty info' },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)]">
                <span className="text-xl">{tip.icon}</span>
                <span className="text-sm text-[var(--muted-light)]">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
