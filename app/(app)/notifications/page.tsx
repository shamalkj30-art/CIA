'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import type { Notification, NotificationSettings } from '@/lib/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Fetch notifications and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, settingsRes] = await Promise.all([
          fetch('/api/notifications?limit=50'),
          fetch('/api/notifications/settings'),
        ])

        if (notifRes.ok) {
          const data = await notifRes.json()
          setNotifications(data.notifications)
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Update settings
  const updateSettings = async (field: string, value: boolean | number) => {
    if (!settings) return
    setSavingSettings(true)
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
      setSavingSettings(false)
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

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warranty_expiring':
        return (
          <div className="w-10 h-10 rounded-xl bg-[var(--warning-soft)] flex items-center justify-center text-[var(--warning)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'return_deadline':
        return (
          <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] flex items-center justify-center text-[var(--danger)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'new_purchase':
        return (
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">Notifications</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Manage your alerts and notification preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notifications List - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-[var(--text-primary)]">Recent Notifications</h2>
                {unreadCount > 0 && (
                  <Badge variant="primary" size="sm">{unreadCount} unread</Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-[var(--primary)] hover:underline font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">No notifications yet</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  You'll see warranty alerts and updates here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      !notification.read ? 'bg-[var(--primary-soft)]/20' : 'hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <div className="flex gap-4">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${
                              notification.read
                                ? 'text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)] font-medium'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => {
                                if (!notification.read) markAsRead(notification.id)
                              }}
                              className="text-xs text-[var(--primary)] hover:underline font-medium"
                            >
                              View details →
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Settings Panel - Takes 1 column */}
        <div className="space-y-4">
          <Card padding="none">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Notification Settings</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Choose what you want to be notified about
              </p>
            </div>

            {settings ? (
              <div className="p-4 space-y-6">
                {/* Warranty Expiring */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--warning-soft)] flex items-center justify-center text-[var(--warning)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Warranty expiring</p>
                        <p className="text-xs text-[var(--text-muted)]">Before coverage ends</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings('warranty_expiring', !settings.warranty_expiring)}
                      disabled={savingSettings}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        settings.warranty_expiring ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        settings.warranty_expiring ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>

                  {settings.warranty_expiring && (
                    <div className="ml-12 pl-3 border-l-2 border-[var(--border)]">
                      <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                        Notify me this many days before
                      </label>
                      <select
                        value={settings.warranty_expiring_days}
                        onChange={(e) => updateSettings('warranty_expiring_days', parseInt(e.target.value))}
                        disabled={savingSettings}
                        className="w-full px-3 py-2 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border)]" />

                {/* Return Deadline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--danger-soft)] flex items-center justify-center text-[var(--danger)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Return deadline</p>
                        <p className="text-xs text-[var(--text-muted)]">Before return window closes</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings('return_deadline', !settings.return_deadline)}
                      disabled={savingSettings}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        settings.return_deadline ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        settings.return_deadline ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>

                  {settings.return_deadline && (
                    <div className="ml-12 pl-3 border-l-2 border-[var(--border)]">
                      <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                        Notify me this many days before
                      </label>
                      <select
                        value={settings.return_deadline_days}
                        onChange={(e) => updateSettings('return_deadline_days', parseInt(e.target.value))}
                        disabled={savingSettings}
                        className="w-full px-3 py-2 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value={1}>1 day</option>
                        <option value={3}>3 days</option>
                        <option value={5}>5 days</option>
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border)]" />

                {/* New Purchase */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">New purchase</p>
                      <p className="text-xs text-[var(--text-muted)]">When auto-detected from email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings('new_purchase', !settings.new_purchase)}
                    disabled={savingSettings}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings.new_purchase ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      settings.new_purchase ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-8 h-8 mx-auto border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card padding="md">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Total notifications</span>
                <span className="font-medium text-[var(--text-primary)]">{notifications.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Unread</span>
                <span className="font-medium text-[var(--primary)]">{unreadCount}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
