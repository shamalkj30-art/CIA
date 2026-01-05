'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'
import { ProofScoreBadge } from '@/components/app'
import { EvidencePanel } from '@/components/app/EvidencePanel'
import { QuickFixModal } from '@/components/app/QuickFixModal'

type InboxTab = 'inbox' | 'all' | 'action' | 'archive'

interface QuickFixData {
  purchase: PurchaseWithDocuments
  field: 'merchant' | 'price' | 'item_name' | 'purchase_date'
}

export default function InboxPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<InboxTab>('inbox')
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithDocuments | null>(null)
  const [showEvidencePanel, setShowEvidencePanel] = useState(true)
  const [quickFix, setQuickFix] = useState<QuickFixData | null>(null)

  // Fetch purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/purchases')
        if (response.ok) {
          const data = await response.json()
          setPurchases(data)
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  // Filter purchases by tab
  const filteredPurchases = purchases.filter(p => {
    switch (activeTab) {
      case 'inbox':
        return p.auto_detected && p.needs_review
      case 'action':
        const hasLowConfidence = p.email_metadata?.confidence === 'low'
        const missingData = !p.merchant || !p.price
        const isExpiring = p.warranty_expires_at &&
          new Date(p.warranty_expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
        return hasLowConfidence || missingData || isExpiring
      case 'archive':
        return !p.needs_review && !p.auto_detected
      case 'all':
      default:
        return true
    }
  })

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quickFix) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const currentIndex = selectedPurchase
        ? filteredPurchases.findIndex(p => p.id === selectedPurchase.id)
        : -1

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          if (currentIndex < filteredPurchases.length - 1) {
            setSelectedPurchase(filteredPurchases[currentIndex + 1])
          } else if (currentIndex === -1 && filteredPurchases.length > 0) {
            setSelectedPurchase(filteredPurchases[0])
          }
          break
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          if (currentIndex > 0) {
            setSelectedPurchase(filteredPurchases[currentIndex - 1])
          }
          break
        case 'e':
          e.preventDefault()
          setShowEvidencePanel(!showEvidencePanel)
          break
        case 'Enter':
          if (selectedPurchase) {
            window.location.href = `/purchases/${selectedPurchase.id}`
          }
          break
        case '1':
          setActiveTab('inbox')
          break
        case '2':
          setActiveTab('all')
          break
        case '3':
          setActiveTab('action')
          break
        case '4':
          setActiveTab('archive')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedPurchase, filteredPurchases, showEvidencePanel, quickFix])

  const handleVerify = async (purchaseId: string) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs_review: false }),
      })
      if (response.ok) {
        setPurchases(prev => prev.map(p =>
          p.id === purchaseId ? { ...p, needs_review: false } : p
        ))
      }
    } catch (error) {
      console.error('Failed to verify:', error)
    }
  }

  const handleDismiss = async (purchaseId: string) => {
    if (!confirm('Dismiss this purchase? It will be deleted.')) return
    try {
      await fetch(`/api/purchases/${purchaseId}`, { method: 'DELETE' })
      setPurchases(prev => prev.filter(p => p.id !== purchaseId))
      if (selectedPurchase?.id === purchaseId) {
        setSelectedPurchase(null)
      }
    } catch (error) {
      console.error('Failed to dismiss:', error)
    }
  }

  const handleQuickFix = (purchase: PurchaseWithDocuments, field: QuickFixData['field']) => {
    setQuickFix({ purchase, field })
  }

  const handleQuickFixSave = async (purchaseId: string, field: string, value: string | number) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (response.ok) {
        const updated = await response.json()
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, ...updated } : p))
        if (selectedPurchase?.id === purchaseId) {
          setSelectedPurchase(prev => prev ? { ...prev, ...updated } : null)
        }
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
    setQuickFix(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const tabCounts = {
    inbox: purchases.filter(p => p.auto_detected && p.needs_review).length,
    all: purchases.length,
    action: purchases.filter(p => {
      const hasLowConfidence = p.email_metadata?.confidence === 'low'
      const missingData = !p.merchant || !p.price
      return hasLowConfidence || missingData
    }).length,
    archive: purchases.filter(p => !p.needs_review && !p.auto_detected).length,
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inbox</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Review and verify auto-detected purchases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn btn-ghost text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Gmail
          </Link>
          <Link href="/upload" className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
        {[
          { id: 'inbox' as InboxTab, label: 'Inbox', shortcut: '1' },
          { id: 'all' as InboxTab, label: 'All', shortcut: '2' },
          { id: 'action' as InboxTab, label: 'Action Needed', shortcut: '3' },
          { id: 'archive' as InboxTab, label: 'Archive', shortcut: '4' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card)]'
            }`}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : tab.id === 'inbox' || tab.id === 'action'
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)]'
              }`}>
                {tabCounts[tab.id]}
              </span>
            )}
            <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] rounded ${
              activeTab === tab.id
                ? 'bg-white/20'
                : 'bg-[var(--surface-subtle)]'
            }`}>
              {tab.shortcut}
            </kbd>
          </button>
        ))}

        <div className="flex-1" />

        {/* Evidence Panel Toggle */}
        <button
          onClick={() => setShowEvidencePanel(!showEvidencePanel)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            showEvidencePanel
              ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--card)]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Evidence
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-subtle)] rounded">E</kbd>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Purchase List */}
        <div className={`${showEvidencePanel ? 'w-1/2 lg:w-2/5' : 'w-full'} flex flex-col border-r border-[var(--border)] overflow-hidden transition-all`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {activeTab === 'inbox' ? 'Inbox is empty' : `No ${activeTab} items`}
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs">
                  {activeTab === 'inbox'
                    ? 'Connect Gmail to automatically detect purchases from your emails.'
                    : 'No items match this filter.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredPurchases.map((purchase) => {
                const isSelected = selectedPurchase?.id === purchase.id
                const confidence = purchase.email_metadata?.confidence

                return (
                  <div
                    key={purchase.id}
                    onClick={() => setSelectedPurchase(purchase)}
                    className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[var(--primary-soft)] border-l-2 border-l-[var(--primary)]'
                        : 'hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {purchase.needs_review && (
                        <div className="w-2 h-2 mt-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-sm font-medium truncate ${
                            purchase.needs_review ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          }`}>
                            {purchase.merchant || 'Unknown merchant'}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                            {formatDate(purchase.created_at)}
                          </span>
                        </div>

                        {/* Item name */}
                        <p className={`text-sm truncate mb-1 ${
                          purchase.needs_review ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        }`}>
                          {purchase.item_name}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-2">
                          {purchase.price && (
                            <span className="text-xs font-medium text-[var(--text-primary)]">
                              ${purchase.price.toFixed(2)}
                            </span>
                          )}
                          {confidence && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              confidence === 'high'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : confidence === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                              {confidence}
                            </span>
                          )}
                          {purchase.documents.length > 0 && (
                            <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-subtle)]">
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span><kbd className="px-1 py-0.5 bg-[var(--card)] rounded">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 bg-[var(--card)] rounded">Enter</kbd> Open</span>
              <span><kbd className="px-1 py-0.5 bg-[var(--card)] rounded">E</kbd> Evidence</span>
            </div>
          </div>
        </div>

        {/* Evidence Panel */}
        {showEvidencePanel && (
          <div className="w-1/2 lg:w-3/5 flex flex-col overflow-hidden">
            {selectedPurchase ? (
              <EvidencePanel
                purchase={selectedPurchase}
                onVerify={() => handleVerify(selectedPurchase.id)}
                onDismiss={() => handleDismiss(selectedPurchase.id)}
                onQuickFix={(field) => handleQuickFix(selectedPurchase, field)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <svg className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-[var(--text-muted)]">Select a purchase to view evidence</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Fix Modal */}
      {quickFix && (
        <QuickFixModal
          purchase={quickFix.purchase}
          field={quickFix.field}
          onSave={(value) => handleQuickFixSave(quickFix.purchase.id, quickFix.field, value)}
          onClose={() => setQuickFix(null)}
        />
      )}
    </div>
  )
}
