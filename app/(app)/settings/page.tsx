import { createClient } from '@/lib/supabase/server'
import CopyButton from './CopyButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Simple forwarding email - just one address for everyone
  const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'your-domain.com'
  const forwardingEmail = `receipts@${emailDomain}`
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-[var(--muted)] mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Account Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-[var(--muted)]">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Email Forwarding */}
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-2">Email Forwarding</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Forward receipt emails to automatically add them to your account.
        </p>
        
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
          <label className="text-sm text-[var(--muted)] block mb-1">Forward receipts to</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-lg bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-3 rounded-lg">
              {forwardingEmail}
            </code>
            <CopyButton text={forwardingEmail} />
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20">
          <p className="text-sm">
            <strong>Important:</strong> Forward emails from <strong>{user?.email}</strong> — we identify your account by your sender email.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">How it works</h3>
          <ol className="text-sm text-[var(--muted)] space-y-2 list-decimal list-inside">
            <li>Forward any receipt email to <strong>{forwardingEmail}</strong></li>
            <li>We match the sender email to your account</li>
            <li>AI extracts purchase details automatically</li>
            <li>Purchase appears in your account</li>
          </ol>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="card">
        <h2 className="text-lg font-medium mb-4">Pro Tips</h2>
        <ul className="text-sm text-[var(--muted)] space-y-2">
          <li className="flex gap-2">
            <span className="text-[var(--primary)]">•</span>
            <span>Set up an email filter to auto-forward receipts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--primary)]">•</span>
            <span>Works with Amazon, Apple, and most online store receipts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--primary)]">•</span>
            <span>Attachments (images, PDFs) are also processed</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
