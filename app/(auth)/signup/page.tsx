'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Account created! Check your email to confirm your account, then sign in.'
      })
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header with logo and theme toggle */}
      <div
        className={`w-full max-w-md flex items-center justify-between mb-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--primary)] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">C</span>
            </div>
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)] font-heading">Cyncro</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Signup Card - Glass Effect */}
      <div
        className={`w-full max-w-md transition-all duration-700 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative group">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

          {/* Glass card */}
          <div
            className="relative backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-[var(--surface)] opacity-80" style={{ zIndex: -1 }} />

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] font-heading">Create an account</h1>
              <p className="text-[var(--text-muted)] mt-2">Start protecting your purchases today</p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl mb-6 backdrop-blur-sm ${
                  message.type === 'error'
                    ? 'bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)]'
                    : 'bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]'
                }`}
              >
                <p className="text-sm font-medium">{message.text}</p>
                {message.type === 'success' && (
                  <Link href="/login" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold hover:underline">
                    Go to sign in
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            )}

            {/* Google sign-up hidden until OAuth provider is configured in Supabase */}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden px-4 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-[var(--primary)] bg-[length:200%_100%] group-hover:animate-gradient-x transition-all" />
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    'Create account'
                  )}
                </span>
              </button>
            </form>

            <p className="text-xs text-[var(--text-muted)] text-center mt-6">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[var(--primary)] hover:underline font-medium">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline font-medium">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <p
          className={`text-center mt-8 text-[var(--text-muted)] transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
