import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { LogicalSize } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { Subscription } from '../types'
import { formatAmount } from '../lib/format'
import { clearAllData } from '../lib/db'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useSettings } from '../hooks/useSettings'
import OverviewRow from './OverviewRow'
import CategoryBar from './CategoryBar'
import SubscriptionList from './SubscriptionList'
import AddSubscription from './AddSubscription'
import BurnCounter from './BurnCounter'
import Settings from './Settings'

type View = 'list' | 'add' | 'edit' | 'settings' | 'topups'

const PANEL_WIDTH = 288
const PANEL_MAX_HEIGHT = 516
const PANEL_MIN_HEIGHT = 80
const appWindow = getCurrentWindow()

function HeaderActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="w-7 h-7 rounded-[10px] flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
    >
      {children}
    </button>
  )
}

export default function Panel() {
  const { t } = useTranslation()
  const { settings, loading: settingsLoading, exchangeRates, ratesLoading, updateSetting } = useSettings()
  const {
    subscriptions,
    archivedSubscriptions,
    prepaidSubscriptions,
    topupTotals,
    loading: subsLoading,
    monthlyTotal,
    cumulativeTotal,
    dailyAverage,
    prepaidTotal,
    activeCount,
    archivedCount,
    prepaidCount,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    reorderSubscriptions,
    reload,
  } = useSubscriptions(settings.display_currency, exchangeRates, settings.tray_display)
  const [view, setView] = useState<View>('list')
  const [listTab, setListTab] = useState<'active' | 'archived' | 'prepaid'>('active')
  const [overviewMode, setOverviewMode] = useState<'overview' | 'burn'>('overview')
  const [overviewHeight, setOverviewHeight] = useState<number | null>(null)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [topupsOrigin, setTopupsOrigin] = useState<'list' | 'edit'>('list')

  const isLoading = settingsLoading || subsLoading
  const [saveError, setSaveError] = useState(false)
  const [listMaxHeight, setListMaxHeight] = useState(PANEL_MAX_HEIGHT)
  const errorTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const overviewRef = useRef<HTMLDivElement>(null)
  const overviewAreaRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const resizeTargetHeight = useRef<number | null>(null)
  const currentHeight = useRef(PANEL_MAX_HEIGHT)
  const initialResizeDone = useRef(false)
  const prevViewRef = useRef<View | null>(null)
  const viewAnimRef = useRef('')

  const cancelDismiss = useCallback(() => {
    clearTimeout(dismissTimer.current)
  }, [])

  const hidePanel = useCallback(() => {
    cancelDismiss()
    appWindow.hide().catch(() => {})
  }, [cancelDismiss])

  const scheduleDismiss = useCallback(() => {
    cancelDismiss()
    dismissTimer.current = setTimeout(hidePanel, 500)
  }, [cancelDismiss, hidePanel])

  // A native window stays focused while a fullscreen app's menu bar retracts.
  // Treat the panel like a system popover: enter to keep it open, otherwise
  // close it shortly after opening or when the pointer leaves it.
  useEffect(() => {
    const unlisten = listen('panel-shown', scheduleDismiss)
    return () => {
      cancelDismiss()
      unlisten.then(fn => fn())
    }
  }, [cancelDismiss, scheduleDismiss])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === 'n') {
        e.preventDefault()
        setView('add')
      }
      if (e.metaKey && e.key === ',') {
        e.preventDefault()
        setView('settings')
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (view !== 'list') {
          setView('list')
          setEditingSubscription(null)
        } else if (listTab !== 'active') {
          setListTab('active')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view])

  // Clear fixed height when switching tabs
  useEffect(() => {
    if (listTab !== 'active') setOverviewHeight(null)
  }, [listTab])


  useEffect(() => {
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (!focused) {
        setOverviewHeight(null)
      }
    })
    return () => { unlisten.then(fn => fn()) }
  }, [])

  // Auto-switch back to active when current tab becomes empty (only after a deletion empties it)
  const prevArchivedCount = useRef(archivedCount)
  const prevPrepaidCount = useRef(prepaidCount)
  useEffect(() => {
    if (listTab === 'archived' && archivedCount === 0 && prevArchivedCount.current > 0) setListTab('active')
    if (listTab === 'prepaid' && prepaidCount === 0 && prevPrepaidCount.current > 0) setListTab('active')
    prevArchivedCount.current = archivedCount
    prevPrepaidCount.current = prepaidCount
  }, [listTab, archivedCount, prepaidCount])

  const handleEdit = useCallback((sub: Subscription) => {
    setEditingSubscription(sub)
    setView('edit')
  }, [])

  const handleViewTopups = useCallback((sub: Subscription, origin: 'list' | 'edit') => {
    setEditingSubscription(sub)
    setTopupsOrigin(origin)
    setView('topups')
  }, [])

  const handleSave = useCallback(async (data: Parameters<typeof addSubscription>[0], initialTopup?: number) => {
    try {
      if (view === 'edit' && editingSubscription) {
        await updateSubscription(editingSubscription.id, data)
      } else {
        await addSubscription(data, initialTopup)
      }
      setView('list')
      setEditingSubscription(null)
    } catch {
      setSaveError(true)
      clearTimeout(errorTimer.current)
      errorTimer.current = setTimeout(() => setSaveError(false), 2000)
    }
  }, [view, editingSubscription, addSubscription, updateSubscription])

  const handleDelete = useCallback(async () => {
    if (editingSubscription) {
      await deleteSubscription(editingSubscription.id)
      setView('list')
      setEditingSubscription(null)
    }
  }, [editingSubscription, deleteSubscription])

  const handleRowDelete = useCallback(async (sub: Subscription) => {
    await deleteSubscription(sub.id)
  }, [deleteSubscription])

  const handleReorder = useCallback(async (orderedIds: string[]) => {
    if (settings.sort_by !== 'manual') {
      void updateSetting('sort_by', 'manual')
    }
    await reorderSubscriptions(orderedIds)
  }, [settings.sort_by, updateSetting, reorderSubscriptions])

  const resizeWindow = useCallback((height: number) => {
    const target = Math.round(Math.min(PANEL_MAX_HEIGHT, Math.max(PANEL_MIN_HEIGHT, height)))

    if (resizeTargetHeight.current === target) return
    resizeTargetHeight.current = target

    if (!initialResizeDone.current) {
      initialResizeDone.current = true
      currentHeight.current = target
      void appWindow.setSize(new LogicalSize(PANEL_WIDTH, target)).catch(() => {})
      return
    }

    currentHeight.current = target
    void invoke('animate_panel_size', { width: PANEL_WIDTH, height: target }).catch(() => {
      void appWindow.setSize(new LogicalSize(PANEL_WIDTH, target)).catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (isLoading || view !== 'list') {
      void resizeWindow(PANEL_MAX_HEIGHT)
      return
    }

    const staticHeight = [
      headerRef.current?.offsetHeight ?? 0,
      overviewAreaRef.current?.offsetHeight ?? 0,
      dividerRef.current?.offsetHeight ?? 0,
    ].reduce((sum, height) => sum + height, 0)

    const availableListHeight = Math.max(120, PANEL_MAX_HEIGHT - staticHeight)
    setListMaxHeight((prev) => Math.abs(prev - availableListHeight) > 1 ? availableListHeight : prev)
  }, [isLoading, view, subscriptions.length, settings.sort_by, ratesLoading, resizeWindow, overviewMode])

  useEffect(() => {
    if (isLoading || view !== 'list' || !panelRef.current) {
      return
    }

    const syncWindowHeight = () => {
      if (!panelRef.current) return
      void resizeWindow(panelRef.current.scrollHeight)
    }

    syncWindowHeight()

    const observer = new ResizeObserver(() => {
      syncWindowHeight()
    })

    observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [isLoading, view, listMaxHeight, resizeWindow, subscriptions.length, overviewMode])

  // Compute view transition direction synchronously during render
  const prevTabRef = useRef(listTab)
  const viewKey = view === 'list' ? `list-${listTab}` : view
  if (!isLoading) {
    const viewChanged = prevViewRef.current !== null && prevViewRef.current !== view
    const tabChanged = prevTabRef.current !== listTab && view === 'list'

    if (viewChanged) {
      if (view === 'list' || (prevViewRef.current === 'topups' && view === 'edit')) {
        viewAnimRef.current = 'animate-view-back'
      } else {
        viewAnimRef.current = 'animate-view-forward'
      }
    } else if (tabChanged) {
      viewAnimRef.current = listTab === 'active' ? 'animate-view-back' : 'animate-view-forward'
    }

    prevViewRef.current = view
    prevTabRef.current = listTab
  }

  return (
    <div
      ref={panelRef}
      onMouseEnter={cancelDismiss}
      onMouseLeave={hidePanel}
      className={`relative w-full ${!isLoading && view === 'list' ? 'h-auto' : 'h-full'} bg-bg-primary rounded-[var(--radius-panel)] border border-white/[0.10] shadow-[0_12px_32px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col overflow-hidden animate-panel-in origin-top`}
    >
      {isLoading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-[13px] text-text-secondary animate-pulse">{t('common.loading')}</div>
        </div>
      ) : (
        <div
          key={viewKey}
          className={`${view !== 'list' ? 'flex-1 min-h-0' : ''} ${viewAnimRef.current}`}
        >
          {view === 'settings' ? (
            <Settings
              settings={settings}
              onUpdate={updateSetting}
              onBack={() => setView('list')}
              onClearData={async () => { await clearAllData(); await reload(); setView('list') }}
              onDataImported={async () => { await reload(); setView('list') }}
            />
          ) : view === 'add' || view === 'edit' ? (
            <AddSubscription
              editing={view === 'edit' ? editingSubscription : null}
              onSave={handleSave}
              onDelete={view === 'edit' ? handleDelete : undefined}
              onCancel={() => { setView('list'); setEditingSubscription(null) }}
              onTopupsChanged={reload}
              saveError={saveError}
            />
          ) : view === 'topups' && editingSubscription ? (
            <AddSubscription
              editing={editingSubscription}
              onSave={handleSave}
              onDelete={() => { deleteSubscription(editingSubscription.id); setView('list'); setEditingSubscription(null) }}
              onCancel={() => {
                if (topupsOrigin === 'edit') { setView('edit') }
                else { setView('list') }
              }}
              onTopupsChanged={reload}
              saveError={saveError}
              initialStep="topups"
            />
          ) : (
            <>
              {/* Header */}
              <div ref={headerRef} className="flex items-center justify-between px-3 pt-3 pb-2">
                <h1
                  className={`text-[14px] font-bold tracking-tight transition-colors ${
                    listTab === 'active' && subscriptions.length > 0
                      ? overviewMode === 'burn'
                        ? 'text-accent cursor-default'
                        : 'text-text-primary hover:text-accent/70 cursor-default'
                      : 'text-text-primary'
                  }`}
                  onClick={() => {
                    if (listTab === 'active' && subscriptions.length > 0) {
                      if (overviewMode === 'overview') {
                        // Capture current overview area height before switching
                        if (overviewAreaRef.current) {
                          setOverviewHeight(overviewAreaRef.current.offsetHeight)
                        }
                        setOverviewMode('burn')
                      } else {
                        setOverviewHeight(null)
                        setOverviewMode('overview')
                      }
                    }
                  }}
                >
                  {listTab === 'archived' ? t('list.tabArchived') : listTab === 'prepaid' ? t('list.tabPrepaid') : 'BurnRate'}
                </h1>
                <div className="flex items-center gap-1">
                  {listTab !== 'active' ? (
                    <HeaderActionButton label={t('settings.back')} onClick={() => setListTab('active')}>
                      <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </HeaderActionButton>
                  ) : (
                    <>
                      <HeaderActionButton label={prepaidCount > 0 ? `${t('list.tabPrepaid')} (${prepaidCount})` : t('list.tabPrepaid')} onClick={() => setListTab('prepaid')}>
                        <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                        </svg>
                      </HeaderActionButton>
                      <HeaderActionButton label={archivedCount > 0 ? `${t('list.tabArchived')} (${archivedCount})` : t('list.tabArchived')} onClick={() => setListTab('archived')}>
                          <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 8v13H3V8" />
                            <path d="M1 3h22v5H1z" />
                            <path d="M10 12h4" />
                          </svg>
                        </HeaderActionButton>
                      <HeaderActionButton label={t('settings.title')} onClick={() => setView('settings')}>
                        <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M10.44 3.02h3.12l.47 2.05c.42.15.82.32 1.2.53l1.86-.97 2.2 2.2-.98 1.86c.21.38.39.78.53 1.2l2.06.47v3.12l-2.06.47c-.14.42-.32.82-.53 1.2l.98 1.86-2.2 2.2-1.86-.98c-.38.21-.78.39-1.2.53l-.47 2.06h-3.12l-.47-2.06a7.5 7.5 0 0 1-1.2-.53l-1.86.98-2.2-2.2.97-1.86a7.5 7.5 0 0 1-.53-1.2l-2.05-.47v-3.12l2.05-.47c.15-.42.32-.82.53-1.2l-.97-1.86 2.2-2.2 1.86.97c.38-.21.78-.38 1.2-.53z" />
                          <circle cx="12" cy="12" r="2.75" />
                        </svg>
                      </HeaderActionButton>
                      <HeaderActionButton label={t('form.add')} onClick={() => setView('add')}>
                        <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </HeaderActionButton>
                    </>
                  )}
                </div>
              </div>

              {listTab === 'active' ? (
                <>
                  {subscriptions.length > 0 && (
                    <>
                      <div
                        ref={overviewAreaRef}
                        style={overviewHeight != null ? { height: overviewHeight } : undefined}
                      >
                        {overviewMode === 'burn' ? (
                          <BurnCounter
                            dailyAverage={dailyAverage}
                            currency={settings.display_currency}
                          />
                        ) : (
                          <>
                            <div ref={overviewRef}>
                              <OverviewRow
                                monthlyTotal={monthlyTotal}
                                cumulativeTotal={cumulativeTotal}
                                dailyAverage={dailyAverage}
                                activeCount={activeCount}
                                prepaidCount={prepaidCount}
                                prepaidTotal={prepaidTotal}
                                currency={settings.display_currency}
                                ratesLoading={ratesLoading}
                              />
                            </div>
                            <div ref={categoryRef}>
                              <CategoryBar
                                subscriptions={subscriptions}
                                displayCurrency={settings.display_currency}
                                exchangeRates={exchangeRates}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div ref={dividerRef} className="mx-3 border-t border-border" />
                    </>
                  )}
                  <SubscriptionList
                    subscriptions={subscriptions}
                    sortBy={settings.sort_by}
                    displayCurrency={settings.display_currency}
                    exchangeRates={exchangeRates}
                    onSortChange={(sort) => updateSetting('sort_by', sort)}
                    onEdit={handleEdit}
                    onDelete={handleRowDelete}
                    onReorder={handleReorder}
                    maxHeight={listMaxHeight}
                  />
                </>
              ) : listTab === 'prepaid' ? (
                <>
                  {prepaidSubscriptions.length > 0 ? (
                    <>
                      <SubscriptionList
                        subscriptions={prepaidSubscriptions}
                        sortBy="manual"
                        displayCurrency={settings.display_currency}
                        exchangeRates={exchangeRates}
                        topupTotals={topupTotals}
                        onSortChange={() => {}}
                        onEdit={handleEdit}
                        onDelete={handleRowDelete}
                        onReorder={() => {}}
                        onViewTopups={(sub) => handleViewTopups(sub, 'list')}
                        maxHeight={listMaxHeight}
                        archived
                      />
                      <div className="mx-3 border-t border-border" />
                      <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                        <span className="text-text-tertiary">{t('list.prepaidTotal')}</span>
                        <span className="font-numeric text-text-secondary font-medium">
                          {formatAmount(prepaidTotal, settings.display_currency)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6">
                      <div className="text-text-tertiary text-[12px] text-center leading-relaxed">
                        {t('list.emptyPrepaid')}
                      </div>
                      <div className="text-text-quaternary text-[11px] mt-1 text-center">
                        {t('list.emptyPrepaidHint')}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {archivedSubscriptions.length > 0 ? (
                    <SubscriptionList
                      subscriptions={archivedSubscriptions}
                      sortBy="next_billing"
                      displayCurrency={settings.display_currency}
                      exchangeRates={exchangeRates}
                      onSortChange={() => {}}
                      onEdit={handleEdit}
                      onDelete={handleRowDelete}
                      onReorder={() => {}}
                      maxHeight={listMaxHeight}
                      archived
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6">
                      <div className="text-text-tertiary text-[12px] text-center leading-relaxed">
                        {t('list.emptyArchived')}
                      </div>
                      <div className="text-text-quaternary text-[11px] mt-1 text-center">
                        {t('list.emptyArchivedHint')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
