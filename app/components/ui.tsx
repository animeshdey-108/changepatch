import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="cp-logo group">
      <div className="cp-logo-mark">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1 2.5h9M1 4.5h6M1 6.5h7M1 8.5h4" stroke="#09090b" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="cp-logo-text">ChangePatch</span>
    </Link>
  )
}

export function Nav({ children, right }: { children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <nav className="cp-nav">
      <div className="flex items-center gap-6">
        <Logo />
        {children}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </nav>
  )
}

export function Badge({ type }: { type: string }) {
  const map: Record<string, string> = {
    feature: "cp-badge-feat",
    fix: "cp-badge-fix",
    improvement: "cp-badge-improve",
    draft: "cp-badge-draft",
  }
  const label: Record<string, string> = {
    feature: "feat",
    fix: "fix",
    improvement: "improve",
  }
  return (
    <span className={map[type] ?? "cp-badge bg-white/5 text-text-muted"}>
      {label[type] ?? type}
    </span>
  )
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="14" height="14" rx="3" stroke="#52525b" strokeWidth="1.5"/>
          <path d="M6 9h6M9 6v6" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-text-primary mb-1">{title}</p>
      <p className="text-sm text-text-dim mb-6 max-w-xs leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
