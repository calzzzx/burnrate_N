import type { ReactNode, SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export default function SelectField({ children, className = '', ...props }: Props) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`mac-field mac-select w-full text-text-primary text-[13px] px-3 py-[7px] outline-none ${className}`.trim()}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-tertiary">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </div>
    </div>
  )
}
