'use client'

import { useEffect, useRef } from 'react'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    let mouseX = 0
    let mouseY = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      color: string

      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.size = Math.random() * 1.5 + 0.3
        this.speedX = (Math.random() - 0.5) * 0.2
        this.speedY = (Math.random() - 0.5) * 0.2
        this.opacity = Math.random() * 0.3 + 0.1
        const colors = ['129, 140, 248', '167, 139, 250', '192, 132, 252', '251, 146, 60']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Mouse interaction - subtle repel
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 80) {
          const force = (80 - distance) / 80
          this.x -= dx * force * 0.008
          this.y -= dy * force * 0.008
        }

        // Wrap around edges
        if (this.x < 0) this.x = canvas!.width
        if (this.x > canvas!.width) this.x = 0
        if (this.y < 0) this.y = canvas!.height
        if (this.y > canvas!.height) this.y = 0
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`
        ctx.fill()
      }
    }

    const init = () => {
      particles = []
      const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 20000))
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx!.beginPath()
            ctx!.strokeStyle = `rgba(129, 140, 248, ${0.06 * (1 - distance / 100)})`
            ctx!.lineWidth = 0.5
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      drawConnections()
      animationFrameId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    resize()
    init()
    animate()

    window.addEventListener('resize', () => {
      resize()
      init()
    })
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60"
      style={{ zIndex: 0 }}
    />
  )
}

function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Primary orb - top left */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)',
          top: '-5%',
          left: '-5%',
          filter: 'blur(80px)',
        }}
      />

      {/* Secondary orb - bottom right */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
          bottom: '10%',
          right: '-5%',
          filter: 'blur(80px)',
        }}
      />

      {/* Accent orb - center bottom */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.08) 0%, transparent 70%)',
          bottom: '20%',
          left: '30%',
          filter: 'blur(60px)',
        }}
      />

      {/* Small accent orb - top right */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.1) 0%, transparent 70%)',
          top: '15%',
          right: '15%',
          filter: 'blur(50px)',
          animation: 'float 8s ease-in-out infinite',
          animationDelay: '-2s',
        }}
      />
    </div>
  )
}

export function AnimatedBackground() {
  return (
    <>
      {/* Base dark gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: 'var(--background)',
          zIndex: -2,
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(129, 140, 248, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(129, 140, 248, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          zIndex: -1,
        }}
      />

      {/* Gradient orbs */}
      <GradientOrbs />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
          zIndex: 1,
        }}
      />
    </>
  )
}

export default AnimatedBackground
