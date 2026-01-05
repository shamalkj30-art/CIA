'use client'

interface NeedsReviewBannerProps {
  onVerify?: () => void
  loading?: boolean
}

export function NeedsReviewBanner({ onVerify, loading }: NeedsReviewBannerProps) {
  return (
    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">
            This purchase needs review
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            This was auto-detected from your email. Some fields may be incorrect - please verify the details.
          </p>
        </div>
        {onVerify && (
          <button
            onClick={onVerify}
            disabled={loading}
            className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Mark as Verified'}
          </button>
        )}
      </div>
    </div>
  )
}
