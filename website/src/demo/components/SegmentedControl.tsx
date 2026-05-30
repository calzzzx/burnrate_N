interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const activeIndex = options.findIndex((o) => o.value === value)
  const count = options.length
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0
  const compact = count >= 4 || options.some((option) => option.label.length > 9)

  return (
    <div className="mac-segmented relative grid p-[2px] overflow-hidden" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {/* Sliding thumb */}
      <div
        className="absolute top-[2px] bottom-[2px] rounded-[calc(var(--radius-button)-1px)] bg-bg-tertiary pointer-events-none"
        style={{
          width: `calc((100% - 4px) / ${count})`,
          left: 2,
          transform: `translateX(${safeActiveIndex * 100}%)`,
          transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.14)',
        }}
      />
      {/* Buttons */}
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-[1] flex min-h-[28px] items-center justify-center rounded-[calc(var(--radius-button)-1px)] text-center leading-none cursor-default transition-colors duration-200 ${
            compact ? 'px-1.5 text-[12px]' : 'px-2 text-[13px]'
          } ${
            value === opt.value ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
