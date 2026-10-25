export function Card({ children, className = '', ...props }) {
  return (
    <div className={`border border-ink-500/60 bg-ink-800 rounded-lg p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-mint text-ink-900 hover:bg-mint/90',
    secondary: 'bg-ink-600 text-paper hover:bg-ink-500 border border-ink-500',
    ghost: 'bg-transparent text-mist hover:text-paper border border-ink-500/60 hover:border-mist',
    danger: 'bg-coral/90 text-ink-900 hover:bg-coral',
  }
  return (
    <button
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-ink-500 rounded-lg p-10 text-center">
      <p className="font-serif text-lg text-paper mb-1">{title}</p>
      <p className="text-mist text-sm mb-4 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-ink-600 text-mist-light',
    strong: 'bg-mint-soft text-mint',
    moderate: 'bg-amber-soft text-amber',
    weak: 'bg-coral-soft text-coral',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tones[tone] || tones.default}`}>
      {children}
    </span>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-ink-500 border-t-mint h-5 w-5 ${className}`} />
  )
}

export function Progress({ value, className = '' }) {
  return (
    <div className={`h-2 rounded-full bg-ink-600 overflow-hidden ${className}`}>
      <div className="h-full bg-mint rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}
