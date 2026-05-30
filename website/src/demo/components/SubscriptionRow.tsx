import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Subscription } from '../types'
import { formatAmount, relativeDate, mediumDate, daysUntil } from '../lib/format'
import ServiceIcon from './ServiceIcon'

const DELETE_ACTION_WIDTH = 36
const SWIPE_THRESHOLD = 22

interface Props {
  subscription: Subscription
  topupTotal?: number
  onViewTopups?: () => void
  onClick: () => void
  onDelete: () => void
  isDeleteOpen: boolean
  onDeleteOpenChange: (open: boolean) => void
  onReorderStart: (pointerId: number, clientY: number) => void
  onReorderMove: (pointerId: number, clientY: number) => void
  onReorderEnd: (pointerId: number) => void
  isDragging: boolean
  dragTranslateY?: number
}

type GestureMode = 'pending' | 'swipe' | 'scroll' | 'reorder' | null

export default function SubscriptionRow({
  subscription,
  topupTotal,
  onViewTopups,
  onClick,
  onDelete,
  isDeleteOpen,
  onDeleteOpenChange,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
  isDragging,
  dragTranslateY = 0,
}: Props) {
  const { t } = useTranslation()
  const { name, icon_key, amount, currency, next_billing, payment_channel, tier, auto_renew, billing_type } = subscription
  const isPrepaid = billing_type === 'prepaid'

  const days = isPrepaid ? 0 : daysUntil(next_billing)
  const isExpiredSub = !isPrepaid && !auto_renew && days < 0
  const countdown = isExpiredSub ? t('time.expired') : (!isPrepaid ? relativeDate(next_billing, t) : '')
  const dateStr = isPrepaid ? '' : mediumDate(next_billing)
  const isOverdue = !isPrepaid && auto_renew && days < 0
  const isSoon = !isPrepaid && !isExpiredSub && days >= 0 && days <= 7

  const [offset, setOffset] = useState(isDeleteOpen ? -DELETE_ACTION_WIDTH : 0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)
  const gestureRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startOffset: 0,
    mode: null as GestureMode,
  })

  useEffect(() => {
    if (isSwiping) return

    const nextOffset = isDeleteOpen ? -DELETE_ACTION_WIDTH : 0
    const frame = requestAnimationFrame(() => setOffset(nextOffset))
    return () => cancelAnimationFrame(frame)
  }, [isDeleteOpen, isSwiping])

  const revealProgress = useMemo(
    () => Math.min(1, Math.abs(offset) / DELETE_ACTION_WIDTH),
    [offset]
  )

  function resetGesture(pointerId?: number) {
    if (pointerId !== undefined && contentRef.current?.hasPointerCapture(pointerId)) {
      contentRef.current.releasePointerCapture(pointerId)
    }

    gestureRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffset: 0,
      mode: null,
    }
    setIsSwiping(false)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('[data-no-swipe]')) return

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: isDeleteOpen ? -DELETE_ACTION_WIDTH : 0,
      mode: 'pending',
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (gestureRef.current.pointerId !== event.pointerId) return

    const dx = event.clientX - gestureRef.current.startX
    const dy = event.clientY - gestureRef.current.startY

    if (gestureRef.current.mode === 'pending') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return

      if (Math.abs(dx) > Math.abs(dy) + 2) {
        gestureRef.current.mode = 'swipe'
        contentRef.current?.setPointerCapture(event.pointerId)
        setIsSwiping(true)
      } else if (event.pointerType === 'mouse' && Math.abs(dy) > Math.abs(dx) + 2) {
        gestureRef.current.mode = 'reorder'
        contentRef.current?.setPointerCapture(event.pointerId)
        suppressClickRef.current = true
        onReorderStart(event.pointerId, event.clientY)
      } else {
        gestureRef.current.mode = 'scroll'
      }
    }

    if (gestureRef.current.mode === 'reorder') {
      event.preventDefault()
      suppressClickRef.current = true
      onReorderMove(event.pointerId, event.clientY)
      return
    }

    if (gestureRef.current.mode !== 'swipe') return

    event.preventDefault()
    suppressClickRef.current = true

    const rawOffset = gestureRef.current.startOffset + dx
    const nextOffset =
      rawOffset > 0
        ? 0
        : rawOffset < -DELETE_ACTION_WIDTH
          ? -DELETE_ACTION_WIDTH + (rawOffset + DELETE_ACTION_WIDTH) * 0.12
          : rawOffset

    setOffset(nextOffset)
  }

  function finalizeGesture(pointerId: number) {
    if (gestureRef.current.pointerId !== pointerId) return

    if (gestureRef.current.mode === 'swipe') {
      const shouldOpen = offset <= -SWIPE_THRESHOLD
      setOffset(shouldOpen ? -DELETE_ACTION_WIDTH : 0)
      onDeleteOpenChange(shouldOpen)
    }

    if (gestureRef.current.mode === 'reorder') {
      onReorderEnd(pointerId)
    }

    resetGesture(pointerId)
  }

  function handleActivate() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    if (isDeleteOpen) {
      onDeleteOpenChange(false)
      return
    }

    onClick()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActivate()
    }
  }

  function handleDelete() {
    if (isDeleting) return
    setIsDeleting(true)

    const row = rowRef.current
    if (!row) { onDelete(); return }

    const height = row.offsetHeight
    row.style.height = `${height}px`

    requestAnimationFrame(() => {
      row.style.transition = 'opacity 250ms ease, height 280ms ease 80ms, transform 250ms ease'
      row.style.opacity = '0'
      row.style.height = '0'
      row.style.transform = 'translateX(-30px)'

      let done = false
      const finish = () => {
        if (done) return
        done = true
        onDelete()
      }

      row.addEventListener('transitionend', function handler(e) {
        if (e.propertyName !== 'height') return
        row.removeEventListener('transitionend', handler)
        finish()
      })
      // Fallback if transitionend never fires (e.g. unmount race)
      setTimeout(finish, 400)
    })
  }

  return (
    <div ref={rowRef} className={`relative ${isDragging ? 'z-30' : ''}`} style={{ overflow: isDeleting ? 'hidden' : undefined }}>
      <div
        className={`absolute inset-y-0 right-0 flex w-[36px] items-center justify-end pr-[6.5px] transition-opacity duration-200 ${
          revealProgress > 0.05 ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        data-no-swipe
        role="button"
        tabIndex={-1}
        aria-label={`Delete ${name}`}
        onClick={(event) => {
          event.stopPropagation()
          handleDelete()
        }}
        style={{ opacity: revealProgress, cursor: 'pointer' }}
      >
        <svg
          className="delete-icon"
          width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="var(--color-danger)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M2.5 4h11" />
          <path d="M5.5 4V2.75a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4" />
          <path d="M3.75 4v8.5a1.25 1.25 0 0 0 1.25 1.25h6a1.25 1.25 0 0 0 1.25-1.25V4" />
          <path d="M6.5 6.75v3.5" />
          <path d="M9.5 6.75v3.5" />
        </svg>
      </div>

      <div
        ref={contentRef}
        role="button"
        tabIndex={0}
        aria-label={name}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finalizeGesture(event.pointerId)}
        onPointerCancel={(event) => finalizeGesture(event.pointerId)}
        className={`mac-list-row group relative flex items-center gap-2.5 px-2 py-1.5 text-left cursor-default ${isDragging ? 'z-30' : 'z-10'}`}
        style={{
          transform: `translate3d(${offset}px, ${dragTranslateY}px, 0) scale(${isDragging ? 0.985 : 1})`,
          transition: isSwiping || isDragging
            ? 'none'
            : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease, opacity 240ms ease',
          background: isDragging ? 'rgba(36, 36, 40, 0.78)' : undefined,
          borderColor: isDragging ? 'rgba(255,255,255,0.12)' : undefined,
          boxShadow: isDragging ? '0 14px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)' : undefined,
          backdropFilter: isDragging ? 'blur(18px)' : undefined,
          WebkitBackdropFilter: isDragging ? 'blur(18px)' : undefined,
          opacity: isDragging ? 0.92 : undefined,
        }}
      >
        <ServiceIcon iconKey={icon_key} name={name} large />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium leading-tight text-text-primary">{name}</span>
            {tier && (
              <span className="shrink-0 text-[9px] px-1 py-px rounded-full bg-accent-dim text-accent font-medium tracking-wide uppercase leading-tight">{tier}</span>
            )}
          </div>
          {payment_channel && (
            <div className="mt-px truncate text-[11px] text-text-quaternary">
              {(() => {
                const cardSuffix = payment_channel.includes('····') ? ` ····${payment_channel.split('····')[1]}` : ''
                const method = payment_channel.split(' ····')[0]
                const label = method === 'Alipay' ? t('payment.alipay')
                  : method === 'WeChat Pay' ? t('payment.wechat')
                  : method === 'UnionPay' ? t('payment.unionpay')
                  : method
                return label + cardSuffix
              })()}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          {isPrepaid && onViewTopups ? (
            <div className="relative group/amt">
              <span className="font-numeric text-[13px] font-semibold leading-tight text-text-primary group-hover/amt:opacity-0 transition-opacity duration-150">
                {formatAmount(topupTotal ?? 0, currency)}
              </span>
              <button
                data-no-swipe
                onClick={(e) => { e.stopPropagation(); onViewTopups() }}
                className="absolute inset-0 flex items-center justify-end whitespace-nowrap text-text-tertiary opacity-0 group-hover/amt:opacity-100 hover:!text-text-primary transition-opacity duration-150 cursor-default"
              >
                <span className="text-[11px] mr-0.5">{t('form.viewHistory')}</span>
                <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.5 2.5l4 3.5-4 3.5" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="font-numeric text-[13px] font-semibold leading-tight text-text-primary">
                {isPrepaid ? formatAmount(topupTotal ?? 0, currency) : formatAmount(amount, currency)}
              </div>
              {!isPrepaid && (
                <div className={`mt-px font-numeric text-[11px] ${
                  isExpiredSub ? 'text-text-quaternary' : isOverdue ? 'text-red-400' : isSoon ? 'text-accent' : 'text-text-quaternary'
                }`}>
                  {countdown} · {dateStr}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
