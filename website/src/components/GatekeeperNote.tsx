'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

// macOS marks unsigned/un-notarized apps as quarantined. Since notarizing needs
// a paid Apple Developer account, we show a one-line Terminal command that clears
// the quarantine flag so the app opens without the "unidentified developer" block.
export default function GatekeeperNote() {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t.hero.unsignedCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="mt-1 w-full max-w-2xl mx-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-md p-4 sm:p-5 text-left">
      <div className="flex items-start gap-3.5">
        <div className="hidden sm:flex shrink-0 w-9 h-9 rounded-xl bg-accent/[0.1] border border-accent/[0.15] items-center justify-center text-accent">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="M7 9l3 3-3 3" />
            <path d="M13 15h4" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white/80 tracking-tight">{t.hero.unsignedTitle}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/40">{t.hero.unsignedNote}</p>

          {/* Terminal-style command line */}
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/40 pl-3 pr-1.5 py-1.5">
            <span className="select-none font-mono text-[12px] text-white/25 leading-none">$</span>
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-accent/90 leading-none [&::-webkit-scrollbar]:hidden">
              {t.hero.unsignedCmd}
            </code>
            <button
              onClick={copy}
              aria-label={t.hero.copy}
              title={t.hero.copy}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/45 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                  <span className="text-accent">{t.hero.copied}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                    <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
                  </svg>
                  <span>{t.hero.copy}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
