'use client'

import { createContext, useContext, useState, ReactNode, useId } from 'react'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

interface TabsProps {
  children: ReactNode
  /** Default active tab */
  defaultValue: string
  /** Controlled value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  className?: string
}

/**
 * Accessible tabs component
 * Supports keyboard navigation
 */
export function Tabs({
  children,
  defaultValue,
  value,
  onChange,
  className = '',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const baseId = useId()

  const activeTab = value ?? internalValue
  const setActiveTab = (id: string) => {
    if (value === undefined) {
      setInternalValue(id)
    }
    onChange?.(id)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  /** Visual variant */
  variant?: 'default' | 'pills' | 'underline'
  className?: string
}

export function TabsList({ children, variant = 'default', className = '' }: TabsListProps) {
  const variantClasses = {
    default: 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 gap-1',
    pills: 'gap-2',
    underline: 'border-b border-[var(--border)] gap-0',
  }[variant]

  return (
    <div
      role="tablist"
      className={`flex ${variantClasses} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  children: ReactNode
  /** Tab identifier */
  value: string
  /** Disabled state */
  disabled?: boolean
  className?: string
}

export function TabsTrigger({
  children,
  value,
  disabled = false,
  className = '',
}: TabsTriggerProps) {
  const { activeTab, setActiveTab, baseId } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')
          if (!tabs) return
          const tabsArray = Array.from(tabs) as HTMLElement[]
          const currentIndex = tabsArray.indexOf(e.currentTarget)
          const nextIndex = e.key === 'ArrowRight'
            ? (currentIndex + 1) % tabsArray.length
            : (currentIndex - 1 + tabsArray.length) % tabsArray.length
          tabsArray[nextIndex].focus()
          tabsArray[nextIndex].click()
        }
      }}
      className={`
        px-4 py-2
        text-sm font-medium
        rounded-lg
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive
          ? 'bg-[var(--primary)] text-white shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
        }
        ${className}
      `.trim()}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  children: ReactNode
  /** Tab identifier (must match TabsTrigger value) */
  value: string
  className?: string
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const { activeTab, baseId } = useTabsContext()
  const isActive = activeTab === value

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={`mt-4 focus-visible:outline-none ${className}`.trim()}
    >
      {children}
    </div>
  )
}
