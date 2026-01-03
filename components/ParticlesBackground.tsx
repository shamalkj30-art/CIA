'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    particlesJS?: (id: string, config: object) => void
  }
}

export default function ParticlesBackground() {
  const initialized = useRef(false)

  useEffect(() => {
    const initParticles = () => {
      if (initialized.current || !window.particlesJS) return
      initialized.current = true

      window.particlesJS('particles-js', {
        particles: {
          number: { 
            value: 60, 
            density: { enable: true, value_area: 900 } 
          },
          color: { value: '#0F766E' }, // Teal to match brand
          shape: { type: 'circle' },
          opacity: { 
            value: 0.3, 
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
          },
          size: { 
            value: 3, 
            random: true,
            anim: { enable: true, speed: 2, size_min: 0.5, sync: false }
          },
          line_linked: { 
            enable: true, 
            distance: 150, 
            color: '#0F766E', 
            opacity: 0.2, 
            width: 1 
          },
          move: { 
            enable: true, 
            speed: 1.5, 
            direction: 'none', 
            random: true, 
            straight: false, 
            out_mode: 'out', 
            bounce: false 
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: { 
            onhover: { enable: true, mode: 'grab' }, 
            onclick: { enable: true, mode: 'push' }, 
            resize: true 
          },
          modes: { 
            grab: { distance: 140, line_linked: { opacity: 0.5 } }, 
            push: { particles_nb: 3 },
            repulse: { distance: 100, duration: 0.4 }
          }
        },
        retina_detect: true
      })
    }

    // Try to init immediately if script is already loaded
    if (window.particlesJS) {
      initParticles()
    }

    // Also listen for script load
    const handleLoad = () => initParticles()
    window.addEventListener('particles-loaded', handleLoad)

    return () => {
      window.removeEventListener('particles-loaded', handleLoad)
    }
  }, [])

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new Event('particles-loaded'))
        }}
      />
      <div 
        id="particles-js" 
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{ background: 'transparent' }}
      />
    </>
  )
}

