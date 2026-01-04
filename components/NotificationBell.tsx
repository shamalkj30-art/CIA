'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { Notification, NotificationSettings } from '@/lib/types'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    fetchSettings()

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Update settings
  const updateSettings = async (field: string, value: boolean | number) => {
    if (!settings) return
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (response.ok) {
        const updated = await response.json()
        setSettings(updated)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warranty_expiring':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'return_deadline':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'new_purchase':
        return (
          <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )
      case 'gmail_connected':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )
    }
  }

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setShowSettings(false)
        }}
        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--danger)] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {showSettings ? 'Notification Settings' : 'Notifications'}
            </h3>
            <div className="flex items-center gap-2">
              {!showSettings && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showSettings 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]'
                }`}
                aria-label="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {showSettings ? (
            /* Settings Panel */
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {settings ? (
                <>
                  {/* Warranty Expiring */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Warranty expiring</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Notify {settings.warranty_expiring_days} days before
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings('warranty_expiring', !settings.warranty_expiring)}
                      disabled={loading}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.warranty_expiring ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.warranty_expiring ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>

                  {settings.warranty_expiring && (
                    <div className="pl-4 border-l-2 border-[var(--border)]">
                      <label className="text-xs text-[var(--text-muted)]">Days before expiry</label>
                      <select
                        value={settings.warranty_expiring_days}
                        onChange={(e) => updateSettings('warranty_expiring_days', parseInt(e.target.value))}
                        className="mt-1 w-full px-3 py-1.5 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                  )}

                  {/* Return Deadline */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Return deadline</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Notify {settings.return_deadline_days} days before
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings('return_deadline', !settings.return_deadline)}
                      disabled={loading}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.return_deadline ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.return_deadline ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>

                  {settings.return_deadline && (
                    <div className="pl-4 border-l-2 border-[var(--border)]">
                      <label className="text-xs text-[var(--text-muted)]">Days before deadline</label>
                      <select
                        value={settings.return_deadline_days}
                        onChange={(e) => updateSettings('return_deadline_days', parseInt(e.target.value))}
                        className="mt-1 w-full px-3 py-1.5 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg"
                      >
                        <option value={1}>1 day</option>
                        <option value={3}>3 days</option>
                        <option value={5}>5 days</option>
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                      </select>
                    </div>
                  )}

                  {/* New Purchase */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">New purchase detected</p>
                      <p className="text-xs text-[var(--text-muted)]">When auto-detected from email</p>
                    </div>
                    <button
                      onClick={() => updateSettings('new_purchase', !settings.new_purchase)}
                      disabled={loading}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.new_purchase ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.new_purchase ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-6 h-6 mx-auto border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            /* Notifications List */
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-[var(--surface-subtle)] transition-colors ${
                        !notification.read ? 'bg-[var(--primary-soft)]/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-[var(--primary)] rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-[var(--text-muted)]">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <Link
                                href={notification.action_url}
                                onClick={() => {
                                  if (!notification.read) markAsRead(notification.id)
                                  setIsOpen(false)
                                }}
                                className="text-xs text-[var(--primary)] hover:underline"
                              >
                                View →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

