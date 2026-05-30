import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface Props {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
}

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']
const WEEK_DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function parseDate(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return { year: y, month: m, day: d }
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function DatePicker({ value, onChange }: Props) {
  const parsed = parseDate(value || new Date().toISOString().slice(0, 10))
  const [viewYear, setViewYear] = useState(parsed.year)
  const [viewMonth, setViewMonth] = useState(parsed.month)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 })

  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const weekDays = isZh ? WEEK_DAYS : WEEK_DAYS_EN

  const updatePos = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropH = dropdownRef.current.offsetHeight
    const gap = 6
    const right = window.innerWidth - rect.right

    if (rect.bottom + gap + dropH <= window.innerHeight) {
      setPos({ top: rect.bottom + gap, right })
    } else {
      setPos({ bottom: window.innerHeight - rect.top + gap, right })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // Position after first paint so dropdownRef is mounted
    requestAnimationFrame(updatePos)
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, updatePos])

  useEffect(() => {
    if (value) {
      const p = parseDate(value)
      setViewYear(p.year)
      setViewMonth(p.month)
    }
  }, [value])

  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const days = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfWeek(viewYear, viewMonth)
  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1) }
    else setViewMonth(viewMonth + 1)
  }

  const selectDay = (day: number) => {
    onChange(toDateStr(viewYear, viewMonth, day))
    setOpen(false)
  }

  const displayValue = value
    ? (() => {
        const p = parseDate(value)
        return `${p.year}/${pad(p.month)}/${pad(p.day)}`
      })()
    : ''

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-transparent text-[13px] font-numeric text-text-primary text-right outline-none cursor-default flex items-center gap-1.5"
      >
        <span>{displayValue}</span>
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-text-quaternary shrink-0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="12" height="11" rx="2" />
          <path d="M2 6.5h12" />
          <path d="M5.5 1.5v3M10.5 1.5v3" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-[196px] rounded-[9px] border border-white/[0.10] bg-[rgba(28,28,30,0.78)] shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-2xl overflow-hidden"
          style={{ top: pos.top, bottom: pos.bottom, right: pos.right }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-2 pt-2 pb-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
            >
              <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
            <span className="text-[11px] font-medium text-text-primary tracking-tight">
              {isZh ? `${viewYear}年${viewMonth}月` : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][viewMonth - 1]} ${viewYear}`}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
            >
              <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-1.5 pb-0">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[9px] text-text-quaternary leading-5">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-1.5 pb-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isToday = dateStr === todayStr

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    h-6 rounded text-[11px] font-numeric cursor-default transition-colors
                    ${isSelected
                      ? 'bg-accent text-[rgba(18,18,20,0.96)] font-semibold'
                      : isToday
                        ? 'text-accent font-medium hover:bg-white/[0.06]'
                        : 'text-text-secondary hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
