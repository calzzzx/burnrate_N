import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount } from '../lib/format'

interface Props {
  monthlyTotal: number
  cumulativeTotal: number
  dailyAverage: number
  activeCount: number
  prepaidCount: number
  prepaidTotal: number
  currency: string
  ratesLoading?: boolean
}

const ANIM_DURATION = 600

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export default function OverviewRow({ monthlyTotal, cumulativeTotal, dailyAverage, activeCount, prepaidCount, prepaidTotal, currency, ratesLoading }: Props) {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  // Always animate on mount
  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const p = Math.min(1, elapsed / ANIM_DURATION)
      setProgress(easeOut(p))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const m = monthlyTotal * progress

  return (
    <div className="px-3 pt-0.5 pb-1.5 animate-burn-in">
      {/* Hero: monthly total */}
      <div className="flex items-baseline gap-0.5">
        <span className={`text-[24px] font-bold font-numeric text-text-primary leading-none tracking-tight ${ratesLoading ? 'animate-pulse' : ''}`}>
          {formatAmount(m, currency)}
        </span>
        <span className="text-[11px] text-text-quaternary font-medium">/{t('overview.monthly')}</span>
      </div>

      {/* Secondary stats */}
      <div className="flex items-baseline flex-nowrap whitespace-nowrap mt-1.5 text-[11px] leading-tight">
        <span className="font-numeric text-text-secondary">{formatAmount(dailyAverage, currency)}</span>
        <span className="text-text-quaternary">{t('overview.daily')}</span>
        <span className="text-text-quaternary mx-1">·</span>
        <span className="font-numeric text-text-secondary">{formatAmount(cumulativeTotal + prepaidTotal, currency)}</span>
        <span className="text-text-quaternary ml-0.5">{t('overview.cumulative')}</span>
        <span className="text-text-quaternary mx-1">·</span>
        <span className="font-numeric text-text-secondary tabular-nums">{activeCount}</span>
        <span className="text-text-quaternary ml-0.5">{t('overview.subscriptions')}</span>
        {prepaidCount > 0 && (
          <>
            <span className="text-text-quaternary mx-1">·</span>
            <span className="font-numeric text-text-secondary tabular-nums">{prepaidCount}</span>
            <span className="text-text-quaternary ml-0.5">{t('overview.prepaid')}</span>
          </>
        )}
      </div>
    </div>
  )
}
