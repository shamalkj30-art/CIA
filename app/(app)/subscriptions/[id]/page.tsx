'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SubscriptionWithAlerts, CancelKit } from '@/lib/types'

// Format relative time for "Last verified" display
function formatVerifiedTime(verifiedAt: string): string {
  const verified = new Date(verifiedAt)
  const now = new Date()
  const diffMs = now.getTime() - verified.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    return verified.toLocaleDateString()
  }
}

const cadenceLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

const confidenceLabels: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' },
  estimated: { label: 'Estimated', color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' },
  needs_confirmation: { label: 'Needs confirmation', color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' },
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionWithAlerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showCancelKit, setShowCancelKit] = useState(false)
  const [cancelKit, setCancelKit] = useState<CancelKit | null>(null)
  const [loadingCancelKit, setLoadingCancelKit] = useState(false)

  const [formData, setFormData] = useState({
    merchant: '',
    plan_name: '',
    price: '',
    currency: 'NOK',
    cadence: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    next_charge_date: '',
    renewal_confidence: 'estimated' as 'confirmed' | 'estimated' | 'needs_confirmation',
    status: 'active' as 'active' | 'paused' | 'cancelled' | 'expired',
    cancel_url: '',
    support_email: '',
    notes: '',
  })

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions/${id}`)
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
          setFormData({
            merchant: data.merchant || '',
            plan_name: data.plan_name || '',
            price: data.price?.toString() || '',
            currency: data.currency || 'NOK',
            cadence: data.cadence || 'monthly',
            next_charge_date: data.next_charge_date || '',
            renewal_confidence: data.renewal_confidence || 'estimated',
            status: data.status || 'active',
            cancel_url: data.cancel_url || '',
            support_email: data.support_email || '',
            notes: data.notes || '',
          })
        } else {
          router.push('/subscriptions')
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
        router.push('/subscriptions')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          next_charge_date: formData.next_charge_date || null,
          plan_name: formData.plan_name || null,
          cancel_url: formData.cancel_url || null,
          support_email: formData.support_email || null,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSubscription(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this subscription?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/subscriptions')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleting(false)
    }
  }

  const loadCancelKit = async () => {
    setLoadingCancelKit(true)
    try {
      const response = await fetch(`/api/subscriptions/${id}/cancel-kit`)
      if (response.ok) {
        const data = await response.json()
        setCancelKit(data)
        setShowCancelKit(true)
      }
    } catch (error) {
      console.error('Failed to load cancel kit:', error)
    } finally {
      setLoadingCancelKit(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const confidence = confidenceLabels[subscription.renewal_confidence] || confidenceLabels.estimated

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/subscriptions"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{subscription.merchant}</h1>
          {subscription.plan_name && (
            <p className="text-[var(--text-muted)]">{subscription.plan_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Billing Info Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Billing Information</h2>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Service Name</label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Plan</label>
                  <input
                    type="text"
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    className="input"
                    placeholder="e.g., Premium, Family"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">kr</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Billing Cycle</label>
                  <select
                    value={formData.cadence}
                    onChange={(e) => setFormData({ ...formData, cadence: e.target.value as typeof formData.cadence })}
                    className="input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Next Charge Date</label>
                  <input
                    type="date"
                    value={formData.next_charge_date}
                    onChange={(e) => setFormData({ ...formData, next_charge_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Date Confidence</label>
                  <select
                    value={formData.renewal_confidence}
                    onChange={(e) => setFormData({ ...formData, renewal_confidence: e.target.value as typeof formData.renewal_confidence })}
                    className="input"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="estimated">Estimated</option>
                    <option value="needs_confirmation">Needs confirmation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">Price</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {formatCurrency(subscription.price, subscription.currency)}
                  <span className="text-sm font-normal text-[var(--text-muted)] ml-1">
                    / {cadenceLabels[subscription.cadence]?.toLowerCase()}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  subscription.status === 'paused' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                }`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">Next Charge</p>
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {formatDate(subscription.next_charge_date)}
                </p>
                {subscription.days_until_charge !== null && subscription.status === 'active' && (
                  <p className="text-sm text-[var(--text-muted)]">
                    {subscription.days_until_charge === 0 ? 'Today' :
                     subscription.days_until_charge === 1 ? 'Tomorrow' :
                     `In ${subscription.days_until_charge} days`}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">Date Confidence</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${confidence.color}`}>
                  {confidence.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cancel/Contact Info Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Contact & Cancellation</h2>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Cancel URL</label>
                <input
                  type="url"
                  value={formData.cancel_url}
                  onChange={(e) => setFormData({ ...formData, cancel_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={formData.support_email}
                  onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                  className="input"
                  placeholder="support@..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px] resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {subscription.cancel_url && (
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">Cancel URL</p>
                  <a
                    href={subscription.cancel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline break-all"
                  >
                    {subscription.cancel_url}
                  </a>
                </div>
              )}
              {subscription.support_email && (
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">Support Email</p>
                  <a
                    href={`mailto:${subscription.support_email}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {subscription.support_email}
                  </a>
                </div>
              )}
              {subscription.notes && (
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">Notes</p>
                  <p className="text-[var(--text-primary)]">{subscription.notes}</p>
                </div>
              )}
              {!subscription.cancel_url && !subscription.support_email && !subscription.notes && (
                <p className="text-[var(--text-muted)] text-sm">No contact information added yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Cancel Kit Button */}
        {subscription.status === 'active' && !isEditing && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Need to Cancel?</h2>
                <p className="text-sm text-[var(--text-muted)]">Get step-by-step instructions and a draft message</p>
              </div>
              <button
                onClick={loadCancelKit}
                disabled={loadingCancelKit}
                className="btn btn-secondary"
              >
                {loadingCancelKit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Get Cancel Kit
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Kit Modal */}
      {showCancelKit && cancelKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelKit(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Cancel {subscription.merchant}
                </h2>
                <button
                  onClick={() => setShowCancelKit(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Verification Info */}
              <div className="flex items-center gap-3 mt-2">
                {cancelKit.confidence && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    cancelKit.confidence === 'high'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : cancelKit.confidence === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {cancelKit.confidence === 'high' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : cancelKit.confidence === 'medium' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
                      </svg>
                    )}
                    {cancelKit.confidence === 'high' ? 'Verified' : cancelKit.confidence === 'medium' ? 'AI Generated' : 'Low Confidence'}
                  </span>
                )}
                {cancelKit.source && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {cancelKit.source === 'cached' ? 'From cache' : cancelKit.source === 'web_search' ? 'Web search' : 'AI generated'}
                  </span>
                )}
                {cancelKit.verified_at && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Last verified: {formatVerifiedTime(cancelKit.verified_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Steps */}
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Cancellation Steps</h3>
                <div className="space-y-4">
                  {cancelKit.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold text-sm">
                        {step.step_number || index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-[var(--text-primary)]">{step.title}</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{step.description}</p>
                        {step.action_url && (
                          <a
                            href={step.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2"
                          >
                            Open link
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              {(cancelKit.merchant_contact.cancel_url || cancelKit.merchant_contact.email) && (
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quick Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {cancelKit.merchant_contact.cancel_url && (
                      <a
                        href={cancelKit.merchant_contact.cancel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Cancel Portal
                      </a>
                    )}
                    {cancelKit.merchant_contact.email && (
                      <a
                        href={`mailto:${cancelKit.merchant_contact.email}`}
                        className="btn btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Support
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Draft Message */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">Draft Cancellation Message</h3>
                  <button
                    onClick={() => copyToClipboard(cancelKit.draft_message)}
                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <div className="bg-[var(--surface-subtle)] rounded-xl p-4 text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono">
                  {cancelKit.draft_message}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
