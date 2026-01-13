'use client'

import { useEffect, useRef } from 'react'

function AnimatedBackground() {
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
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.5 + 0.2
        const colors = ['99, 102, 241', '139, 92, 246', '168, 85, 247', '249, 115, 22']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Mouse interaction
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 100) {
          const force = (100 - distance) / 100
          this.x -= dx * force * 0.01
          this.y -= dy * force * 0.01
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
      const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000))
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

          if (distance < 120) {
            ctx!.beginPath()
            ctx!.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 120)})`
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
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Primary orb - top left */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary orb - bottom right */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          bottom: '-5%',
          right: '-5%',
          filter: 'blur(60px)',
        }}
      />

      {/* Accent orb - center */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Small accent orbs */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
          top: '20%',
          right: '20%',
          filter: 'blur(40px)',
          animation: 'float 7s ease-in-out infinite',
          animationDelay: '-2s',
        }}
      />

      <div
        className="absolute w-[150px] h-[150px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
          bottom: '30%',
          left: '15%',
          filter: 'blur(40px)',
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '-4s',
        }}
      />
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Base gradient background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'var(--background)',
          zIndex: -2,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          zIndex: -1,
        }}
      />

      {/* Animated gradient orbs */}
      <GradientOrbs />

      {/* Particle canvas */}
      <AnimatedBackground />

      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none grain-overlay"
        style={{ zIndex: 1 }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
