'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@/components/ui'

const mockExtraction = {
  merchant: 'Apple Store',
  item: 'MacBook Pro 14"',
  amount: '$1,999.00',
  date: '2024-12-15',
  warranty: '12 months',
  confidence: 'high',
  fields: [
    { label: 'Merchant', value: 'Apple Store', confidence: 98 },
    { label: 'Item', value: 'MacBook Pro 14"', confidence: 95 },
    { label: 'Amount', value: '$1,999.00', confidence: 99 },
    { label: 'Date', value: 'Dec 15, 2024', confidence: 97 },
    { label: 'Warranty', value: '12 months', confidence: 85 },
  ],
}

export function HeroInteractive() {
  const [activeTab, setActiveTab] = useState('upload')
  const [isExtracting, setIsExtracting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleDemo = () => {
    setIsExtracting(true)
    setShowResults(false)
    setTimeout(() => {
      setIsExtracting(false)
      setShowResults(true)
    }, 1500)
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-[var(--primary)]/10 overflow-hidden hover:shadow-[var(--primary)]/20 transition-shadow duration-500">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface-subtle)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-[var(--background)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] font-mono max-w-xs mx-auto text-center">
            cyncro.app
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="upload" value={activeTab} onChange={(v) => { setActiveTab(v); setShowResults(false); }}>
          <TabsList variant="default">
            <TabsTrigger value="upload">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload receipt
            </TabsTrigger>
            <TabsTrigger value="forward">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Forward email
            </TabsTrigger>
            <TabsTrigger value="import">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            {!showResults ? (
              <div
                onClick={handleDemo}
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all group"
              >
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-[var(--primary)]">Extracting details with AI...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">Click to try a demo</p>
                    <p className="text-sm text-[var(--text-muted)]">See how AI extracts receipt details instantly</p>
                  </>
                )}
              </div>
            ) : (
              <ExtractionResults />
            )}
          </TabsContent>

          <TabsContent value="forward" className="mt-6">
            <div className="bg-[var(--surface-subtle)] rounded-xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-[var(--text-primary)] mb-2">Forward order confirmations</p>
              <p className="text-sm text-[var(--text-muted)] mb-4">Send receipts to your Cyncro inbox</p>
              <code className="inline-block px-4 py-2 bg-[var(--background)] rounded-lg text-sm font-mono text-[var(--primary)]">
                receipts@cyncro.app
              </code>
            </div>
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <div className="bg-[var(--surface-subtle)] rounded-xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium text-[var(--text-primary)] mb-2">Import PDF invoices</p>
              <p className="text-sm text-[var(--text-muted)]">Drag and drop PDF files to extract warranty info</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ExtractionResults() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--text-primary)]">Extracted Details</h4>
        <Badge variant="success" dot>High confidence</Badge>
      </div>

      <div className="space-y-3">
        {mockExtraction.fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg"
          >
            <div>
              <p className="text-xs text-[var(--text-muted)]">{field.label}</p>
              <p className="font-medium text-[var(--text-primary)]">{field.value}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    field.confidence >= 90 ? 'bg-[var(--success)]' :
                    field.confidence >= 70 ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'
                  }`}
                  style={{ width: `${field.confidence}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)] w-8">{field.confidence}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-[var(--warning-soft)] rounded-lg">
        <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-[var(--warning)]">
          <strong>Review warranty</strong> — confidence is below 90%. Verify before saving.
        </p>
      </div>
    </div>
  )
}
