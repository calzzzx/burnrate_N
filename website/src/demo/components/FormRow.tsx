import type { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
  last?: boolean
  error?: boolean
}

export default function FormRow({ label, children, last, error }: Props) {
  return (
    <>
      <div className={`flex items-center justify-between gap-3 px-3 py-2.5 ${error ? 'bg-red-500/[0.06]' : ''}`}>
        <span className="text-[13px] text-text-primary shrink-0">{label}</span>
        <div className="flex items-center justify-end min-w-0">{children}</div>
      </div>
      {!last && <div className="border-t border-white/[0.05] mx-3" />}
    </>
  )
}
