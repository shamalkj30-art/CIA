/**
 * Auth layout — paper background, no animated orbs, no particles.
 * Follows README_SETUP.md → Design system.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7F2',
        backgroundImage:
          'radial-gradient(rgba(22,21,19,0.025) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
        color: '#161513',
        fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Wordmark above the card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 32,
            fontFamily: '"Sora", system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: '-0.2px',
            color: '#161513',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              border: '1.5px solid #161513',
              borderRadius: 2,
              display: 'inline-grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            C
          </span>
          Cyncro
        </div>

        {/* Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6E2D9',
            borderRadius: 2,
            padding: 40,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
