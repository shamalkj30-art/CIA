'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UploadedFile {
  storage_path: string
  file_name: string
  file_type: string
  file_size: number
}

interface ReceiptAnalysis {
  item_name?: string
  merchant?: string
  purchase_date?: string
  warranty_months?: number
  confidence: 'high' | 'medium' | 'low'
  missing_fields: string[]
}

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'appliances', label: 'Appliances', icon: '🔌' },
  { value: 'audio', label: 'Audio & Video', icon: '🎧' },
  { value: 'furniture', label: 'Furniture', icon: '🛋️' },
  { value: 'tools', label: 'Tools & Equipment', icon: '🔧' },
  { value: 'sports', label: 'Sports & Outdoors', icon: '⚽' },
  { value: 'clothing', label: 'Clothing & Accessories', icon: '👕' },
  { value: 'jewelry', label: 'Jewelry & Watches', icon: '⌚' },
  { value: 'other', label: 'Other', icon: '📦' },
]

export default function UploadPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysis | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  // Form state
  const [itemName, setItemName] = useState('')
  const [merchant, setMerchant] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [warrantyMonths, setWarrantyMonths] = useState('')
  const [category, setCategory] = useState('electronics')
  const [notes, setNotes] = useState('')

  const [uploadedFileBlob, setUploadedFileBlob] = useState<File | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    setAnalysisResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      setUploadedFile(uploadData)
      setUploadedFileBlob(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyzeWithAI = async () => {
    if (!uploadedFileBlob) {
      setError('Please upload a file first')
      return
    }

    setError(null)
    setAnalyzing(true)
    setAnalysisResult(null)

    try {
      const analyzeFormData = new FormData()
      analyzeFormData.append('file', uploadedFileBlob)

      const analyzeResponse = await fetch('/api/ai/analyze-receipt', {
        method: 'POST',
        body: analyzeFormData,
      })

      const analysis = await analyzeResponse.json()

      if (!analyzeResponse.ok) {
        throw new Error(analysis.error || 'AI analysis failed')
      }

      if (analysis) {
        setAnalysisResult(analysis)
        if (analysis.item_name) setItemName(analysis.item_name)
        if (analysis.merchant) setMerchant(analysis.merchant)
        if (analysis.purchase_date) setPurchaseDate(analysis.purchase_date)
        if (analysis.warranty_months) setWarrantyMonths(analysis.warranty_months.toString())
        setStep(2)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze receipt')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName,
          merchant: merchant || null,
          purchase_date: purchaseDate,
          warranty_months: parseInt(warrantyMonths) || 0,
          category,
          notes: notes || null,
          document: uploadedFile,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create purchase')
      }

      router.push(`/purchases/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const clearUpload = () => {
    setUploadedFile(null)
    setUploadedFileBlob(null)
    setError(null)
    setAnalysisResult(null)
    setItemName('')
    setMerchant('')
    setPurchaseDate('')
    setWarrantyMonths('')
    setNotes('')
    setStep(1)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href="/purchases"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Purchases
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Add Purchase</h1>
        <p className="text-[var(--text-secondary)]">
          Upload a receipt and let AI extract the details
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
            step >= 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)]'
          }`}>
            1
          </div>
          <span className="font-medium hidden sm:block">Upload</span>
        </div>
        <div className="flex-1 h-0.5 bg-[var(--border)]">
          <div className={`h-full bg-[var(--primary)] transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
            step >= 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)]'
          }`}>
            2
          </div>
          <span className="font-medium hidden sm:block">Details</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger)]/20 text-[var(--danger)] text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* AI Analysis Result */}
      {analysisResult && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 ${
          analysisResult.confidence === 'high'
            ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20'
            : 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="font-medium">
              {analysisResult.confidence === 'high'
                ? '✓ AI extracted information with high confidence'
                : '⚠ Please verify the extracted information'}
            </p>
            {analysisResult.missing_fields.length > 0 && (
              <p className="text-xs mt-1 opacity-75">
                Missing: {analysisResult.missing_fields.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Upload Receipt</h2>
          
          {!uploadedFile ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*,.pdf,.heic,.heif,.tiff,.tif,.bmp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                ) : (
                  <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <p className="text-[var(--text-primary)] font-medium mb-1">
                {uploading ? 'Uploading...' : 'Drop your receipt here, or click to browse'}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Supports JPG, PNG, PDF, HEIC, WebP up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--success-soft)] border border-[var(--success)]/20">
                <div className="w-12 h-12 rounded-xl bg-[var(--success)]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{uploadedFile.file_name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {formatFileSize(uploadedFile.file_size)} • {uploadedFile.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearUpload}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={analyzing}
                  className="flex-1 btn btn-primary py-3"
                >
                  {analyzing ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Extract with AI
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary py-3"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Details Form */}
      {step === 2 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Purchase Details</h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              ← Change receipt
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Item Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="itemName"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Sony WH-1000XM5 Headphones"
                className="input"
                required
              />
            </div>

            {/* Merchant & Date Row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="merchant" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Merchant
                </label>
                <input
                  id="merchant"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g., Best Buy"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Purchase Date <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Warranty & Category Row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="warrantyMonths" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Warranty Period
                </label>
                <div className="relative">
                  <input
                    id="warrantyMonths"
                    type="number"
                    min="0"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    placeholder="12"
                    className="input pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">
                    months
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Notes <span className="text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this purchase..."
                className="input min-h-[100px] resize-none"
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!itemName || !purchaseDate || submitting}
                className="btn btn-primary w-full py-3"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Purchase
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
