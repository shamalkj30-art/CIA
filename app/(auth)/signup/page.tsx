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

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] text-[var(--text-primary)] font-medium transition-all duration-200 hover:border-[var(--primary)]/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
              <span className="text-sm text-[var(--text-muted)] font-medium">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            </div>

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
