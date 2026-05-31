'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { ICONS } from '@/lib/icons'

const row1 = [
  { name: 'ChatGPT', icon: ICONS.openai },
  { name: 'Claude', icon: ICONS.claude },
  { name: 'GitHub', icon: ICONS.github },
  { name: 'Spotify', icon: ICONS.spotify },
  { name: 'Notion', icon: ICONS.notion },
  { name: 'Vercel', icon: ICONS.vercel },
  { name: 'Gemini', icon: ICONS.gemini },
  { name: 'Cursor', icon: ICONS.cursor },
  { name: 'Midjourney', icon: ICONS.midjourney },
  { name: 'Perplexity', icon: ICONS.perplexity },
]

const row2 = [
  { name: 'Netflix', icon: ICONS.netflix },
  { name: 'Slack', icon: ICONS.slack },
  { name: 'YouTube', icon: ICONS.youtube },
  { name: 'Docker', icon: ICONS.docker },
  { name: 'Linear', icon: ICONS.linear },
  { name: 'Discord', icon: ICONS.discord },
  { name: 'Supabase', icon: ICONS.supabase },
  { name: '1Password', icon: ICONS.onePassword },
  { name: 'Telegram', icon: ICONS.telegram },
  { name: 'AWS', icon: ICONS.aws },
]

function LogoRow({ items, reverse }: { items: { name: string; icon: string }[]; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden">
      <div
        className="flex items-center gap-8 sm:gap-16"
        style={{
          animation: `${reverse ? 'scrollReverse' : 'scroll'} ${reverse ? '40s' : '35s'} linear infinite`,
        }}
      >
        {doubled.map((s, i) => (
          <div key={i} className="shrink-0 flex items-center gap-3 opacity-40 hover:opacity-70 transition-opacity duration-300">
            <img src={s.icon} alt={s.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" loading="lazy" />
            <span className="text-[15px] sm:text-base text-white/70 font-medium whitespace-nowrap">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AppShowcase() {
  const { t, locale } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const highlights = [
    {
      title: locale === 'en' ? 'Multi-currency' : '多币种',
      desc: locale === 'en'
        ? 'USD, CNY, EUR, JPY with automatic live exchange rate conversion.'
        : 'USD、CNY、EUR、JPY，实时汇率自动换算。',
      icon: (
        <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      title: locale === 'en' ? 'Smart Categories' : '智能分类',
      desc: locale === 'en'
        ? 'AI, Dev, Design, Media. See exactly where your money goes.'
        : 'AI、开发、设计、影音。清晰追踪金额流向。',
      icon: (
        <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      title: locale === 'en' ? 'Export Anytime' : '随时导出',
      desc: locale === 'en'
        ? 'Full JSON backup and restore. Your data, portable and safe.'
        : '支持完整备份和恢复。数据随身携带，安全无忧。',
      icon: (
        <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ]

  return (
    <section ref={ref} className="relative py-16 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight whitespace-pre-line">
            <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
              {t.showcase.title}
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/35 max-w-lg mx-auto whitespace-pre-line">
            {t.showcase.subtitle}
          </p>
        </motion.div>

        {/* Logo marquee — two rows, opposite directions, more spacing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative space-y-12"
        >
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <LogoRow items={row1} />
          <LogoRow items={row2} reverse />
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5"
        >
          {highlights.map((item, i) => (
            <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/[0.08] border border-accent/[0.12] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-white/85">{item.title}</h3>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
