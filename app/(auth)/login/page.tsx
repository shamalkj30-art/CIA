'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const styles = {
  heading: {
    fontFamily: '"Sora", system-ui, sans-serif',
    fontSize: 24,
    fontWeight: 500,
    color: '#161513',
    margin: 0,
    letterSpacing: '-0.2px',
  } as const,
  sub: { color: '#6B6A66', fontSize: 14, marginTop: 8 } as const,
  label: {
    display: 'block',
    fontSize: 12,
    color: '#6B6A66',
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
    marginBottom: 6,
  } as const,
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #E6E2D9',
    padding: '8px 0 10px',
    fontSize: 16,
    color: '#161513',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 120ms ease',
  } as const,
  inputFocus: { borderBottomColor: '#161513' } as const,
  primary: {
    width: '100%',
    background: '#3A6B57',
    color: '#FAF7F2',
    border: 'none',
    borderRadius: 2,
    padding: '14px 24px',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    minHeight: 44,
    transition: 'background 120ms ease',
  } as const,
  link: {
    color: '#3A6B57',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    fontSize: 14,
  } as const,
  errorBox: {
    background: '#FBEBE5',
    color: '#8E1F1F',
    padding: '10px 14px',
    borderRadius: 2,
    fontSize: 14,
    marginBottom: 16,
  } as const,
  successBox: {
    background: '#E7EFEB',
    color: '#2E5645',
    padding: '10px 14px',
    borderRadius: 2,
    fontSize: 14,
    marginBottom: 16,
  } as const,
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) setMessage({ type: 'error', text: decodeURIComponent(error) })
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <h1 style={styles.heading}>Velkommen tilbake</h1>
      <p style={styles.sub}>Logg inn for å se kjøpene og fristene dine.</p>

      {message && (
        <div style={message.type === 'error' ? styles.errorBox : styles.successBox} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ marginTop: 28, display: 'grid', gap: 20 }}>
        <div>
          <label style={styles.label} htmlFor="email">E-post</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => (e.target.style.borderBottomColor = '#E6E2D9')}
          />
        </div>
        <div>
          <label style={styles.label} htmlFor="password">Passord</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => (e.target.style.borderBottomColor = '#E6E2D9')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.primary, opacity: loading ? 0.6 : 1, marginTop: 8 }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#2E5645')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#3A6B57')}
        >
          {loading ? 'Logger inn...' : 'Logg inn'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#6B6A66', marginTop: 28 }}>
        Har du ikke en konto?{' '}
        <Link href="/signup" style={styles.link}>
          Opprett konto
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p style={{ color: '#6B6A66' }}>Laster...</p>}>
      <LoginForm />
    </Suspense>
  )
}
