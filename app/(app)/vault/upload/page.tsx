'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { VaultLibrary, InsuranceRoom } from '@/lib/types'
import { LIBRARY_CONFIGS, ROOM_CONFIGS } from '@/lib/types'

export default function VaultUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    library: 'receipts' as VaultLibrary,
    room: '' as InsuranceRoom | '',
    tags: '',
    estimated_value: '',
    expires_at: '',
    notes: '',
  })

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError('')

    // Set title from filename if not set
    if (!formData.title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setFormData(prev => ({ ...prev, title: nameWithoutExt }))
    }

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }
    if (!formData.title) {
      setError('Please enter a title')
      return
    }

    setUploading(true)
    setError('')

    try {
      const submitData = new FormData()
      submitData.append('file', file)
      submitData.append('title', formData.title)
      submitData.append('library', formData.library)
      if (formData.room) submitData.append('room', formData.room)
      if (formData.tags) submitData.append('tags', formData.tags)
      if (formData.estimated_value) submitData.append('estimated_value', formData.estimated_value)
      if (formData.expires_at) submitData.append('expires_at', formData.expires_at)
      if (formData.notes) submitData.append('notes', formData.notes)

      const response = await fetch('/api/vault', {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const vaultItem = await response.json()
      router.push(`/vault/${vaultItem.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/vault"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vault
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Add Document</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Upload a document to your vault
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* File Upload Area */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
            File *
          </label>

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-[var(--text-primary)] font-medium mb-1">
                Drop file here or click to upload
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                PDF, images, Word, Excel - up to 10MB
              </p>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center gap-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[var(--surface-subtle)] flex items-center justify-center text-2xl">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
        </div>

        {/* Document Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Document Details</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., iPhone 15 Pro Receipt"
              className="input"
              required
            />
          </div>

          {/* Library */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Library *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LIBRARY_CONFIGS.map((lib) => (
                <button
                  key={lib.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, library: lib.id, room: lib.id === 'insurance' ? formData.room : '' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.library === lib.id
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <span className="text-xl mb-1 block">{lib.icon}</span>
                  <span className={`text-sm font-medium ${
                    formData.library === lib.id ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'
                  }`}>
                    {lib.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Room (for Insurance) */}
          {formData.library === 'insurance' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Room
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROOM_CONFIGS.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, room: formData.room === room.id ? '' : room.id })}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      formData.room === room.id
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <span className="text-lg block">{room.icon}</span>
                    <span className={`text-xs ${
                      formData.room === room.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {room.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Value */}
          {(formData.library === 'insurance' || formData.library === 'receipts') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Estimated Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">kr</span>
                <input
                  type="number"
                  step="1"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="0"
                  className="input pl-10"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Useful for insurance claims and tracking
              </p>
            </div>
          )}

          {/* Expiry Date */}
          {(formData.library === 'warranties' || formData.library === 'contracts' || formData.library === 'insurance') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="input"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Get notified before this document expires
              </p>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., electronics, apple, phone (comma-separated)"
              className="input"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Add tags to help organize and find documents
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="input min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/vault" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={uploading || !file}
            className="btn btn-primary"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
