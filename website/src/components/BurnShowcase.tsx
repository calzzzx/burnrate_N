'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
})

const DIGIT_HEIGHT_SM = 64
const DIGIT_HEIGHT_LG = 108
const ROLLING_DIGITS = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

export default function BurnShowcase() {
  const { t, locale } = useI18n()
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-15%' })

  const symbol = locale === 'en' ? '$' : '¥'
  // Static part: 269. — only last 2 digits roll
  const staticDigits = [2, 6, 9]

  const [isSmall, setIsSmall] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- viewport size is only knowable after mount
    setIsSmall(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  const DH = isSmall ? DIGIT_HEIGHT_SM : DIGIT_HEIGHT_LG

  const dhRef = useRef(DH)
  useEffect(() => {
    dhRef.current = DH
  }, [DH])

  const col1Ref = useRef<HTMLDivElement>(null)
  const col2Ref = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true

    let rafId: number
    const start = performance.now()

    function update(timestamp: number) {
      const elapsed = (timestamp - start) / 1000
      // Units digit: ~1s per digit, full cycle = 10s
      const unitsCycle = elapsed / 1.0
      const units = unitsCycle % 10
      // Tens digit: advances by 1 each time units completes a full 0→9 cycle
      const tens = Math.floor(unitsCycle / 10) % 10

      // Map to falling index: 0→0, 9→1, 8→2 ... 1→9, 0→10
      const tensIdx = tens === 0 ? 0 : 10 - tens
      const unitsIdx = units === 0 ? 0 : 10 - units

      if (col1Ref.current) {
        col1Ref.current.style.transform = `translateY(${-tensIdx * dhRef.current}px)`
      }
      if (col2Ref.current) {
        col2Ref.current.style.transform = `translateY(${-unitsIdx * dhRef.current}px)`
      }

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [inView])

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-32 overflow-hidden"
    >
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-3xl sm:text-5xl font-bold tracking-tight whitespace-pre-line"
        >
          <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
            {t.burn.title}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 text-base sm:text-lg text-white/35 max-w-lg mx-auto whitespace-pre-line"
        >
          {t.burn.subtitle}
        </motion.p>

        {/* Rolling digit counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 sm:mt-20 flex flex-col items-center"
        >
          <div
            className={`flex items-center ${spaceGrotesk.className}`}
            style={{
              fontSize: isSmall ? 56 : 96,
              lineHeight: 1,
              fontWeight: 700,
              color: '#E8A838',
              fontVariantNumeric: 'tabular-nums lining-nums',
              textShadow: '0 0 60px rgba(232, 168, 56, 0.25), 0 0 120px rgba(232, 168, 56, 0.08)',
              letterSpacing: '0.02em',
            }}
          >
            {/* Currency symbol */}
            <span className="mr-2 sm:mr-3 text-white/20 font-medium" style={{ fontSize: isSmall ? 30 : 52 }}>{symbol}</span>

            {/* Static digits: 2 6 9 */}
            {staticDigits.map((d, i) => (
              <div key={i} style={{ width: '0.62em', textAlign: 'center' }}>{d}</div>
            ))}

            {/* Decimal point */}
            <span className="text-white/25" style={{ width: '0.3em', textAlign: 'center' }}>.</span>

            {/* Rolling tens digit */}
            <div className="overflow-hidden relative" style={{ height: DH, width: '0.62em' }}>
              <div
                ref={col1Ref}
                className="absolute inset-x-0"
                style={{ transition: 'none' }}
              >
                {ROLLING_DIGITS.map((d, j) => (
                  <div key={j} className="flex items-center justify-center" style={{ height: DH }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Rolling units digit */}
            <div className="overflow-hidden relative" style={{ height: DH, width: '0.62em' }}>
              <div
                ref={col2Ref}
                className="absolute inset-x-0"
                style={{ transition: 'none' }}
              >
                {ROLLING_DIGITS.map((d, j) => (
                  <div key={j} className="flex items-center justify-center" style={{ height: DH }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-lg sm:text-xl text-white/30 font-medium tracking-wide uppercase">
            {t.burn.label}
          </p>
          <p className="mt-2 text-base text-white/20">{t.burn.ofDaily}</p>
        </motion.div>
      </div>
    </section>
  )
}
