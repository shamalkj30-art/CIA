'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CaseWithRelations, CaseType, CaseStatus, ActionPack, CaseEvent, MessageTone } from '@/lib/types'

// Tone configuration
const toneConfig: Record<MessageTone, { label: string; description: string }> = {
  friendly: { label: 'Friendly', description: 'Warm and understanding' },
  professional: { label: 'Professional', description: 'Balanced and business-like' },
  firm: { label: 'Firm', description: 'Assertive with clear deadlines' },
  concise: { label: 'Concise', description: 'Brief and to the point' },
}

// Case type display names and colors
const caseTypeConfig: Record<CaseType, { label: string; color: string; icon: string }> = {
  return: { label: 'Return', color: 'bg-blue-500', icon: '↩' },
  warranty: { label: 'Warranty', color: 'bg-purple-500', icon: '🛡' },
  complaint: { label: 'Complaint', color: 'bg-amber-500', icon: '!' },
  cancellation: { label: 'Cancel', color: 'bg-red-500', icon: '✕' },
}

// Status display names and colors
const statusConfig: Record<CaseStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  sent: { label: 'Sent', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  waiting: { label: 'Waiting', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  escalated: { label: 'Escalated', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  resolved: { label: 'Resolved', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  closed: { label: 'Closed', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    subject: '',
    description: '',
    merchant: '',
    merchant_email: '',
    merchant_phone: '',
    reference_number: '',
    status: '' as CaseStatus,
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Action pack state
  const [showActionPack, setShowActionPack] = useState(false)
  const [actionPack, setActionPack] = useState<ActionPack | null>(null)
  const [actionPackLoading, setActionPackLoading] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  // Add note state
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  // Tone selector state
  const [selectedTone, setSelectedTone] = useState<MessageTone>('professional')
  const [toneDropdownOpen, setToneDropdownOpen] = useState(false)

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await fetch(`/api/cases/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Case not found')
          } else {
            throw new Error('Failed to fetch case')
          }
          return
        }
        const data = await response.json()
        setCaseData(data)
        setEditForm({
          subject: data.subject,
          description: data.description || '',
          merchant: data.merchant,
          merchant_email: data.merchant_email || '',
          merchant_phone: data.merchant_phone || '',
          reference_number: data.reference_number || '',
          status: data.status,
        })
      } catch (err) {
        setError('Failed to load case')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCase()
  }, [id])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleUpdate = async () => {
    setUpdateLoading(true)
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update case')
      }

      const updated = await response.json()
      setCaseData(prev => prev ? { ...prev, ...updated } : null)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert('Failed to update case')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete case')
      }

      router.push('/cases')
    } catch (err) {
      console.error(err)
      alert('Failed to delete case')
    } finally {
      setDeleteLoading(false)
    }
  }

  const generateActionPack = async (messageType: 'initial' | 'follow_up' | 'escalation' = 'initial') => {
    setActionPackLoading(true)
    setShowActionPack(true)
    try {
      const response = await fetch(`/api/cases/${id}/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_type: messageType, tone: selectedTone }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate action pack')
      }

      const data = await response.json()
      setActionPack(data)
    } catch (err) {
      console.error(err)
      alert('Failed to generate action pack')
      setShowActionPack(false)
    } finally {
      setActionPackLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const addNote = async () => {
    if (!noteContent.trim()) return
    setNoteLoading(true)
    try {
      const response = await fetch(`/api/cases/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'note',
          content: noteContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const newEvent = await response.json()
      setCaseData(prev => prev ? {
        ...prev,
        events: [...(prev.events || []), newEvent],
      } : null)
      setNoteContent('')
      setShowAddNote(false)
    } catch (err) {
      console.error(err)
      alert('Failed to add note')
    } finally {
      setNoteLoading(false)
    }
  }

  const markAsSent = async () => {
    try {
      const response = await fetch(`/api/cases/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'message_sent',
          content: 'Marked message as sent',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as sent')
      }

      // Refresh case data
      const caseResponse = await fetch(`/api/cases/${id}`)
      if (caseResponse.ok) {
        const data = await caseResponse.json()
        setCaseData(data)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to mark as sent')
    }
  }

  const getEventIcon = (eventType: CaseEvent['event_type']) => {
    switch (eventType) {
      case 'created':
        return '📝'
      case 'message_sent':
        return '📤'
      case 'message_received':
        return '📥'
      case 'status_change':
        return '🔄'
      case 'escalation':
        return '⬆️'
      case 'follow_up_sent':
        return '🔔'
      case 'note':
        return '📌'
      case 'attachment_added':
        return '📎'
      case 'resolved':
        return '✅'
      default:
        return '•'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading case...</p>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{error || 'Case not found'}</h3>
        <Link href="/cases" className="btn btn-primary mt-4">
          Back to Cases
        </Link>
      </div>
    )
  }

  const typeConfig = caseTypeConfig[caseData.case_type]
  const statusCfg = statusConfig[caseData.status]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/cases"
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{caseData.subject}</h1>
          <p className="text-[var(--text-muted)] text-sm">
            {caseData.merchant} • {typeConfig.label} • Created {formatDate(caseData.created_at)}
          </p>
        </div>
        <span className={`badge ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details Card */}
          <div className="card">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Case Details</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CaseStatus })}
                      className="input"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="waiting">Waiting for response</option>
                      <option value="escalated">Escalated</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Merchant</label>
                    <input
                      type="text"
                      value={editForm.merchant}
                      onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Merchant Email</label>
                    <input
                      type="email"
                      value={editForm.merchant_email}
                      onChange={(e) => setEditForm({ ...editForm, merchant_email: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Reference Number</label>
                    <input
                      type="text"
                      value={editForm.reference_number}
                      onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
                      placeholder="Case/ticket number from merchant"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="input min-h-[100px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={updateLoading} className="btn btn-primary">
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${typeConfig.color} text-white flex items-center justify-center font-semibold text-lg flex-shrink-0`}>
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--text-primary)]">{caseData.subject}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{caseData.merchant}</p>
                    </div>
                  </div>

                  {caseData.description && (
                    <div className="pt-4 border-t border-[var(--border)]">
                      <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Description</h4>
                      <p className="text-[var(--text-primary)] whitespace-pre-wrap">{caseData.description}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Merchant Email</h4>
                      <p className="text-[var(--text-primary)]">{caseData.merchant_email || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Reference Number</h4>
                      <p className="text-[var(--text-primary)]">{caseData.reference_number || 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Follow-up Date</h4>
                      <p className="text-[var(--text-primary)]">{formatDate(caseData.follow_up_at)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-muted)] mb-1">Auto Follow-up</h4>
                      <p className="text-[var(--text-primary)]">{caseData.auto_follow_up ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Timeline</h2>
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Note
              </button>
            </div>
            <div className="p-6">
              {showAddNote && (
                <div className="mb-4 p-4 bg-[var(--surface-subtle)] rounded-xl">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note..."
                    className="input min-h-[80px] resize-none mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddNote(false)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button onClick={addNote} disabled={noteLoading} className="btn btn-primary btn-sm">
                      {noteLoading ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </div>
              )}

              {caseData.events && caseData.events.length > 0 ? (
                <div className="space-y-4">
                  {caseData.events.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-sm">
                          {getEventIcon(event.event_type)}
                        </div>
                        {index < caseData.events!.length - 1 && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-[var(--border)]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-[var(--text-primary)]">{event.content}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-center py-8">No events yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Tone Selector */}
              <div className="relative">
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Message Tone
                </label>
                <button
                  onClick={() => setToneDropdownOpen(!toneDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{toneConfig[selectedTone].label}</span>
                    <span className="text-[var(--text-muted)]">- {toneConfig[selectedTone].description}</span>
                  </div>
                  <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${toneDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {toneDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                    {(Object.keys(toneConfig) as MessageTone[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => {
                          setSelectedTone(tone)
                          setToneDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedTone === tone
                            ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <span className="font-medium">{toneConfig[tone].label}</span>
                        <span className="text-[var(--text-muted)] ml-1">- {toneConfig[tone].description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-3 space-y-2">
              <button
                onClick={() => generateActionPack('initial')}
                className="btn btn-primary w-full justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Action Pack
              </button>
              <button
                onClick={() => generateActionPack('follow_up')}
                className="btn btn-secondary w-full justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Follow-up Message
              </button>
              <button
                onClick={() => generateActionPack('escalation')}
                className="btn btn-secondary w-full justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Escalation Message
              </button>
              {caseData.status === 'draft' && (
                <button
                  onClick={markAsSent}
                  className="btn btn-secondary w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Sent
                </button>
              )}
              </div>
            </div>
          </div>

          {/* Related Items */}
          {(caseData.purchase || caseData.subscription) && (
            <div className="card">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text-primary)]">Related</h2>
              </div>
              <div className="p-4 space-y-3">
                {caseData.purchase && (
                  <Link
                    href={`/purchases/${caseData.purchase.id}`}
                    className="block p-3 bg-[var(--surface-subtle)] rounded-xl hover:bg-[var(--border)] transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {(caseData.purchase as { item_name?: string }).item_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Purchase</p>
                  </Link>
                )}
                {caseData.subscription && (
                  <Link
                    href={`/subscriptions/${caseData.subscription.id}`}
                    className="block p-3 bg-[var(--surface-subtle)] rounded-xl hover:bg-[var(--border)] transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {(caseData.subscription as { merchant?: string }).merchant}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Subscription</p>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="card border-red-200 dark:border-red-900/50">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50">
              <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            </div>
            <div className="p-4">
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Case
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Pack Modal */}
      {showActionPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowActionPack(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Action Pack</h2>
              <button
                onClick={() => setShowActionPack(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {actionPackLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                  <p className="text-[var(--text-muted)]">Generating your action pack...</p>
                </div>
              ) : actionPack ? (
                <div className="space-y-6">
                  {/* Steps */}
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">Steps to follow</h3>
                    <div className="space-y-3">
                      {actionPack.steps.map((step) => (
                        <div key={step.step_number} className="flex gap-3 p-3 bg-[var(--surface-subtle)] rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {step.step_number}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{step.title}</p>
                            <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
                            {step.deadline && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Deadline: {step.deadline}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Draft Message */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">Draft Message</h3>
                      <button
                        onClick={() => copyToClipboard(`${actionPack.draft_message.subject}\n\n${actionPack.draft_message.body}`)}
                        className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        {copiedMessage ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-[var(--surface-subtle)] rounded-xl p-4">
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                        Subject: {actionPack.draft_message.subject}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {actionPack.draft_message.body}
                      </p>
                    </div>
                  </div>

                  {/* Legal Info */}
                  {actionPack.legal_info && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                        Consumer Rights Info
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {actionPack.legal_info}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                    {caseData.merchant_email && (
                      <a
                        href={`mailto:${caseData.merchant_email}?subject=${encodeURIComponent(actionPack.draft_message.subject)}&body=${encodeURIComponent(actionPack.draft_message.body)}`}
                        className="btn btn-primary flex-1"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Open in Email
                      </a>
                    )}
                    <button onClick={() => setShowActionPack(false)} className="btn btn-secondary flex-1">
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
