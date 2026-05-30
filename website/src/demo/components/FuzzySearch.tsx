import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import { SERVICE_PRESETS } from '../lib/presets'
import { formatAmount } from '../lib/format'
import type { ServicePreset } from '../types'
import ServiceIcon from './ServiceIcon'

interface Props {
  onSelect: (preset: ServicePreset | null) => void
  onCustom: (name: string) => void
  favorites: Set<string>
  onToggleFavorite: (name: string) => void
}

function isLatinLetter(ch: string): boolean {
  return /^[A-Za-z]$/.test(ch)
}

// Sort: A-Z English first, then non-English (Chinese etc.) under '#'
const SORTED_PRESETS = [...SERVICE_PRESETS].sort((a, b) => {
  const aLatin = isLatinLetter(a.name[0])
  const bLatin = isLatinLetter(b.name[0])
  if (aLatin && !bLatin) return -1
  if (!aLatin && bLatin) return 1
  return a.name.localeCompare(b.name)
})

export default function FuzzySearch({ onSelect, onCustom, favorites, onToggleFavorite }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const fuse = useMemo(
    () => new Fuse(SERVICE_PRESETS, { keys: ['name', 'category'], threshold: 0.4 }),
    []
  )

  const isSearching = query.trim().length > 0

  const results = useMemo(() => {
    if (!isSearching) return SORTED_PRESETS
    const items = fuse.search(query).map((r) => r.item)
    // Sort favorites to top in search results
    if (favorites.size > 0) {
      items.sort((a, b) => {
        const aFav = favorites.has(a.name) ? 0 : 1
        const bFav = favorites.has(b.name) ? 0 : 1
        return aFav - bFav
      })
    }
    return items
  }, [query, fuse, isSearching, favorites])

  // Group by first letter; non-Latin goes under '#'; favorites get '★' section
  const { groups, letters } = useMemo(() => {
    if (isSearching) return { groups: null, letters: [] }
    const map = new Map<string, ServicePreset[]>()

    // Add favorites section first
    if (favorites.size > 0) {
      const favPresets = SORTED_PRESETS.filter(p => favorites.has(p.name))
      if (favPresets.length > 0) {
        map.set('★', favPresets)
      }
    }

    for (const preset of results) {
      if (favorites.has(preset.name)) continue
      const ch = preset.name[0].toUpperCase()
      const key = isLatinLetter(ch) ? ch : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(preset)
    }
    return { groups: map, letters: [...map.keys()] }
  }, [results, isSearching, favorites])

  // Flat index for keyboard navigation
  const flatItems = useMemo(() => {
    if (isSearching) return results
    const items: ServicePreset[] = []
    if (groups) {
      for (const presets of groups.values()) {
        items.push(...presets)
      }
    }
    return items
  }, [results, groups, isSearching])

  const totalItems = flatItems.length + 1

  useEffect(() => {
    setHighlightIndex(-1)
  }, [results])

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!isSearching && highlightIndex === 0) {
        onSelect(null)
      } else if (isSearching && highlightIndex >= 0 && highlightIndex < flatItems.length) {
        onSelect(flatItems[highlightIndex])
      } else if (isSearching && highlightIndex === flatItems.length) {
        onCustom(query.trim())
      } else if (!isSearching && highlightIndex > 0) {
        const presetIdx = highlightIndex - 1
        if (presetIdx < flatItems.length) onSelect(flatItems[presetIdx])
      } else if (flatItems.length > 0) {
        onSelect(flatItems[0])
      }
    }
  }, [totalItems, highlightIndex, flatItems, isSearching, query, onSelect, onCustom])

  function scrollToLetter(letter: string) {
    const el = listRef.current?.querySelector(`[data-section="${letter}"]`)
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  // Track flat index across grouped rendering
  let flatIdx = isSearching ? 0 : 1

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 pb-1.5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('form.searchPlaceholder')}
          className="mac-field w-full text-text-primary text-[13px] px-3 py-[7px] outline-none placeholder:text-text-tertiary"
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Letter index sidebar — left side */}
        {!isSearching && letters.length > 0 && (
          <div className="flex flex-col items-center justify-center py-0.5 shrink-0 w-5 ml-0.5">
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className="w-5 h-[20px] flex items-center justify-center text-[10px] font-semibold text-text-quaternary hover:text-accent active:text-accent transition-colors cursor-default"
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Main list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-0.5">
          {isSearching ? (
            <>
              {results.map((preset, idx) => {
                const isFav = favorites.has(preset.name)
                return (
                  <div
                    key={preset.name}
                    data-item
                    onClick={() => onSelect(preset)}
                    className={`mac-list-row group/row flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-default ${
                      idx === highlightIndex ? 'is-active' : ''
                    }`}
                  >
                    <ServiceIcon iconKey={preset.iconKey} name={preset.name} />
                    <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">{preset.name}</span>
                    <div className="relative shrink-0 w-10 h-5 flex items-center justify-end">
                      <span className={`text-[11px] text-text-tertiary font-numeric transition-opacity duration-150 ${isFav ? 'hidden' : 'group-hover/row:opacity-0'}`}>
                        {formatAmount(preset.defaultAmount, preset.defaultCurrency)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(preset.name) }}
                        className={`absolute inset-0 flex items-center justify-end transition-opacity duration-150 cursor-default ${
                          isFav
                            ? 'text-accent opacity-100'
                            : 'text-text-quaternary opacity-0 group-hover/row:opacity-60 hover:!opacity-100 hover:!text-accent'
                        }`}
                        aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                      >
                        <svg viewBox="0 0 16 16" className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                          <path d="M8 1.6l1.8 3.7 4.1.6-3 2.9.7 4.1L8 10.8l-3.6 2.1.7-4.1-3-2.9 4.1-.6z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
              <button
                data-item
                onClick={() => onCustom(query.trim())}
                className={`mac-list-row w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-default border-t border-border rounded-[var(--radius-item)] mt-1 ${
                  highlightIndex === results.length ? 'is-active' : ''
                }`}
              >
                <div className="w-5 h-5 rounded-[7px] flex items-center justify-center text-[11px] text-text-tertiary border border-border shrink-0">
                  +
                </div>
                <span className="text-[13px] text-text-secondary">
                  {t('form.customService')} "{query.trim()}"
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Custom service entry — always visible at top */}
              <button
                data-item
                onClick={() => onSelect(null)}
                className={`mac-list-row w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-default mb-1 ${
                  highlightIndex === 0 ? 'is-active' : ''
                }`}
              >
                <div className="w-5 h-5 rounded-[7px] flex items-center justify-center text-[11px] text-text-tertiary border border-border shrink-0">
                  +
                </div>
                <span className="text-[13px] text-text-secondary">{t('form.customService')}</span>
              </button>
              {groups && letters.map((letter) => {
              const presets = groups.get(letter)!
              return (
                <div key={letter} data-section={letter}>
                  <div className="px-2.5 py-px sticky top-0 z-[1]">
                    <span className="text-[11px] font-semibold text-text-quaternary tracking-wider uppercase">{letter}</span>
                  </div>
                  {presets.map((preset) => {
                    const idx = flatIdx++
                    const isFav = favorites.has(preset.name)
                    return (
                      <div
                        key={preset.name}
                        data-item
                        onClick={() => onSelect(preset)}
                        className={`mac-list-row group/row flex items-center gap-2.5 px-2.5 py-1.5 text-left cursor-default ${
                          idx === highlightIndex ? 'is-active' : ''
                        }`}
                      >
                        <ServiceIcon iconKey={preset.iconKey} name={preset.name} />
                        <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">{preset.name}</span>
                        <div className="relative shrink-0 w-10 h-5 flex items-center justify-end">
                          <span className={`text-[11px] text-text-tertiary font-numeric transition-opacity duration-150 ${isFav ? 'hidden' : 'group-hover/row:opacity-0'}`}>
                            {formatAmount(preset.defaultAmount, preset.defaultCurrency)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(preset.name) }}
                            className={`absolute inset-0 flex items-center justify-end transition-opacity duration-150 cursor-default ${
                              isFav
                                ? 'text-accent opacity-100'
                                : 'text-text-quaternary opacity-0 group-hover/row:opacity-60 hover:!opacity-100 hover:!text-accent'
                            }`}
                            aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                          >
                            <svg viewBox="0 0 16 16" className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                              <path d="M8 1.6l1.8 3.7 4.1.6-3 2.9.7 4.1L8 10.8l-3.6 2.1.7-4.1-3-2.9 4.1-.6z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
