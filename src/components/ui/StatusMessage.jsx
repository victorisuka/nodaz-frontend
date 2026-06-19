export function StatusMessage({ tone = 'info', children }) {
  const className = {
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[tone]

  return <div className={`rounded-3xl border px-4 py-3 text-sm ${className}`}>{children}</div>
}