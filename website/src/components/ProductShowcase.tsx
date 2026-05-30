'use client'

import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { ICONS } from '@/lib/icons'

const categories = [
  { label: 'AI', color: '#E8A838', pct: 35 },
  { label: 'Dev', color: '#5B8DEF', pct: 22 },
  { label: 'Design', color: '#E88DB4', pct: 16 },
  { label: 'Media', color: '#6FCF97', pct: 15 },
  { label: 'Cloud', color: '#BB86FC', pct: 12 },
]

interface SubItem {
  name: string
  tier?: string
  icon: string
  amount: string
  payment: string
  due: string
  dueDate: string
}

const subs: SubItem[] = [
  { name: 'Claude', tier: 'MAX 5X', icon: ICONS.claude, amount: '¥898', payment: '支付宝', due: '11天', dueDate: '4月9日' },
  { name: 'ChatGPT', tier: 'PLUS', icon: ICONS.openai, amount: '¥140', payment: '微信支付', due: '11天', dueDate: '4月9日' },
  { name: 'Cursor', tier: 'PRO', icon: ICONS.cursor, amount: '¥140', payment: 'Visa ····6880', due: '3周', dueDate: '4月24日' },
  { name: 'Obsidian Sync', icon: ICONS.obsidian, amount: '¥70', payment: '微信支付', due: '4周', dueDate: '4月28日' },
]

function SubRow({ sub, compact, interactive }: { sub: SubItem; compact?: boolean; interactive?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-[8px] border-b border-white/[0.04] last:border-b-0 transition-colors duration-150 ${interactive ? 'cursor-default hover:bg-white/[0.04]' : ''}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-[26px] h-[26px] rounded-[8px] bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0">
          <img src={sub.icon} alt="" loading="lazy" className="w-[18px] h-[18px] object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-white/85 font-medium leading-tight">{sub.name}</span>
            {sub.tier && (
              <span className="text-[8px] font-semibold text-accent bg-accent/[0.12] px-1.5 py-[1px] rounded leading-tight">{sub.tier}</span>
            )}
          </div>
          {!compact && <div className="text-[10px] text-white/25 leading-tight mt-0.5">{sub.payment}</div>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[12px] text-white/70 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{sub.amount}</div>
        {!compact && <div className="text-[10px] text-white/25 leading-tight mt-0.5">{sub.due} · {sub.dueDate}</div>}
      </div>
    </div>
  )
}

function OverviewMockup({ locale }: { locale: string }) {
  return (
    <div className="w-full rounded-[14px] bg-[rgba(18,18,20,0.92)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <img src="/icon.png" alt="" className="w-3.5 h-3.5 rounded-sm" />
          <span className="text-[12px] font-semibold text-white/90">BurnRate</span>
        </div>
        <div className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center cursor-default transition-colors duration-150">
          <svg className="w-2.5 h-2.5 text-white/40" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M6 2.5v7M2.5 6h7" /></svg>
        </div>
      </div>
      <div className="px-3 pt-0 pb-1">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[22px] font-bold text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>¥1,248</span>
          <span className="text-[10px] text-white/30 font-medium">/{locale === 'en' ? 'mo' : '月'}</span>
        </div>
        <div className="flex items-baseline flex-wrap mt-1 text-[10px] leading-tight">
          <span className="text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>¥41.6</span>
          <span className="text-white/20">/{locale === 'en' ? 'day' : '日'}</span>
          <span className="text-white/10 mx-1">·</span>
          <span className="text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>¥14,976</span>
          <span className="text-white/20 ml-0.5">{locale === 'en' ? 'spent' : '已花费'}</span>
        </div>
      </div>
      <div className="px-3 pt-0.5 pb-1.5">
        <div className="flex h-[3px] rounded-full overflow-hidden gap-[1px]">
          {categories.map(c => (
            <div
              key={c.label}
              className="rounded-full transition-opacity duration-150 hover:!opacity-100 cursor-default"
              style={{ width: `${c.pct}%`, backgroundColor: c.color, opacity: 0.7 }}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.05] flex-1">
        {subs.slice(0, 4).map(sub => <SubRow key={sub.name} sub={sub} interactive />)}
      </div>
    </div>
  )
}

const BURN_DH = 22
const BURN_DIGITS = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

const burnSubs: SubItem[] = [
  { name: 'Bilibili 大会员', icon: '/icons/bilibili.svg', amount: '¥25', payment: '支付宝', due: '5天', dueDate: '4月5日' },
  { name: '网易云音乐', icon: '/icons/NetEase_Music_icon.png', amount: '¥15', payment: '微信支付', due: '2周', dueDate: '4月14日' },
  { name: '百度网盘', icon: '/icons/baidu-netdisk.svg', amount: '¥30', payment: '支付宝', due: '3周', dueDate: '4月21日' },
  { name: '迅雷', icon: '/icons/Thunder_logo.svg', amount: '¥15', payment: '微信支付', due: '1月', dueDate: '5月1日' },
]

function RollingDigit({ colRef }: { colRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="overflow-hidden relative inline-block align-bottom" style={{ height: BURN_DH, width: '0.58em' }}>
      <div ref={colRef} className="absolute inset-x-0" style={{ transition: 'none' }}>
        {BURN_DIGITS.map((d, j) => (
          <div key={j} className="flex items-center justify-center" style={{ height: BURN_DH }}>{d}</div>
        ))}
      </div>
    </div>
  )
}

function BurnMockup({ locale, active }: { locale: string; active: boolean }) {
  const col1Ref = useRef<HTMLDivElement>(null)
  const col2Ref = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const pct = 49.1

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    let rafId: number
    const start = performance.now()
    function update(timestamp: number) {
      const elapsed = (timestamp - start) / 1000
      const unitsCycle = elapsed / 1.0
      const units = unitsCycle % 10
      const tens = Math.floor(unitsCycle / 10) % 10
      const unitsIdx = units === 0 ? 0 : 10 - units
      // Tens: just swap text content, no rolling
      if (col1Ref.current) col1Ref.current.textContent = String(tens)
      if (col2Ref.current) col2Ref.current.style.transform = `translateY(${-unitsIdx * BURN_DH}px)`
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [active])

  return (
    <div className="w-full rounded-[14px] bg-[rgba(18,18,20,0.92)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-full">
      {/* Header — identical to Overview */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <img src="/icon.png" alt="" className="w-3.5 h-3.5 rounded-sm" />
          <span className="text-[12px] font-semibold text-white/90">BurnRate</span>
        </div>
        <div className="w-5 h-5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center cursor-default transition-colors duration-150">
          <svg className="w-2.5 h-2.5 text-white/40" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M6 2.5v7M2.5 6h7" /></svg>
        </div>
      </div>
      {/* Amount area — identical padding to Overview (pt-0 pb-1) */}
      <div className="px-3 pt-0 pb-1 relative">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[22px] font-bold text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ¥26.<span ref={col1Ref}>0</span><RollingDigit colRef={col2Ref} />
          </span>
        </div>
        {/* Progress ring — absolute so it doesn't affect layout */}
        <div className="absolute right-3 -top-0.5 w-[44px] h-[44px]">
          <svg className="w-[44px] h-[44px]" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
            <circle cx="22" cy="22" r="19" fill="none" stroke="#E8A838" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 19} strokeDashoffset={2 * Math.PI * 19 * (1 - pct / 100)} transform="rotate(-90 22 22)" opacity="0.85" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[7.5px] text-accent/80 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
          </div>
        </div>
        <div className="relative top-[3px] flex items-baseline flex-wrap mt-1 text-[10px] leading-tight">
          <span className="text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>¥62.83</span>
          <span className="text-white/20">/{locale === 'en' ? 'day' : '日'}</span>
          <span className="text-white/10 mx-1">·</span>
          <span className="text-white/30">{locale === 'en' ? 'burned today' : '今日消耗'}</span>
        </div>
      </div>
      {/* Spacer — matches Overview's category bar area (pt-0.5 pb-1.5 + 3px bar) */}
      <div className="pt-1.5 pb-1.5" />
      {/* Subscription list — 4 items like Overview */}
      <div className="border-t border-white/[0.05] flex-1">
        {burnSubs.map(sub => <SubRow key={sub.name} sub={sub} interactive />)}
      </div>
    </div>
  )
}

function AddServiceMockup({ locale }: { locale: string }) {
  const presets = [
    { name: 'Spotify', icon: ICONS.spotify, price: '$9.99' },
    { name: 'Midjourney', icon: ICONS.midjourney, price: '$30' },
    { name: 'Perplexity', icon: ICONS.perplexity, price: '$20' },
    { name: 'GitHub Copilot', icon: ICONS.github, price: '$10' },
    { name: 'Gemini', icon: ICONS.gemini, price: '$20' },
  ]
  return (
    <div className="w-full rounded-[14px] bg-[rgba(18,18,20,0.92)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 flex items-center gap-2">
        <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M1 6h10M6 1v10" /></svg>
        <span className="text-[12px] font-semibold text-white/90">{locale === 'en' ? 'Add Service' : '添加服务'}</span>
      </div>
      <div className="px-3 pb-3">
        <div className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] flex items-center px-2.5 cursor-text transition-colors duration-150">
          <svg className="w-3 h-3 text-white/20 mr-1.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3.5" /><path d="M8 8l2.5 2.5" /></svg>
          <span className="text-[11px] text-white/20">{locale === 'en' ? 'Search services...' : '搜索服务…'}</span>
        </div>
      </div>
      <div className="border-t border-white/[0.05] flex-1">
        {presets.map(p => (
          <div key={p.name} className="flex items-center justify-between px-3 py-[8px] border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.04] cursor-default transition-colors duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-[8px] bg-white/[0.04] flex items-center justify-center overflow-hidden">
                <img src={p.icon} alt="" loading="lazy" className="w-[18px] h-[18px] object-contain" />
              </div>
              <span className="text-[12px] text-white/75">{p.name}</span>
            </div>
            <span className="text-[11px] text-white/30" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductShowcase() {
  const { locale } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const cards = [
    { label: locale === 'en' ? 'Overview' : '一览无遗', desc: locale === 'en' ? 'Monthly cost, daily average, category breakdown' : '月度费用、日均消耗、分类统计', mockup: <OverviewMockup locale={locale} /> },
    { label: locale === 'en' ? 'Burn Counter' : '消耗计数', desc: locale === 'en' ? 'Real-time daily spending with progress ring' : '实时每日消耗，进度环可视化', mockup: <BurnMockup locale={locale} active={inView} /> },
    { label: locale === 'en' ? 'Quick Add' : '快速添加', desc: locale === 'en' ? '80+ presets with fuzzy search' : '80+ 预设服务，也能自定义添加', mockup: <AddServiceMockup locale={locale} /> },
  ]

  return (
    <section ref={ref} className="relative py-16 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-stretch gap-10 sm:gap-14 max-w-[280px] sm:max-w-[900px] mx-auto">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="flex flex-col items-center group h-full"
            >
              <div className="relative w-full flex-1 transition-transform duration-500 ease-out group-hover:-translate-y-2">
                <div className="absolute -inset-8 bg-accent/[0.02] rounded-full blur-[40px] pointer-events-none transition-all duration-500 group-hover:bg-accent/[0.06]" />
                <div className="relative h-full transition-shadow duration-500 rounded-[14px] group-hover:shadow-[0_8px_40px_rgba(232,168,56,0.08)]">
                  {card.mockup}
                </div>
              </div>
              <h3 className="mt-6 text-[15px] font-semibold text-white/80">{card.label}</h3>
              <p className="mt-1 text-[13px] text-white/30 text-center">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
