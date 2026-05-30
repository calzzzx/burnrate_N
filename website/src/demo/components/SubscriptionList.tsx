import { useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Subscription, Settings } from '../types'
import SubscriptionRow from './SubscriptionRow'
import { toMonthly, daysUntil } from '../lib/format'
import { type ExchangeRates, convertAmount } from '../lib/currency'

interface Props {
  subscriptions: Subscription[]
  sortBy: Settings['sort_by']
  displayCurrency?: string
  exchangeRates?: ExchangeRates | null
  onSortChange: (sort: Settings['sort_by']) => void
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
  onReorder: (orderedIds: string[]) => void | Promise<void>
  maxHeight?: number
  archived?: boolean
  topupTotals?: Map<string, number>
  onViewTopups?: (sub: Subscription) => void
}

const SORT_SEQUENCE: Settings['sort_by'][] = ['manual', 'next_billing', 'amount']
const VISIBLE_ROW_COUNT = 7
const ROW_HEIGHT = 44
const LIST_BOTTOM_INSET = 8

function moveId(ids: string[], draggingId: string, targetId: string, position: 'before' | 'after') {
  const next = ids.filter((id) => id !== draggingId)
  const targetIndex = next.indexOf(targetId)
  if (targetIndex < 0) return ids

  const insertionIndex = position === 'before' ? targetIndex : targetIndex + 1
  next.splice(insertionIndex, 0, draggingId)
  return next
}

function toDisplayMonthlyAmount(
  sub: Subscription,
  displayCurrency: string,
  exchangeRates: ExchangeRates | null | undefined
) {
  const monthly = toMonthly(sub.amount, sub.cycle)
  if (sub.currency === displayCurrency || !exchangeRates) return monthly
  return convertAmount(monthly, sub.currency, exchangeRates)
}

function buildPreviewOffsets(
  sortedIds: string[],
  projectedIds: string[],
  draggingId: string,
  rowRefs: Map<string, HTMLDivElement>
) {
  if (sortedIds.length !== projectedIds.length) return {}

  const slotTops = sortedIds.map((id) => rowRefs.get(id)?.offsetTop)
  if (slotTops.some((top) => top === undefined)) return {}

  const offsets: Record<string, number> = {}
  const currentIndexById = new Map(sortedIds.map((id, index) => [id, index]))

  for (const id of sortedIds) {
    if (id === draggingId) continue

    const currentIndex = currentIndexById.get(id)
    const projectedIndex = projectedIds.indexOf(id)
    if (currentIndex === undefined || projectedIndex < 0 || projectedIndex === currentIndex) continue

    offsets[id] = slotTops[projectedIndex]! - slotTops[currentIndex]!
  }

  return offsets
}

function buildSettlingOffsets(
  sortedIds: string[],
  projectedIds: string[],
  draggingId: string,
  rowRefs: Map<string, HTMLDivElement>,
  previewOffsets: Record<string, number>,
  dragTranslateY: number
) {
  if (sortedIds.length !== projectedIds.length) return {}

  const slotTops = sortedIds.map((id) => rowRefs.get(id)?.offsetTop)
  if (slotTops.some((top) => top === undefined)) return {}

  const currentIndexById = new Map(sortedIds.map((id, index) => [id, index]))
  const nextIndexById = new Map(projectedIds.map((id, index) => [id, index]))
  const offsets: Record<string, number> = {}

  for (const id of sortedIds) {
    const currentIndex = currentIndexById.get(id)
    const nextIndex = nextIndexById.get(id)
    if (currentIndex === undefined || nextIndex === undefined) continue

    const currentVisualTop = slotTops[currentIndex]! + (id === draggingId ? dragTranslateY : (previewOffsets[id] ?? 0))
    const nextNaturalTop = slotTops[nextIndex]!
    const offset = currentVisualTop - nextNaturalTop

    if (Math.abs(offset) > 0.5) {
      offsets[id] = offset
    }
  }

  return offsets
}

export default function SubscriptionList({
  subscriptions,
  sortBy,
  displayCurrency = 'USD',
  exchangeRates = null,
  onSortChange,
  onEdit,
  onDelete,
  onReorder,
  maxHeight,
  archived,
  topupTotals,
  onViewTopups,
}: Props) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const [dragState, setDragState] = useState<{ id: string; pointerId: number; startY: number; currentY: number; startScrollTop: number; currentScrollTop: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null)
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
  const [previewOffsets, setPreviewOffsets] = useState<Record<string, number>>({})
  const [optimisticOrderIds, setOptimisticOrderIds] = useState<string[] | null>(null)
  const [settlingOffsets, setSettlingOffsets] = useState<Record<string, number>>({})
  const [isSettling, setIsSettling] = useState(false)
  const settleFrame2Ref = useRef<number | null>(null)

  const sorted = useMemo(() => {
    const items = [...subscriptions]

    const sortFn = (a: Subscription, b: Subscription) => {
      if (sortBy === 'manual') return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
      if (sortBy === 'amount') {
        return toDisplayMonthlyAmount(b, displayCurrency, exchangeRates)
          - toDisplayMonthlyAmount(a, displayCurrency, exchangeRates)
      }
      return a.next_billing.localeCompare(b.next_billing)
    }

    items.sort(sortFn)
    return items
  }, [subscriptions, sortBy, displayCurrency, exchangeRates])

  const displaySorted = useMemo(() => {
    if (!optimisticOrderIds || optimisticOrderIds.length !== sorted.length) {
      return sorted
    }

    const byId = new Map(sorted.map((sub) => [sub.id, sub]))
    const ordered = optimisticOrderIds
      .map((id) => byId.get(id))
      .filter((sub): sub is Subscription => sub !== undefined)

    return ordered.length === sorted.length ? ordered : sorted
  }, [sorted, optimisticOrderIds])

  const dueSoonCount = useMemo(() => {
    return subscriptions.filter((sub) => {
      const days = daysUntil(sub.next_billing)
      return days >= 0 && days <= 7
    }).length
  }, [subscriptions])

  const sortLabel = sortBy === 'manual'
    ? t('list.sortManual')
    : sortBy === 'amount'
      ? t('list.sortByAmount')
      : t('list.sortByDate')

  const sortedIds = useMemo(() => sorted.map((sub) => sub.id), [sorted])
  const isPagedScroll = sorted.length > VISIBLE_ROW_COUNT
  const listViewportHeight = isPagedScroll
    ? Math.min(maxHeight ?? Number.POSITIVE_INFINITY, VISIBLE_ROW_COUNT * ROW_HEIGHT + LIST_BOTTOM_INSET)
    : null
  const listViewportStyle = isPagedScroll
    ? { height: `${listViewportHeight}px`, maxHeight: `${listViewportHeight}px` }
    : (maxHeight ? { maxHeight: `${maxHeight}px` } : undefined)

  function syncPreviewOffsets(draggingId: string, target: { id: string; position: 'before' | 'after' } | null) {
    if (!target) {
      setPreviewOffsets({})
      return
    }

    const nextProjectedIds = moveId(sortedIds, draggingId, target.id, target.position)
    setPreviewOffsets(buildPreviewOffsets(sortedIds, nextProjectedIds, draggingId, rowRefs.current))
  }

  useEffect(() => {
    if (!optimisticOrderIds) return

    const matched = optimisticOrderIds.length === sortedIds.length
      && optimisticOrderIds.every((id, index) => id === sortedIds[index])

    if (matched) {
      const frame = requestAnimationFrame(() => setOptimisticOrderIds(null))
      return () => cancelAnimationFrame(frame)
    }
  }, [optimisticOrderIds, sortedIds])

  useEffect(() => {
    if (Object.keys(settlingOffsets).length === 0) {
      setIsSettling(false)
      return
    }

    // Frame 1: offsets are rendered with no transition (isSettling = true).
    // Frame 2: clear offsets — CSS transition animates rows from offset → 0.
    setIsSettling(true)
    const frame1 = requestAnimationFrame(() => {
      const frame2 = requestAnimationFrame(() => {
        setIsSettling(false)
        setSettlingOffsets({})
      })
      settleFrame2Ref.current = frame2
    })

    return () => {
      cancelAnimationFrame(frame1)
      if (settleFrame2Ref.current !== null) {
        cancelAnimationFrame(settleFrame2Ref.current)
      }
    }
  }, [settlingOffsets])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function checkScroll() {
      const current = scrollRef.current
      if (!current) return
      setShowTopFade(current.scrollTop > 4)
      setShowBottomFade(current.scrollTop < current.scrollHeight - current.clientHeight - 4)
    }

    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [sorted.length])

  useEffect(() => {
    if (!openDeleteId || sorted.some((sub) => sub.id === openDeleteId)) return

    const frame = requestAnimationFrame(() => setOpenDeleteId(null))
    return () => cancelAnimationFrame(frame)
  }, [sorted, openDeleteId])

  useEffect(() => {
    if (!dragState || sorted.some((sub) => sub.id === dragState.id)) return

    const frame = requestAnimationFrame(() => {
      setDragState(null)
      setDropTarget(null)
      setPreviewOffsets({})
    })
    return () => cancelAnimationFrame(frame)
  }, [sorted, dragState])

  function cycleSort() {
    const currentIndex = SORT_SEQUENCE.indexOf(sortBy)
    const nextSort = SORT_SEQUENCE[(currentIndex + 1) % SORT_SEQUENCE.length]
    setOpenDeleteId(null)
    onSortChange(nextSort)
  }

  function getDropTarget(draggingId: string, clientY: number) {
    const candidates = sorted
      .filter((sub) => sub.id !== draggingId)
      .map((sub) => {
        const rect = rowRefs.current.get(sub.id)?.getBoundingClientRect()
        return rect ? { id: sub.id, rect } : null
      })
      .filter((row): row is { id: string; rect: DOMRect } => row !== null)

    for (const row of candidates) {
      const midpoint = row.rect.top + row.rect.height / 2
      if (clientY < midpoint) {
        return { id: row.id, position: 'before' as const }
      }
    }

    const last = candidates.at(-1)
    return last ? { id: last.id, position: 'after' as const } : null
  }

  async function commitReorder(state: { id: string; pointerId: number; startY: number; currentY: number; startScrollTop: number; currentScrollTop: number }) {
    const target = dropTarget

    // Always clean up drag state
    setDragState(null)
    setDropTarget(null)
    setPreviewOffsets({})

    if (!target) return

    const orderedIds = moveId(sortedIds, state.id, target.id, target.position)
    const hasChanged = orderedIds.some((id, index) => id !== sorted[index]?.id)
    if (!hasChanged) return

    const dragTranslateY = state.currentY - state.startY + state.currentScrollTop - state.startScrollTop
    const nextSettlingOffsets = buildSettlingOffsets(
      sortedIds,
      orderedIds,
      state.id,
      rowRefs.current,
      previewOffsets,
      dragTranslateY
    )
    // The dragged row's return animation is handled by SubscriptionRow's own
    // transition (dragTranslateY → 0), so exclude it from settling offsets
    // to avoid double-animation.
    delete nextSettlingOffsets[state.id]

    setOptimisticOrderIds(orderedIds)
    setSettlingOffsets(nextSettlingOffsets)
    setOpenDeleteId(null)

    if (sortBy !== 'manual') {
      onSortChange('manual')
    }

    try {
      await onReorder(orderedIds)
    } catch (error) {
      setOptimisticOrderIds(null)
      throw error
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="mb-3 opacity-25">
          <rect x="4" y="7" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 13h28" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8.5" cy="10" r="1" fill="currentColor" />
          <circle cx="12" cy="10" r="1" fill="currentColor" />
          <circle cx="15.5" cy="10" r="1" fill="currentColor" />
          <path d="M14 22h8M18 18v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="text-text-tertiary text-[12px] text-center leading-relaxed">
          {t('list.empty')}
        </div>
        <div className="text-text-quaternary text-[11px] mt-1 text-center">
          {t('list.emptyHint')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {!archived && (
        <div className="flex items-center justify-between px-3 pt-0.5 pb-0.5">
          {dueSoonCount > 0 ? (
            <span className="text-[11px] font-medium text-accent/70">
              {t('list.dueSoon', { count: dueSoonCount })}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={cycleSort}
            className="mac-button mac-button-quiet px-1.5 text-[11px] text-text-quaternary cursor-default tracking-wide"
          >
            {sortLabel}
          </button>
        </div>
      )}

      <div className="relative">
        {showTopFade && (
          <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-bg-primary to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          className={`overflow-y-auto px-1.5 pb-2 ${isPagedScroll ? 'snap-y snap-mandatory overscroll-y-contain' : ''}`}
          style={listViewportStyle}
          onScroll={(event) => {
            setOpenDeleteId(null)
            if (dragState) {
              const currentScrollTop = event.currentTarget.scrollTop
              setDragState((prev) => prev && ({ ...prev, currentScrollTop }))
              const nextTarget = getDropTarget(dragState.id, dragState.currentY)
              setDropTarget(nextTarget)
              syncPreviewOffsets(dragState.id, nextTarget)
            }
          }}
        >
          {displaySorted.map((sub) => {
            const indicator = dropTarget?.id === sub.id ? dropTarget.position : null
            const isDragging = dragState?.id === sub.id
            const previewOffset = !isDragging && dragState
              ? (previewOffsets[sub.id] ?? 0)
              : (settlingOffsets[sub.id] ?? 0)
            // During settling snap (frame 1) disable transition so rows jump instantly to offset;
            // on frame 2 transition is re-enabled and rows animate from offset → 0.
            const skipTransition = isSettling && (settlingOffsets[sub.id] ?? 0) !== 0

            return (
              <div
                key={sub.id}
                className={`relative ${skipTransition ? '' : 'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'}`}
                style={{
                  transform: previewOffset === 0 ? undefined : `translate3d(0, ${previewOffset}px, 0)`,
                  scrollSnapAlign: isPagedScroll ? 'start' : undefined,
                  scrollSnapStop: isPagedScroll ? 'always' : undefined,
                }}
                ref={(node) => {
                  if (node) {
                    rowRefs.current.set(sub.id, node)
                  } else {
                    rowRefs.current.delete(sub.id)
                  }
                }}
              >
                {indicator === 'before' && (
                  <div className="absolute left-3 right-3 top-0 z-20 h-[2px] rounded-full bg-accent shadow-[0_0_12px_rgba(232,168,56,0.22)]" />
                )}

                <SubscriptionRow
                  subscription={sub}
                  topupTotal={topupTotals?.get(sub.id)}
                  onViewTopups={onViewTopups ? () => onViewTopups(sub) : undefined}
                  onClick={() => {
                    setOpenDeleteId(null)
                    onEdit(sub)
                  }}
                  onDelete={() => {
                    setOpenDeleteId(null)
                    onDelete(sub)
                  }}
                  isDeleteOpen={openDeleteId === sub.id}
                  onDeleteOpenChange={(open) => setOpenDeleteId(open ? sub.id : null)}
                  isDragging={Boolean(isDragging)}
                  dragTranslateY={isDragging ? dragState.currentY - dragState.startY + dragState.currentScrollTop - dragState.startScrollTop : 0}
                  onReorderStart={archived ? () => {} : (pointerId, clientY) => {
                    setOpenDeleteId(null)
                    const currentScrollTop = scrollRef.current?.scrollTop ?? 0
                    setDragState({ id: sub.id, pointerId, startY: clientY, currentY: clientY, startScrollTop: currentScrollTop, currentScrollTop })
                    setDropTarget(null)
                    setPreviewOffsets({})
                  }}
                  onReorderMove={archived ? () => {} : (pointerId, clientY) => {
                    setDragState((current) => {
                      if (!current || current.pointerId !== pointerId || current.id !== sub.id) return current
                      return { ...current, currentY: clientY }
                    })
                    const nextTarget = getDropTarget(sub.id, clientY)
                    setDropTarget(nextTarget)
                    syncPreviewOffsets(sub.id, nextTarget)
                  }}
                  onReorderEnd={archived ? () => {} : (pointerId) => {
                    const current = dragState
                    if (!current || current.pointerId !== pointerId || current.id !== sub.id) return
                    void commitReorder(current)
                  }}
                />

                {indicator === 'after' && (
                  <div className="absolute left-3 right-3 bottom-0 z-20 h-[2px] rounded-full bg-accent shadow-[0_0_12px_rgba(232,168,56,0.22)]" />
                )}
              </div>
            )
          })}
        </div>

        {showBottomFade && (
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-bg-primary to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </div>
  )
}
