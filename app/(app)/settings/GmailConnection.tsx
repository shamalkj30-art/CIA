'use client'

import { useEffect, useState } from 'react'

interface ConnectionStatus {
  connected: boolean
  email_address?: string
  last_sync_at?: string
  sync_enabled?: boolean
}

export default function GmailConnection() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/gmail/sync')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/gmail/sync', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        await fetchStatus()
        if (result.synced > 0) {
          alert(`Successfully synced ${result.synced} new purchase(s)!`)
        } else {
          alert('No new orders found.')
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) return
    
    setDisconnecting(true)
    try {
      const response = await fetch('/api/gmail/disconnect', { method: 'POST' })
      if (response.ok) {
        setStatus({ connected: false })
      } else {
        alert('Failed to disconnect')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--surface-subtle)] rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-[var(--surface-subtle)] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Gmail Auto-Sync</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Automatically detect order confirmations from your Gmail
          </p>
        </div>
      </div>

      {status?.connected ? (
        /* Connected State */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--text-primary)]">Connected</p>
              <p className="text-sm text-[var(--text-muted)]">{status.email_address}</p>
            </div>
            {status.sync_enabled && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary)] text-white rounded-full">
                Active
              </span>
            )}
          </div>

          {status.last_sync_at && (
            <p className="text-sm text-[var(--text-muted)]">
              Last synced: {formatDate(status.last_sync_at)}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary flex-1"
            >
              {syncing ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="btn btn-secondary text-[var(--danger)]"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)]">•</span>
                We scan your inbox for order confirmation emails
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)]">•</span>
                AI extracts purchase details, warranty info, and return deadlines
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)]">•</span>
                Purchases are automatically added to your account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)]">•</span>
                We only read emails - never send or modify
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              What you'll get
            </h3>
            <ul className="space-y-3">
              {[
                { icon: '📦', title: 'Auto-detect orders', desc: 'Orders from Amazon, Zara, IKEA and 100+ stores' },
                { icon: '⏰', title: 'Return deadline alerts', desc: 'Never miss a return window again' },
                { icon: '🛡️', title: 'Warranty tracking', desc: 'Know exactly when warranties expire' },
                { icon: '🔒', title: 'Privacy first', desc: 'Read-only access, disconnect anytime' },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="/api/auth/google/connect"
            className="btn btn-primary w-full justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Gmail
          </a>

          <p className="text-xs text-center text-[var(--text-muted)]">
            By connecting, you agree to let Cyncro read your emails to detect purchases.
            <br />
            We never send emails or share your data.
          </p>
        </div>
      )}
    </div>
  )
}

