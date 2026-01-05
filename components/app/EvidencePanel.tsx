'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'
import { TrustIndicator } from './TrustIndicator'

interface EvidencePanelProps {
  purchase: PurchaseWithDocuments
  onVerify: () => void
  onDismiss: () => void
  onQuickFix: (field: 'merchant' | 'price' | 'item_name' | 'purchase_date') => void
}

type EvidenceTab = 'details' | 'email' | 'documents'

export function EvidencePanel({ purchase, onVerify, onDismiss, onQuickFix }: EvidencePanelProps) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('details')
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Fetch signed URLs for documents
  useEffect(() => {
    if (purchase.documents.length > 0 && activeTab === 'documents') {
      setLoadingDocs(true)
      Promise.all(
        purchase.documents.map(async (doc) => {
          try {
            const response = await fetch(`/api/purchases/${purchase.id}/documents/${doc.id}/url`)
            if (response.ok) {
              const data = await response.json()
              return { id: doc.id, url: data.url }
            }
          } catch (error) {
            console.error('Failed to get document URL:', error)
          }
          return { id: doc.id, url: '' }
        })
      ).then((results) => {
        const urls: Record<string, string> = {}
        results.forEach(r => {
          if (r.url) urls[r.id] = r.url
        })
        setDocumentUrls(urls)
        setLoadingDocs(false)
      })
    }
  }, [purchase.id, purchase.documents, activeTab])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const confidence = purchase.email_metadata?.confidence
  const hasEmailData = !!purchase.email_metadata

  return (
    <div className="h-full flex flex-col bg-[var(--card)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {purchase.item_name}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {purchase.merchant || 'Unknown merchant'} • {formatDate(purchase.purchase_date)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {purchase.needs_review ? (
              <>
                <button
                  onClick={onDismiss}
                  className="btn btn-ghost text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Dismiss
                </button>
                <button onClick={onVerify} className="btn btn-primary text-sm">
                  Verify
                </button>
              </>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)]">
        {[
          { id: 'details' as EvidenceTab, label: 'Details' },
          { id: 'email' as EvidenceTab, label: 'Email', disabled: !hasEmailData },
          { id: 'documents' as EvidenceTab, label: 'Documents', count: purchase.documents.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                : tab.disabled
                ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-[var(--surface-subtle)] rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Extracted Data */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Extracted Information
              </h3>
              <div className="space-y-3">
                {/* Merchant */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Merchant</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {purchase.merchant || <span className="text-[var(--text-muted)] italic">Not detected</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrustIndicator confidence={confidence} field="merchant" />
                    <button
                      onClick={() => onQuickFix('merchant')}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] rounded transition-all"
                      title="Edit merchant"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Item Name */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Item</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {purchase.item_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrustIndicator confidence={confidence} field="item" />
                    <button
                      onClick={() => onQuickFix('item_name')}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] rounded transition-all"
                      title="Edit item name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {purchase.price ? `$${purchase.price.toFixed(2)}` : <span className="text-[var(--text-muted)] italic">Not detected</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrustIndicator confidence={confidence} field="price" />
                    <button
                      onClick={() => onQuickFix('price')}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] rounded transition-all"
                      title="Edit price"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Purchase Date</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {formatDate(purchase.purchase_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrustIndicator confidence={confidence} field="date" />
                    <button
                      onClick={() => onQuickFix('purchase_date')}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] rounded transition-all"
                      title="Edit date"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Order Number */}
                {purchase.order_number && (
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">Order Number</p>
                      <p className="text-sm font-medium text-[var(--text-primary)] font-mono">
                        {purchase.order_number}
                      </p>
                    </div>
                    <TrustIndicator confidence={confidence} field="order" />
                  </div>
                )}

                {/* Warranty */}
                {purchase.warranty_months > 0 && (
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">Warranty</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {purchase.warranty_months} months
                        {purchase.warranty_expires_at && (
                          <span className="text-[var(--text-muted)] font-normal">
                            {' '}(expires {formatDate(purchase.warranty_expires_at)})
                          </span>
                        )}
                      </p>
                    </div>
                    <TrustIndicator confidence={confidence} field="warranty" />
                  </div>
                )}

                {/* Return Deadline */}
                {purchase.return_deadline && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5">Return Deadline</p>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {formatDate(purchase.return_deadline)}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Source Info */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Source</h3>
              <div className="p-3 bg-[var(--surface-subtle)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {purchase.source === 'gmail_auto' && (
                    <>
                      <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Gmail Auto-Sync</span>
                    </>
                  )}
                  {purchase.source === 'email_forwarded' && (
                    <>
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Email Forwarded</span>
                    </>
                  )}
                  {purchase.source === 'manual' && (
                    <>
                      <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Manual Upload</span>
                    </>
                  )}
                </div>
                {purchase.email_metadata && (
                  <p className="text-xs text-[var(--text-muted)]">
                    From: {purchase.email_metadata.sender}
                  </p>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  Added {formatDate(purchase.created_at)} at {formatTime(purchase.created_at)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border)]">
              <Link
                href={`/purchases/${purchase.id}`}
                className="btn btn-secondary w-full justify-center"
              >
                View Full Details
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'email' && purchase.email_metadata && (
          <div className="space-y-4">
            {/* Email Header */}
            <div className="p-4 bg-[var(--surface-subtle)] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-[var(--primary)]">
                    {purchase.email_metadata.sender.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {purchase.email_metadata.sender}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(purchase.email_metadata.received_at)} at {formatTime(purchase.email_metadata.received_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {purchase.email_metadata.subject}
                </p>
              </div>
            </div>

            {/* Confidence Indicator */}
            <div className={`p-4 rounded-lg ${
              confidence === 'high'
                ? 'bg-green-50 dark:bg-green-900/20'
                : confidence === 'medium'
                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${
                  confidence === 'high'
                    ? 'text-green-500'
                    : confidence === 'medium'
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className={`text-sm font-medium ${
                    confidence === 'high'
                      ? 'text-green-700 dark:text-green-300'
                      : confidence === 'medium'
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low'} Confidence Extraction
                  </p>
                  <p className={`text-xs ${
                    confidence === 'high'
                      ? 'text-green-600 dark:text-green-400'
                      : confidence === 'medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {confidence === 'high'
                      ? 'AI is confident about the extracted information'
                      : confidence === 'medium'
                      ? 'Some fields may need verification'
                      : 'Please review all extracted fields carefully'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted)] text-center">
              Email content preview not available. View the original email in Gmail.
            </p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {purchase.documents.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[var(--text-muted)]">No documents attached</p>
                <Link href={`/purchases/${purchase.id}`} className="text-sm text-[var(--primary)] hover:underline mt-2 inline-block">
                  Add documents
                </Link>
              </div>
            ) : loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {purchase.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-[var(--surface-subtle)] rounded-lg">
                    <div className="flex items-start gap-3">
                      {/* File icon */}
                      <div className="w-10 h-10 rounded-lg bg-[var(--card)] flex items-center justify-center flex-shrink-0">
                        {doc.file_type.includes('image') ? (
                          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : doc.file_type.includes('pdf') ? (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>

                      {documentUrls[doc.id] && (
                        <a
                          href={documentUrls[doc.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--card)] rounded transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Image preview */}
                    {doc.file_type.includes('image') && documentUrls[doc.id] && (
                      <div className="mt-3">
                        <img
                          src={documentUrls[doc.id]}
                          alt={doc.file_name}
                          className="w-full rounded-lg border border-[var(--border)] max-h-64 object-contain bg-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
