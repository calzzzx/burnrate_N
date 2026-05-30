'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import AppMockup from './AppMockup'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const resize = () => {
      canvas.width = canvas.offsetWidth * 0.5
      canvas.height = canvas.offsetHeight * 0.5
    }
    resize()

    const orbs = [
      { x: 0.3, y: 0.3, r: 0.35, speed: 0.0003, phase: 0, color: 'rgba(232, 168, 56, 0.07)' },
      { x: 0.7, y: 0.5, r: 0.3, speed: 0.0004, phase: 2, color: 'rgba(232, 168, 56, 0.05)' },
      { x: 0.5, y: 0.7, r: 0.25, speed: 0.0002, phase: 4, color: 'rgba(200, 140, 60, 0.04)' },
    ]

    function draw(t: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(t * orb.speed + orb.phase) * 0.08) * canvas!.width
        const cy = (orb.y + Math.cos(t * orb.speed * 0.7 + orb.phase) * 0.06) * canvas!.height
        const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, orb.r * canvas!.width)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'transparent')
        ctx!.fillStyle = gradient
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      }
      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'blur(60px)' }} />
}

export default function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-8 overflow-hidden">
      {/* Animated mesh gradient background */}
      <MeshGradient />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center max-w-3xl mx-auto px-4 sm:px-6"
      >
        <motion.h1
          variants={fadeUp}
          className="text-[28px] sm:text-6xl font-bold tracking-tight leading-[1.1] whitespace-pre-line"
        >
          <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
            {t.hero.title}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed whitespace-pre-line"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href="https://github.com/mtskyyy/burnrate/releases/latest/download/BurnRate_0.1.0_aarch64.dmg"
              className="group inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-black px-8 py-3 rounded-full font-semibold text-base transition-all duration-200 shadow-[0_0_32px_rgba(232,168,56,0.25)] hover:shadow-[0_0_48px_rgba(232,168,56,0.35)]"
            >
              <AppleIcon />
              {t.hero.cta}
            </a>
            {/* GitHub Stars */}
            <a
              href="https://github.com/mtskyyy/burnrate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80 transition-all duration-200 text-[13px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
          <span className="text-[13px] text-white/25">{t.hero.badge}</span>
        </motion.div>
      </motion.div>

      {/* Floating mockup */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          delay: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="relative z-10 mt-12 sm:mt-16"
      >
        <AppMockup />
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  )
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}
