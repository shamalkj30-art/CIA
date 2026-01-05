'use client'

import { useState } from 'react'
import type { Purchase } from '@/lib/types'
import { getFieldConfidence, getTrustIndicatorConfig, type TrustLevel } from '@/lib/proof-score'

// Simple trust indicator using just confidence level
interface SimpleTrustIndicatorProps {
  confidence?: 'high' | 'medium' | 'low'
  field?: string
  showLabel?: boolean
}

export function TrustIndicator({ confidence, field, showLabel = false }: SimpleTrustIndicatorProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (!confidence) return null

  const config = {
    high: {
      icon: '✓',
      label: 'AI Verified',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      colorClass: 'text-green-600 dark:text-green-400',
    },
    medium: {
      icon: '~',
      label: 'AI Detected',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
      colorClass: 'text-yellow-600 dark:text-yellow-400',
    },
    low: {
      icon: '?',
      label: 'Low Confidence',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      colorClass: 'text-red-600 dark:text-red-400',
    },
  }[confidence]

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${config.bgClass} ${config.colorClass} cursor-help`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <span className="font-medium">{config.icon}</span>
        {showLabel && <span>{config.label}</span>}
      </span>

      {/* Tooltip */}
      {tooltipVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-2 text-xs">
            <p className="text-[var(--text-primary)] font-medium">
              {config.label}
            </p>
            <p className="text-[var(--text-muted)] mt-0.5">
              {confidence === 'high' ? 'High confidence in extracted data' :
               confidence === 'medium' ? 'Review recommended' :
               'Please verify this field'}
            </p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--border)]" />
          </div>
        </div>
      )}
    </div>
  )
}

// Full trust indicator using purchase object
interface FullTrustIndicatorProps {
  purchase: Purchase
  field: 'merchant' | 'amount' | 'date'
  showLabel?: boolean
}

export function PurchaseTrustIndicator({ purchase, field, showLabel = false }: FullTrustIndicatorProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  // Manual entries don't need trust indicators
  if (purchase.source === 'manual') {
    return null
  }

  const { score, level } = getFieldConfidence(purchase, field)
  const config = getTrustIndicatorConfig(level)

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${config.bgClass} ${config.colorClass} cursor-help`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <span className="font-medium">{config.icon}</span>
        {showLabel && <span>{config.label}</span>}
      </span>

      {/* Tooltip */}
      {tooltipVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-2 text-xs">
            <p className="text-[var(--text-primary)] font-medium">
              {config.label}
            </p>
            {score > 0 && (
              <p className="text-[var(--text-muted)] mt-0.5">
                Confidence: {Math.round(score * 100)}%
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

// Overall confidence badge for a purchase
interface ConfidenceBadgeProps {
  level: TrustLevel
  className?: string
}

export function ConfidenceBadge({ level, className = '' }: ConfidenceBadgeProps) {
  const config = getTrustIndicatorConfig(level)

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bgClass} ${config.colorClass} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
