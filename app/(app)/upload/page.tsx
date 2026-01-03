'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function UploadPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysis | null>(null)

  // Form state
  const [itemName, setItemName] = useState('')
  const [merchant, setMerchant] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [warrantyMonths, setWarrantyMonths] = useState('')

  const [uploadedFileBlob, setUploadedFileBlob] = useState<File | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    setAnalysisResult(null) // Reset previous analysis

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Upload file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      setUploadedFile(uploadData)
      setUploadedFileBlob(file) // Store file blob for AI analysis
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
        
        // Auto-fill form fields
        if (analysis.item_name) setItemName(analysis.item_name)
        if (analysis.merchant) setMerchant(analysis.merchant)
        if (analysis.purchase_date) setPurchaseDate(analysis.purchase_date)
        if (analysis.warranty_months) setWarrantyMonths(analysis.warranty_months.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze receipt')
      console.error('AI analysis error:', err)
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
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Upload Receipt</h1>
        <p className="text-[var(--muted)] mt-1">
          Upload a receipt and our AI will automatically extract the details
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
          {error}
        </div>
      )}

      {/* AI Analysis Result */}
      {analysisResult && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${
          analysisResult.confidence === 'high'
            ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
            : analysisResult.confidence === 'medium'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium mb-1">
                {analysisResult.confidence === 'high'
                  ? '✓ AI extracted receipt information with high confidence'
                  : analysisResult.confidence === 'medium'
                  ? '⚠ AI extracted information but please verify'
                  : '⚠ AI had difficulty reading some fields - please review'}
              </p>
              {analysisResult.missing_fields.length > 0 && (
                <p className="text-xs mt-1 opacity-75">
                  Missing fields: {analysisResult.missing_fields.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Receipt</h2>
        
        {!uploadedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border)] hover:border-[var(--muted)]'
            } ${uploading || analyzing ? 'pointer-events-none opacity-50' : ''}`}
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
              disabled={uploading || analyzing}
            />
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              {(uploading || analyzing) ? (
                <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              )}
            </div>
            <p className="text-[var(--foreground)] font-medium mb-1">
              {uploading
                ? 'Uploading...'
                : 'Drop your receipt here, or click to browse'}
            </p>
            <p className="text-sm text-[var(--muted)]">
              Supports JPG, PNG, PDF, HEIC, WebP, TIFF, BMP up to 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
              <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[var(--success)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{uploadedFile.file_name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {formatFileSize(uploadedFile.file_size)} • {uploadedFile.file_type.split('/')[1].toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={clearUpload}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* AI Extract Button */}
            {!analysisResult && (
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-hover)] text-white font-medium transition-all shadow-lg shadow-[var(--primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing receipt with AI...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Extract Information with AI</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Purchase Form */}
      <div className="card">
        <h2 className="text-lg font-medium mb-4">Purchase Details</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Fields auto-filled by AI can be edited if needed
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium mb-2">
              Item Name <span className="text-[var(--error)]">*</span>
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

          <div>
            <label htmlFor="merchant" className="block text-sm font-medium mb-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2">
                Purchase Date <span className="text-[var(--error)]">*</span>
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

            <div>
              <label htmlFor="warrantyMonths" className="block text-sm font-medium mb-2">
                Warranty (months)
              </label>
              <input
                id="warrantyMonths"
                type="number"
                min="0"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                placeholder="12"
                className="input"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!itemName || !purchaseDate || submitting}
              className="btn btn-primary w-full py-3"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Purchase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
