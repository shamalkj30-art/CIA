'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Passordet må være minst 6 tegn.' })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passordene er ikke like.' })
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      setMessage({
        type: 'success',
        text: 'Konto opprettet! Sjekk e-posten for bekreftelseslenken.',
      })
      setLoading(false)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderBottomColor = '#161513')
  const blur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderBottomColor = '#E6E2D9')

  return (
    <>
      <h1 style={styles.heading}>Opprett konto</h1>
      <p style={styles.sub}>Begynn å spare på kjøpene du allerede har gjort.</p>

      {message && (
        <div style={message.type === 'error' ? styles.errorBox : styles.successBox} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSignUp} style={{ marginTop: 28, display: 'grid', gap: 20 }}>
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
            onFocus={focus}
            onBlur={blur}
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
            minLength={6}
            autoComplete="new-password"
            style={styles.input}
            onFocus={focus}
            onBlur={blur}
          />
        </div>
        <div>
          <label style={styles.label} htmlFor="confirmPassword">Bekreft passord</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            style={styles.input}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.primary, opacity: loading ? 0.6 : 1, marginTop: 8 }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#2E5645')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#3A6B57')}
        >
          {loading ? 'Oppretter...' : 'Opprett konto'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: '#6B6A66', textAlign: 'center', marginTop: 20, maxWidth: '32ch', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
        Ved å opprette konto godtar du våre{' '}
        <Link href="/security" style={{ ...styles.link, fontSize: 12 }}>vilkår</Link>
        {' '}og{' '}
        <Link href="/security" style={{ ...styles.link, fontSize: 12 }}>personvern</Link>.
      </p>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#6B6A66', marginTop: 24 }}>
        Har du allerede en konto?{' '}
        <Link href="/login" style={styles.link}>
          Logg inn
        </Link>
      </p>
    </>
  )
}
