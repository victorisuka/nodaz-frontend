import { FiBell } from 'react-icons/fi'

function formatTimestamp(value) {
  if (!value) {
    return 'A l instant'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

export function NotificationCenter({ items, status, unreadCount, isOpen, onToggle, onDismiss, onMarkAllRead, onViewAll }) {
  const statusLabel = status === 'connected' ? 'Connecte' : status === 'connecting' ? 'Connexion' : 'Hors ligne'

  return (
    <div className="relative">
      <button type="button" className="button-secondary gap-2 rounded-lg px-4 py-3 text-sm" onClick={onToggle}>
        <FiBell className="text-base" aria-hidden="true" />
        <span>Notifications</span>
        <span className="rounded-full bg-[#e7f7fd] px-2 py-1 text-xs font-bold text-[#0b6b8d]">{unreadCount}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-x-4 top-24 z-50 w-auto rounded-[1.4rem] border border-[#e7ecf2] bg-white p-4 shadow-[0_24px_70px_-40px_rgba(23,35,52,0.38)] sm:absolute sm:right-0 sm:top-[calc(100%+0.75rem)] sm:left-auto sm:w-[24rem]">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf1f4] pb-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Activite</p>
              <p className="mt-1 text-sm text-[#475467]">Statut : {statusLabel}</p>
            </div>
            <button type="button" className="text-sm font-semibold text-[#0b6b8d]" onClick={onViewAll ?? onMarkAllRead}>
              Tout lire
            </button>
          </div>

          <div className="mt-4 max-h-104 space-y-3 overflow-y-auto pr-1">
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className="rounded-[1.2rem] border border-[#edf1f4] bg-[#f9fbfd] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#161d29]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#627083]">{item.message}</p>
                    </div>
                    <button type="button" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]" onClick={() => onDismiss(item.id)}>
                      Fermer
                    </button>
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8a94a3]">{formatTimestamp(item.createdAt)}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-[#d8e0e8] bg-[#f9fbfd] px-4 py-5 text-sm text-[#627083]">
                Aucune notification pour le moment.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}