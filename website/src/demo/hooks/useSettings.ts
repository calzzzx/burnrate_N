import { useState, useEffect, useCallback } from 'react'
import { getSetting, setSetting as dbSetSetting } from '../lib/db'
import { fetchExchangeRates, type ExchangeRates } from '../lib/currency'
import { SETTING_DEFAULTS } from '../lib/defaults'
import i18n from '../i18n'
import type { Settings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(SETTING_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)

  // Load exchange rates for a given currency
  const loadRates = useCallback(async (currency: string) => {
    setRatesLoading(true)
    try {
      const rates = await fetchExchangeRates(currency)
      setExchangeRates(rates)
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [currency, lang, sortBy, trayDisplay] = await Promise.all([
          getSetting('display_currency'),
          getSetting('language'),
          getSetting('sort_by'),
          getSetting('tray_display'),
        ])
        const loaded: Settings = {
          display_currency: currency || SETTING_DEFAULTS.display_currency,
          language: (lang as Settings['language']) || SETTING_DEFAULTS.language,
          sort_by: (sortBy as Settings['sort_by']) || SETTING_DEFAULTS.sort_by,
          tray_display: (trayDisplay as Settings['tray_display']) || SETTING_DEFAULTS.tray_display,
        }
        setSettings(loaded)
        i18n.changeLanguage(loaded.language)
        // Fetch exchange rates on startup
        loadRates(loaded.display_currency)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadRates])

  const updateSetting = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const dbKey = key as string
    setSettings((prev) => ({ ...prev, [key]: value }))
    await dbSetSetting(dbKey, value)
    if (key === 'language') {
      i18n.changeLanguage(value as string)
    }
    if (key === 'display_currency') {
      loadRates(value as string)
    }
  }, [loadRates])

  return { settings, loading, exchangeRates, ratesLoading, updateSetting }
}
