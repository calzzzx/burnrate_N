import type { Settings } from '../types'

export const SETTING_DEFAULTS: Settings = {
  display_currency: 'CNY',
  language: 'en',
  sort_by: 'next_billing',
  tray_display: 'monthly',
  bg_opacity: 42,
  bg_color: 'neutral',
}

export const BG_COLOR_PRESETS: { key: string; rgb: [number, number, number] }[] = [
  { key: 'neutral', rgb: [18, 18, 20] },
  { key: 'amber',  rgb: [28, 22, 10] },
  { key: 'slate',  rgb: [20, 22, 28] },
  { key: 'mauve',  rgb: [22, 18, 24] },
  { key: 'sage',   rgb: [18, 22, 18] },
  { key: 'navy',   rgb: [14, 16, 26] },
]
