import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount, getCurrencyParts } from '../lib/format'

interface Props {
  dailyAverage: number
  currency: string
}

const DIGIT_HEIGHT = 46
const DIGITS = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

const pad = (n: number) => String(n).padStart(2, '0')

// Circular progress ring
const RING_SIZE = 56
const RING_STROKE = 3.5
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function BurnCounter({ dailyAverage, currency }: Props) {
  const { t } = useTranslation()

  const currencyInfo = useMemo(() => getCurrencyParts(currency), [currency])
  const { symbol, decimalPlaces } = currencyInfo

  const integerDigitCount = useMemo(() => {
    if (dailyAverage < 1) return 1
    return Math.floor(Math.log10(dailyAverage)) + 1
  }, [dailyAverage])

  const totalDigits = integerDigitCount + decimalPlaces

  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([])
  const ringRef = useRef<SVGCircleElement>(null)
  const ringTextRef = useRef<HTMLSpanElement>(null)
  const timestampRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)
  const entranceDone = useRef(false)
  const entranceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const updateDigits = useCallback(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const dayFraction = Math.min(1, (now.getTime() - midnight.getTime()) / 86400000)
    const burned = dailyAverage * dayFraction

    for (let i = 0; i < totalDigits; i++) {
      const digitIndex = totalDigits - 1 - i
      const shifted = burned * Math.pow(10, decimalPlaces - digitIndex)
      const raw = shifted % 10
      const position = digitIndex === 0 ? raw : Math.floor(raw)

      const col = columnRefs.current[i]
      if (col) {
        col.style.transform = `translateY(${(position - 10) * DIGIT_HEIGHT}px)`
      }

      const wrapper = wrapperRefs.current[i]
      if (wrapper && i < integerDigitCount) {
        const magnitude = Math.pow(10, integerDigitCount - 1 - i)
        wrapper.style.opacity = burned < magnitude ? '0.32' : ''
      }
    }

    const pct = dayFraction * 100
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - dayFraction))
    }
    if (ringTextRef.current) {
      ringTextRef.current.textContent = `${pct.toFixed(2)}%`
    }

    if (timestampRef.current) {
      timestampRef.current.textContent =
        `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }

    // After entrance animation: remove transition from last digit for continuous rolling
    if (!entranceDone.current) {
      entranceDone.current = true
      entranceTimer.current = setTimeout(() => {
        const lastCol = columnRefs.current[totalDigits - 1]
        if (lastCol) lastCol.style.transition = 'none'
      }, 700)
    }
  }, [dailyAverage, decimalPlaces, totalDigits, integerDigitCount])

  // No useLayoutEffect — let browser paint digits at "0" first,
  // then rAF sets actual positions, CSS transition animates the fall

  useEffect(() => {
    if (dailyAverage <= 0) return
    function tick() {
      updateDigits()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(entranceTimer.current)
    }
  }, [dailyAverage, updateDigits])

  const digitColumns = useMemo(() => {
    const cols: { type: 'digit' | 'separator' | 'decimal'; index?: number }[] = []
    for (let i = 0; i < integerDigitCount; i++) {
      const posFromRight = integerDigitCount - 1 - i
      if (posFromRight > 0 && posFromRight % 3 === 0 && i > 0) {
        cols.push({ type: 'separator' })
      }
      cols.push({ type: 'digit', index: i })
    }
    if (decimalPlaces > 0) {
      cols.push({ type: 'decimal' })
      for (let i = 0; i < decimalPlaces; i++) {
        cols.push({ type: 'digit', index: integerDigitCount + i })
      }
    }
    return cols
  }, [integerDigitCount, decimalPlaces])

  const digitClass = 'text-[36px] font-bold font-numeric text-text-primary leading-none tracking-tight tabular-nums'

  if (dailyAverage <= 0) {
    return (
      <div className="flex flex-col justify-center h-full px-3">
        <span className={digitClass}>
          {symbol}0{decimalPlaces > 0 ? '.' + '0'.repeat(decimalPlaces) : ''}
        </span>
        <div className="text-[11px] text-text-quaternary mt-2">{t('burn.paused')}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-3 animate-burn-in">
      {/* Label + hero: centered in remaining space above timestamp */}
      <div className="flex-1 flex flex-col justify-center min-h-0 pb-2">
        <div className="text-[11px] text-text-quaternary mb-0.5 translate-y-1">{t('burn.todayLabel')}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline burn-glow">
          <span
            className={digitClass + ' mr-0.5'}
            style={{ lineHeight: `${DIGIT_HEIGHT}px` }}
          >
            {symbol}
          </span>
          <div className="flex" style={{ height: DIGIT_HEIGHT }}>
            {digitColumns.map((col, idx) => {
              if (col.type === 'separator') {
                return (
                  <span key={`sep-${idx}`} className={digitClass} style={{ lineHeight: `${DIGIT_HEIGHT}px` }}>
                    {currencyInfo.groupSeparator}
                  </span>
                )
              }
              if (col.type === 'decimal') {
                return (
                  <span key="decimal" className={digitClass} style={{ lineHeight: `${DIGIT_HEIGHT}px` }}>
                    {currencyInfo.decimalSeparator}
                  </span>
                )
              }
              const i = col.index!
              return (
                <div
                  key={`d-${i}`}
                  ref={el => { wrapperRefs.current[i] = el }}
                  className="overflow-hidden transition-opacity duration-300"
                  style={{ height: DIGIT_HEIGHT }}
                >
                  <div
                    ref={el => { columnRefs.current[i] = el }}
                    className="burn-digit-column"
                    style={{
                      transform: `translateY(${-10 * DIGIT_HEIGHT}px)`,
                      transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    {DIGITS.map((d, j) => (
                      <span
                        key={j}
                        className={'block text-center ' + digitClass}
                        style={{ height: DIGIT_HEIGHT, lineHeight: `${DIGIT_HEIGHT}px` }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Circular day-progress ring */}
        <div className="relative shrink-0 mr-0.5" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="block" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={RING_STROKE}
            />
            <circle
              ref={ringRef}
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="var(--color-accent)" strokeOpacity="0.7"
              strokeWidth={RING_STROKE} strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={RING_CIRCUMFERENCE}
              style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          <span
            ref={ringTextRef}
            className="absolute inset-0 flex items-center justify-center text-[11px] font-numeric text-text-tertiary tabular-nums"
          />
        </div>
        </div>
      </div>

      {/* Timestamp + daily rate — pinned at bottom */}
      <div className="flex items-baseline gap-1.5 pb-1.5 text-[11px] leading-tight">
        <span ref={timestampRef} className="font-numeric text-text-tertiary tabular-nums" />
        <span className="text-text-quaternary">·</span>
        <span className="text-text-quaternary">
          {t('burn.ofDaily', { amount: formatAmount(dailyAverage, currency) })}
        </span>
      </div>
    </div>
  )
}
