import { useState, useRef, useEffect } from 'react'

const EMOJI_GROUPS = [
  {
    label: { zh: '常用', en: 'Common' },
    emojis: ['😀', '🎮', '🎵', '🎬', '📱', '💻', '🖥️', '⌨️', '🎧', '📷', '🎨', '✏️', '📝', '📚', '🔧', '⚙️', '🛠️', '🔑', '🔒', '💡', '⭐', '❤️', '🔥', '⚡', '💎', '🏠', '🚀', '🌍', '☁️', '🌙', '🌐', '🪜'],
  },
  {
    label: { zh: '工具', en: 'Tool' },
    emojis: ['💻', '🖥️', '📱', '⌨️', '🖱️', '💾', '📀', '🔌', '🔋', '📡', '🧲', '🔬', '🔭', '🧪', '🧰', '🪛', '📐', '📏', '✂️', '📎'],
  },
  {
    label: { zh: '娱乐', en: 'Fun' },
    emojis: ['🎮', '🎲', '🎯', '🎵', '🎶', '🎸', '🎹', '🥁', '🎬', '📺', '📻', '🎭', '🎪', '🎨', '🎤', '🎧', '📸', '🎥', '🎞️', '📹'],
  },
  {
    label: { zh: '生活', en: 'Life' },
    emojis: ['🏠', '🏢', '🏦', '🏥', '🏫', '☕', '🍵', '🍔', '🍕', '🍜', '🚗', '🚕', '✈️', '🚀', '🛒', '💳', '💰', '💵', '📦', '📮'],
  },
  {
    label: { zh: '符号', en: 'Sign' },
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '⭐', '🌟', '✨', '💫', '🔥', '⚡', '💎', '🏆', '🎯', '✅', '❌', '💯'],
  },
]

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
  lang?: 'en' | 'zh'
  onResetDefault?: () => void
  resetLabel?: string
}

export default function EmojiPicker({ onSelect, onClose, lang = 'zh', onResetDefault, resetLabel }: Props) {
  const [activeGroup, setActiveGroup] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1.5 z-50 w-[220px] rounded-[12px] bg-[rgba(30,30,32,0.96)] border border-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-xl overflow-hidden"
    >
      {/* Restore default icon */}
      {onResetDefault && (
        <button
          onClick={onResetDefault}
          className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.06] cursor-default transition-colors border-b border-white/[0.06]"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {resetLabel}
        </button>
      )}

      {/* Group tabs */}
      <div className="flex items-center gap-0.5 px-2 pt-2 pb-1">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label[lang]}
            onClick={() => setActiveGroup(i)}
            className={`text-[10px] px-1.5 py-1 rounded-md cursor-default transition-colors shrink-0 ${
              i === activeGroup
                ? 'bg-white/[0.1] text-white/80'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            {g.label[lang]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="px-2 pb-2 grid grid-cols-7 gap-0.5 max-h-[160px] overflow-y-auto">
        {EMOJI_GROUPS[activeGroup].emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-md hover:bg-white/[0.08] cursor-default transition-colors text-[16px]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
