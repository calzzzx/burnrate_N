'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

export default function Nav() {
  const { locale, t, toggle } = useI18n()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="BurnRate" className="w-7 h-7 rounded-lg" />
          <span className="font-semibold tracking-tight text-[15px]">
            BurnRate
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={locale === 'en' ? 'Switch to Chinese' : '切换到英文'}
            className="text-[13px] text-white/40 hover:text-white/80 transition-colors px-2 py-1"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <a
            href="#download"
            className="text-[13px] font-medium bg-white/10 hover:bg-white/15 text-white/90 px-4 py-1.5 rounded-full transition-colors"
          >
            {t.nav.download}
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
