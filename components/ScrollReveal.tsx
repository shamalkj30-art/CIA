'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale'

interface ScrollRevealProps {
  children: ReactNode
  direction?: RevealDirection
  delay?: number
  threshold?: number
  className?: string
  once?: boolean
  staggerChildren?: boolean
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.1,
  className = '',
  once = true,
  staggerChildren = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsRevealed(false)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, once])

  const revealClass = `reveal-${direction}`
  const revealedClass = isRevealed ? 'revealed' : ''
  const staggerClass = staggerChildren ? 'stagger-children' : ''

  return (
    <div
      ref={ref}
      className={`${revealClass} ${revealedClass} ${staggerClass} ${className}`}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}

// Wrapper for multiple items with staggered reveal
interface ScrollRevealGroupProps {
  children: ReactNode
  direction?: RevealDirection
  baseDelay?: number
  staggerDelay?: number
  threshold?: number
  className?: string
}

export function ScrollRevealGroup({
  children,
  direction = 'up',
  baseDelay = 0,
  staggerDelay = 80,
  threshold = 0.1,
  className = '',
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.unobserve(element)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={`reveal-${direction} ${isRevealed ? 'revealed' : ''}`}
              style={{
                animationDelay: isRevealed ? `${baseDelay + index * staggerDelay}ms` : undefined,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
