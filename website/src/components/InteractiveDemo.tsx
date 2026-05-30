'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import i18n from '@/demo/i18n'
import { setInitialLanguage } from '@/demo/lib/db'
import Panel from '@/demo/components/Panel'

// A live, fully-interactive copy of the real BurnRate panel — same components,
// same logic, but backed by an in-memory store (see src/demo/lib/db.ts) so it
// persists nothing. Rendered client-only (the panel uses portals/window).
export default function InteractiveDemo() {
  const { locale } = useI18n()

  // Seed the demo's stored language before Panel mounts, so its initial settings
  // load agrees with the site locale (otherwise it would default to English).
  // This only mutates the in-memory store — no React state update during render.
  useState(() => {
    setInitialLanguage(locale)
    return null
  })

  // Apply / keep the language in sync with the site toggle (in an effect, so it
  // never triggers a state update mid-render).
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale)
  }, [locale])

  return (
    <div className="relative flex flex-col items-center">
      {/* Frosted-glass backdrop so the panel's translucency reads like the real
          app sitting over a desktop wallpaper. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[600px] rounded-[48px] pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 30% 20%, rgba(232,168,56,0.16), transparent 60%), radial-gradient(120% 90% at 80% 90%, rgba(120,90,200,0.14), transparent 55%), radial-gradient(100% 100% at 50% 50%, rgba(255,255,255,0.05), transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

      <Panel />

      <p className="mt-5 text-[12px] text-white/30 text-center max-w-[18rem] leading-relaxed">
        {locale === 'en' ? 'Live demo — click around, add a service, switch views.' : '可交互演示 — 随意点击、添加订阅、切换视图。'}
        <span className="block">{locale === 'en' ? 'Nothing is saved.' : '所有数据不会被保存。'}</span>
      </p>
    </div>
  )
}
