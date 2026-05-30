'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { DOWNLOAD_URL } from '@/lib/config'

export default function Download() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      id="download"
      className="relative py-20 sm:py-40 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 sm:mb-10"
        >
          <img
            src="/app-icon-512.png"
            alt="BurnRate"
            width={112}
            height={112}
            loading="lazy"
            className="w-20 h-20 sm:w-28 sm:h-28 mx-auto rounded-[22px] sm:rounded-[28px] shadow-2xl shadow-black/40"
            draggable={false}
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-6xl font-bold tracking-tight whitespace-pre-line"
        >
          <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            {t.download.title}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-5 text-base sm:text-lg text-white/35"
        >
          {t.download.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <a
            href={DOWNLOAD_URL}
            className="group inline-flex items-center gap-2.5 bg-accent hover:bg-accent/90 text-black px-8 sm:px-10 py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 shadow-[0_0_32px_rgba(232,168,56,0.25)] hover:shadow-[0_0_48px_rgba(232,168,56,0.35)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {t.download.cta}
          </a>

          <span className="text-[13px] text-white/20">{t.download.requirements}</span>
        </motion.div>
      </div>
    </section>
  )
}
