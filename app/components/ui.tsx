// Shared UI primitives used across all pages

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'feature' | 'fix' | 'improvement' | 'draft' | 'warning'
}) {
  const styles = {
    default: 'bg-zinc-100 text-zinc-600',
    feature: 'bg-blue-50 text-blue-600',
    fix: 'bg-rose-50 text-rose-600',
    improvement: 'bg-emerald-50 text-emerald-600',
    draft: 'bg-amber-50 text-amber-600',
    warning: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-md ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
}) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none'
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-[0.98]',
    secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98]',
    ghost: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
    danger: 'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-lg gap-2',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  padding = true,
}: {
  children: React.ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div className={`bg-white border border-zinc-200/80 rounded-xl shadow-sm ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function NavBar({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-zinc-200/80">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {children}
      </div>
    </header>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5h10M2 5.5h7M2 7.5h8M2 9.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="text-sm font-semibold text-zinc-900 tracking-tight">ChangePatch</span>
    </div>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50/50">
      {children}
    </div>
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="14" height="14" rx="3" stroke="#71717A" strokeWidth="1.5"/>
          <path d="M6 9h6M9 6v6" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-900 mb-1">{title}</p>
      <p className="text-sm text-zinc-500 mb-5 max-w-xs">{description}</p>
      {action}
    </div>
  )
}