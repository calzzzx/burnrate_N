'use client'

import { useI18n } from '@/lib/i18n'
import { ICONS } from '@/lib/icons'

const subs = [
  { name: 'Claude', tier: 'MAX 5X', icon: ICONS.claude, amount: '¥898', payment: '支付宝', due: '11天', dueDate: '4月9日' },
  { name: 'ChatGPT', tier: 'PLUS', icon: ICONS.openai, amount: '¥140', payment: '微信支付', due: '11天', dueDate: '4月9日' },
  { name: 'Vercel', icon: ICONS.vercel, amount: '¥140', payment: 'Visa ····6880', due: '3周', dueDate: '4月24日' },
  { name: 'Obsidian Sync', icon: ICONS.obsidian, amount: '¥70', payment: '微信支付', due: '4周', dueDate: '4月28日' },
  { name: 'Cursor', tier: 'PRO', icon: ICONS.cursor, amount: '$20', payment: 'Visa ····6880', due: '2月', dueDate: '5月15日' },
]

const categories = [
  { label: 'AI', color: '#E8A838', pct: 35 },
  { label: 'Dev', color: '#5B8DEF', pct: 22 },
  { label: 'Design', color: '#E88DB4', pct: 16 },
  { label: 'Media', color: '#6FCF97', pct: 15 },
  { label: 'Cloud', color: '#BB86FC', pct: 12 },
]

export default function AppMockup() {
  const { locale } = useI18n()

  return (
    <div className="relative group">
      <div className="absolute -inset-16 bg-accent/[0.07] rounded-full blur-[80px] transition-all duration-700 group-hover:bg-accent/[0.1]" />
      <div className="relative w-[260px] sm:w-[300px] rounded-[15px] bg-[rgba(18,18,20,0.92)] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src="/icon.png" alt="" className="w-3.5 h-3.5 rounded-sm" />
            <span className="text-[13px] font-semibold tracking-tight text-white/90">BurnRate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/20 hover:text-white/40 cursor-default transition-colors duration-150">{locale === 'en' ? 'Due date' : '到期日'} ↓</span>
            <div className="w-6 h-6 rounded-[8px] bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center cursor-default transition-colors duration-150">
              <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M6 2.5v7M2.5 6h7" /></svg>
            </div>
          </div>
        </div>
        {/* Overview */}
        <div className="px-3 pt-0.5 pb-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[24px] font-bold text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>¥1,248</span>
            <span className="text-[11px] text-white/30 font-medium">/{locale === 'en' ? 'mo' : '月'}</span>
          </div>
          <div className="flex items-baseline flex-wrap mt-1 text-[11px] leading-tight">
            <span className="text-white/55" style={{ fontVariantNumeric: 'tabular-nums' }}>¥41.6</span>
            <span className="text-white/25">/{locale === 'en' ? 'day' : '日'}</span>
            <span className="text-white/15 mx-1">·</span>
            <span className="text-white/55" style={{ fontVariantNumeric: 'tabular-nums' }}>¥14,976</span>
            <span className="text-white/25 ml-0.5">{locale === 'en' ? 'spent' : '已花费'}</span>
            <span className="text-white/15 mx-1">·</span>
            <span className="text-white/55" style={{ fontVariantNumeric: 'tabular-nums' }}>12</span>
            <span className="text-white/25 ml-0.5">{locale === 'en' ? 'subs' : '订阅'}</span>
          </div>
        </div>
        {/* Category bar */}
        <div className="px-3 pt-0.5 pb-1.5">
          <div className="flex h-[4px] rounded-full overflow-hidden gap-[1.5px]">
            {categories.map(c => (
              <div key={c.label} className="rounded-full transition-opacity duration-150 hover:!opacity-100 cursor-default" style={{ width: `${c.pct}%`, backgroundColor: c.color, opacity: 0.75 }} />
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            {categories.map(c => (
              <div key={c.label} className="flex items-center gap-0.5 cursor-default hover:opacity-80 transition-opacity duration-150">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-white/25">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Subscription list */}
        <div className="border-t border-white/[0.06] mt-0.5">
          {subs.map(sub => (
            <div key={sub.name} className="flex items-center justify-between px-3 py-[8px] border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.04] cursor-default transition-colors duration-150">
              <div className="flex items-center gap-2.5">
                <div className="w-[26px] h-[26px] rounded-[8px] bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                  <img src={sub.icon} alt="" className="w-[18px] h-[18px] object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-white/85 font-medium leading-tight">{sub.name}</span>
                    {sub.tier && (
                      <span className="text-[8px] font-semibold text-accent bg-accent/[0.12] px-1.5 py-[1px] rounded leading-tight">{sub.tier}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/25 leading-tight mt-0.5">{sub.payment}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-white/70 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{sub.amount}</div>
                <div className="text-[10px] text-white/25 leading-tight mt-0.5">{sub.due} · {sub.dueDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
