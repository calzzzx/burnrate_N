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
    <div className="mt-2 w-full max-w-md mx-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 text-left">
      <p className="text-[12px] leading-relaxed text-white/40">
        <span className="font-medium text-accent/80">{t.hero.unsignedTitle}</span>
        <br />
        {t.hero.unsignedNote}
      </p>
      <button
        onClick={copy}
        aria-label={t.hero.copy}
        className="group mt-2.5 flex w-full items-center gap-2.5 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-left transition-colors hover:border-white/[0.16]"
      >
        <code className="flex-1 font-mono text-[11px] leading-relaxed text-accent/90 break-all">
          {t.hero.unsignedCmd}
        </code>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-white/35 group-hover:text-white/70 transition-colors">
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
              {t.hero.copied}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
              </svg>
              {t.hero.copy}
            </>
          )}
        </span>
      </button>
    </div>
  )
}
