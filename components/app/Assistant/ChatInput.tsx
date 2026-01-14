'use client'

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'

interface AttachedFile {
  file: File
  preview?: string
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [value])

  // Focus textarea when panel opens
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      attachedFiles.forEach(af => {
        if (af.preview) URL.revokeObjectURL(af.preview)
      })
    }
  }, [attachedFiles])

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setAttachedFiles(prev => [...prev, ...newFiles])
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const file = prev[index]
      if (file.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = () => {
    if ((value.trim() || attachedFiles.length > 0) && !isLoading) {
      onSend(value.trim(), attachedFiles.length > 0 ? attachedFiles.map(af => af.file) : undefined)
      setValue('')
      setAttachedFiles([])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type === 'application/pdf') return '📄'
    if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return '📝'
    if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return '📊'
    return '📎'
  }

  return (
    <div className="space-y-2">
      {/* File previews */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-[var(--surface-subtle)] rounded-lg">
          {attachedFiles.map((af, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-2 py-1.5 bg-[var(--card)] rounded-md border border-[var(--border)]"
            >
              {af.preview ? (
                <img src={af.preview} alt="" className="w-8 h-8 object-cover rounded" />
              ) : (
                <span className="text-lg">{getFileIcon(af.file)}</span>
              )}
              <span className="text-xs text-[var(--text-secondary)] max-w-[100px] truncate">
                {af.file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="p-0.5 rounded-full bg-[var(--surface-subtle)] hover:bg-red-500 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="
            flex-shrink-0 p-2.5 rounded-xl
            bg-[var(--surface-subtle)] border border-[var(--border)]
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            hover:border-[var(--primary)] hover:bg-[var(--surface)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
          "
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        {/* Text input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
            className="
              w-full resize-none rounded-xl
              bg-[var(--surface-subtle)] border border-[var(--border)]
              px-4 py-3 pr-12
              text-sm text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
            style={{ maxHeight: '120px' }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={(!value.trim() && attachedFiles.length === 0) || isLoading}
            className="
              absolute right-2 bottom-2
              p-2 rounded-lg
              bg-[var(--primary)] text-white
              hover:bg-[var(--primary-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
