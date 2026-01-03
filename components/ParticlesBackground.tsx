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
      if (initialized.current) return
      if (!window.particlesJS) return
      
      initialized.current = true

      window.particlesJS('particles-js', {
        particles: {
          number: { 
            value: 80, 
            density: { enable: true, value_area: 800 } 
          },
          color: { value: '#0F766E' },
          shape: { type: 'circle' },
          opacity: { 
            value: 0.5, 
            random: false,
            anim: { enable: false }
          },
          size: { 
            value: 3, 
            random: true,
            anim: { enable: false }
          },
          line_linked: { 
            enable: true, 
            distance: 150, 
            color: '#0F766E', 
            opacity: 0.4, 
            width: 1 
          },
          move: { 
            enable: true, 
            speed: 2, 
            direction: 'none', 
            random: false, 
            straight: false, 
            out_mode: 'out', 
            bounce: false 
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: { 
            onhover: { enable: true, mode: 'repulse' }, 
            onclick: { enable: true, mode: 'push' }, 
            resize: true 
          },
          modes: { 
            grab: { distance: 400, line_linked: { opacity: 1 } }, 
            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
            repulse: { distance: 200, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 }
          }
        },
        retina_detect: true
      })
    }

    // Try to init immediately if script is already loaded
    if (window.particlesJS) {
      initParticles()
    }

    // Also listen for script load event
    const handleLoad = () => {
      setTimeout(initParticles, 100)
    }
    window.addEventListener('particles-ready', handleLoad)

    return () => {
      window.removeEventListener('particles-ready', handleLoad)
    }
  }, [])

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new Event('particles-ready'))
        }}
      />
      <div 
        id="particles-js" 
        className="fixed inset-0 z-0"
        style={{ 
          width: '100%',
          height: '100%',
          pointerEvents: 'auto'
        }}
      />
    </>
  )
}
