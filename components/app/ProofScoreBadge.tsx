'use client'

import { useState } from 'react'
import type { Purchase, PurchaseWithDocuments } from '@/lib/types'
import { calculateProofScore, type ProofScoreResult } from '@/lib/proof-score'

interface ProofScoreBadgeProps {
  purchase: Purchase | PurchaseWithDocuments
  showTooltip?: boolean
  size?: 'sm' | 'md'
}

export function ProofScoreBadge({ purchase, showTooltip = true, size = 'sm' }: ProofScoreBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const proofScore = calculateProofScore(purchase)

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1'

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${proofScore.bgClass} ${proofScore.colorClass}`}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <span>{proofScore.icon}</span>
        <span>{proofScore.label}</span>
      </span>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 text-xs">
            <p className="text-[var(--text-primary)] font-medium mb-1">
              {proofScore.description}
            </p>
            {proofScore.missingFields.length > 0 && (
              <div className="mt-2">
                <p className="text-[var(--text-muted)] mb-1">Missing:</p>
                <ul className="list-disc list-inside text-[var(--text-secondary)]">
                  {proofScore.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
            {proofScore.needsReview && (
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                Needs verification
              </p>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--border)]" />
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for list views
export function ProofScoreIcon({ purchase }: { purchase: Purchase | PurchaseWithDocuments }) {
  const proofScore = calculateProofScore(purchase)

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${proofScore.bgClass} ${proofScore.colorClass}`}
      title={proofScore.label}
    >
      {proofScore.icon}
    </span>
  )
}
