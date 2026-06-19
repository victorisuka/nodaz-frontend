import { Link, useLocation } from 'react-router-dom'

import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'

function formatNotificationDate(value) {
  if (!value) {
    return 'A l instant'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatStatusLabel(status) {
  switch (status) {
    case 'connected':
      return 'Connecte'
    case 'connecting':
      return 'Connexion'
    case 'disconnected':
      return 'Hors ligne'
    default:
      return 'Inactif'
  }
}

export function NotificationsPage() {
  const location = useLocation()
  const notifications = Array.isArray(location.state?.notifications) ? location.state.notifications : []
  const status = location.state?.status ?? 'idle'

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Notifications"
        title="Toutes les notifications"
        description="Retrouvez ici toutes les notifications recemment remontees dans la barre d activite."
        action={<Link to="/" className="button-secondary">Retour a l accueil</Link>}
      />

      <section className="panel space-y-4 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#475467]">
          <span className="rounded-full border border-[#dceef5] bg-[#f4fbfe] px-3 py-2 font-semibold text-[#0b6b8d]">
            Statut : {formatStatusLabel(status)}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
            Total : {notifications.length}
          </span>
        </div>
      </section>

      {notifications.length ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <article key={item.id} className="panel px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-[#161d29]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#627083]">{item.message}</p>
                </div>
                <span className="rounded-full border border-[#e1e7ee] bg-[#f9fbfd] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                  {formatNotificationDate(item.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Notifications"
          title="Aucune notification a afficher"
          description="Ouvrez le centre de notifications depuis la barre de navigation pour voir les prochaines activites en temps reel."
          action={<Link to="/products" className="button-primary">Voir le catalogue</Link>}
        />
      )}
    </section>
  )
}