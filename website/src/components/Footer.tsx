'use client'

import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-white/[0.08] py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-sm">
          <span className="text-white/40">{t.footer.rights}</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/30">
              <span>Powered by</span>
              <span className="text-white/50 font-medium">Rust</span>
              <span>&</span>
              <span className="text-white/50 font-medium">Tauri</span>
            </div>
            <a
              href="https://github.com/mtskyyy/burnrate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {t.footer.github}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
