import { useState, useEffect } from 'react'
import { LOCAL_ICONS } from '../lib/local-icons'

type IconSize = 'sm' | 'md' | 'lg'

const SIZE_CONFIG = {
  sm: { box: 'w-5 h-5', icon: 18, img: 'w-4 h-4', radius: 'rounded-[7px]', text: 'text-[10px]' },
  md: { box: 'w-7 h-7', icon: 24, img: 'w-6 h-6', radius: 'rounded-[9px]', text: 'text-[12px]' },
  lg: { box: 'w-9 h-9', icon: 30, img: 'w-7 h-7', radius: 'rounded-[11px]', text: 'text-[14px]' },
}

function resolveSize(size?: IconSize, large?: boolean): IconSize {
  if (size) return size
  return large ? 'md' : 'sm'
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function MonogramIcon({ name, s }: { name: string; s: IconSize }) {
  const letter = name.charAt(0).toUpperCase()
  const hue = hashString(name) % 360
  const bg = `hsl(${hue}, 20%, 22%)`
  const fg = `hsl(${hue}, 45%, 68%)`
  const c = SIZE_CONFIG[s]

  return (
    <div
      className={`${c.box} ${c.radius} ${c.text} flex items-center justify-center font-semibold shrink-0 border border-white/[0.04]`}
      style={{ background: bg, color: fg }}
    >
      {letter}
    </div>
  )
}

function ImgIcon({ src, name, s, onError }: { src: string; name: string; s: IconSize; onError?: () => void }) {
  const c = SIZE_CONFIG[s]
  return (
    <div className={`${c.box} flex items-center justify-center shrink-0`}>
      <img src={src} alt={name} className={`${c.img} object-contain`} draggable={false} loading="lazy" onError={onError} />
    </div>
  )
}

function EmojiIcon({ emoji, s }: { emoji: string; s: IconSize }) {
  const c = SIZE_CONFIG[s]
  const fontSize = { sm: 14, md: 18, lg: 22 }[s]
  return (
    <div className={`${c.box} ${c.radius} flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.04]`}>
      <span style={{ fontSize, lineHeight: 1 }}>{emoji}</span>
    </div>
  )
}

// Brand icons resolved from the lobehub static-png CDN (same source the marketing
// site uses). Anything missing or that 404s falls back to the monogram, so the
// map can be generous without risking broken images.
const CDN = 'https://registry.npmmirror.com/@lobehub/icons-static-png/1.24.0/files/dark'
const CDN_ICONS: Record<string, string> = {
  OpenAI: 'openai', Codex: 'openai', Claude: 'claude-color', ClaudeCode: 'claude-color',
  Gemini: 'gemini-color', NanoBanana: 'gemini-color', AiStudio: 'aistudio-color', Grok: 'grok',
  Cursor: 'cursor', Midjourney: 'midjourney', Perplexity: 'perplexity-color',
  GithubCopilot: 'githubcopilot', Copilot: 'githubcopilot', Github: 'github', Vercel: 'vercel',
  Railway: 'railway', Cloudflare: 'cloudflare-color', Aws: 'aws-color',
  GoogleCloud: 'googlecloud-color', Azure: 'azure-color', HuaweiCloud: 'huaweicloud-color',
  Notion: 'notion', DeepL: 'deepl-color', HuggingFace: 'huggingface-color', Figma: 'figma-color',
  Adobe: 'adobe', Google: 'google-color', Apple: 'apple', Qwen: 'qwen-color', Doubao: 'doubao-color',
  Kimi: 'kimi-color', Minimax: 'minimax-color', Kling: 'kling-color', TencentCloud: 'tencentcloud-color',
  AlibabaCloud: 'alibabacloud-color', Bailian: 'alibabacloud-color', ZAI: 'zhipu-color',
  Lovable: 'lovable', Manus: 'manus', Stability: 'stability-color', Dalle: 'dalle', Coze: 'coze',
}

export default function ServiceIcon({ iconKey, name, large, size }: { iconKey: string | null; name: string; large?: boolean; size?: IconSize }) {
  const s = resolveSize(size, large)
  const isEmoji = iconKey?.startsWith('emoji:') ?? false

  const localSvg = iconKey ? LOCAL_ICONS[iconKey] : null
  const cdnFile = iconKey && !localSvg ? CDN_ICONS[iconKey] : null

  // Reset the error flag whenever the icon source changes.
  const [cdnFailed, setCdnFailed] = useState(false)
  useEffect(() => { setCdnFailed(false) }, [iconKey])

  // Priority 0: emoji
  if (isEmoji) {
    return <EmojiIcon emoji={iconKey!.slice(6)} s={s} />
  }

  // Priority 1: bundled local SVG (exact brand logos)
  if (localSvg) {
    return <ImgIcon src={localSvg} name={name} s={s} />
  }

  // Priority 2: lobehub CDN PNG (falls back to monogram on error)
  if (cdnFile && !cdnFailed) {
    return <ImgIcon src={`${CDN}/${cdnFile}.png`} name={name} s={s} onError={() => setCdnFailed(true)} />
  }

  // Priority 3: monogram fallback
  return <MonogramIcon name={name} s={s} />
}
