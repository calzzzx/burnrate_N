'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const icons = [
  // Menu bar — dot pulses on hover
  <svg key="menubar" className="w-6 h-6 group-hover/card:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="3" rx="1" opacity="0.4" />
    <circle cx="18" cy="5.5" r="1.5" fill="#E8A838" stroke="none" className="group-hover/card:animate-pulse" />
    <rect x="4" y="10" width="16" height="10" rx="2" opacity="0.25" />
  </svg>,
  // Lightning — slight rotate on hover
  <svg key="instant" className="w-6 h-6 group-hover/card:rotate-12 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>,
  // Pulse — scale on hover
  <svg key="realtime" className="w-6 h-6 group-hover/card:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h4l3-9 4 18 3-9h6" />
  </svg>,
  // Shield — slight lift on hover
  <svg key="private" className="w-6 h-6 group-hover/card:-translate-y-0.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>,
]

export default function Features() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const features = [
    { ...t.features.menubar, icon: icons[0] },
    { ...t.features.instant, icon: icons[1] },
    { ...t.features.realtime, icon: icons[2] },
    { ...t.features.private, icon: icons[3] },
  ]

  return (
    <section ref={ref} className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="text-center mb-10 sm:mb-16"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight whitespace-pre-line">
          <span className="text-white">{t.features.heading}</span>
          <br />
          <span className="text-white/30">{t.features.subheading}</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
            className="group/card p-5 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/[0.08] border border-accent/[0.12] flex items-center justify-center mb-4 sm:mb-5 text-accent group-hover/card:bg-accent/[0.14] group-hover/card:border-accent/[0.2] transition-all duration-300">
              {f.icon}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white/90">{f.title}</h3>
            <p className="mt-2 text-sm sm:text-[15px] text-white/35 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
