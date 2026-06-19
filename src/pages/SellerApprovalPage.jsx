import { Link, Navigate } from 'react-router-dom'

import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { useAppSelector } from '../redux/hooks.js'

function formatDateTime(value) {
  if (!value) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getApprovalContent(status) {
  switch (status) {
    case 'approved':
      return {
        title: 'Votre espace vendeur est actif.',
        description: 'Vous pouvez maintenant gerer votre boutique, vos produits et vos commandes.',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        label: 'Valide',
      }
    case 'rejected':
      return {
        title: 'Votre demande vendeur a ete refusee.',
        description: 'Mettez votre profil a jour ou contactez un administrateur pour corriger votre dossier.',
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
        label: 'Refuse',
      }
    case 'suspended':
      return {
        title: 'Votre espace vendeur est suspendu.',
        description: 'Les actions vendeur sont temporairement bloquees. Contactez un administrateur pour plus de details.',
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
        label: 'Suspendu',
      }
    default:
      return {
        title: 'Votre demande vendeur est en cours de validation.',
        description: 'Un administrateur doit approuver votre boutique avant l acces aux outils vendeur.',
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
        label: 'En attente',
      }
  }
}

function getLatestApprovalHistoryEntry(history) {
  return Array.isArray(history) && history.length ? history[history.length - 1] : null
}

export function SellerApprovalPage() {
  const user = useAppSelector((state) => state.auth.user)
  const approvalStatus = user?.sellerProfile?.approvalStatus ?? 'pending'
  const approvalNote = user?.sellerProfile?.approvalNote ?? ''
  const approvalHistory = Array.isArray(user?.sellerProfile?.approvalHistory) ? user.sellerProfile.approvalHistory : []
  const storeName = user?.sellerProfile?.storeName ?? ''
  const latestEntry = getLatestApprovalHistoryEntry(approvalHistory)
  const isReviewRequest = approvalStatus === 'pending' && latestEntry?.actorRole === 'seller'
  const content = getApprovalContent(approvalStatus)

  if (approvalStatus === 'approved') {
    return <Navigate to="/seller/store" replace />
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        eyebrow="Espace vendeur"
        title={content.title}
        description={content.description}
      />

      <div className={`rounded-[1.75rem] border px-6 py-6 ${content.tone}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">Statut</p>
        <p className="mt-3 text-2xl font-bold">{content.label}</p>
        {approvalStatus === 'pending' ? (
          <p className="mt-2 text-sm font-medium">{isReviewRequest ? 'Dossier renvoye pour nouvelle revue admin' : 'Premiere demande en cours de revue'}</p>
        ) : null}
        {storeName ? <p className="mt-4 text-sm">Boutique: {storeName}</p> : null}
        {approvalNote ? (
          <div className="mt-5 rounded-3xl border border-current/15 bg-white/60 px-4 py-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">Motif admin</p>
            <p className="mt-2 leading-6">{approvalNote}</p>
          </div>
        ) : null}
        {isReviewRequest && latestEntry?.createdAt ? (
          <p className="mt-4 text-sm">Derniere resoumission: {formatDateTime(latestEntry.createdAt)}</p>
        ) : null}
      </div>

      <div className="panel space-y-4 px-6 py-6">
        <p className="text-sm text-slate-600">
          Tant que la boutique n est pas approuvee, les pages produits, commandes et gestion du magasin restent bloquees.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="button-secondary">
            Retour a l accueil
          </Link>
          {approvalStatus !== 'suspended' ? (
            <Link to="/seller/store" className="button-secondary">
              Mettre a jour mon dossier
            </Link>
          ) : null}
          <Link to="/products" className="button-primary">
            Continuer a parcourir le catalogue
          </Link>
        </div>
      </div>

      {approvalHistory.length ? (
        <div className="panel space-y-4 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Historique</p>
            <h2 className="mt-2 text-2xl font-bold text-[#161d29]">Chronologie des decisions</h2>
          </div>

          <div className="space-y-3">
            {[...approvalHistory].reverse().map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#161d29]">{entry.title || 'Mise a jour vendeur'}</p>
                    <p className="mt-1 text-sm text-slate-600">{entry.message || 'Le statut vendeur a ete mis a jour.'}</p>
                  </div>
                  <span className="text-xs font-medium text-[#8a94a3]">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#8a94a3]">
                  {entry.actorName || 'Administration'} • {entry.status || approvalStatus}
                </p>
                {entry.note ? <p className="mt-2 text-sm text-[#475467]">Motif: {entry.note}</p> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}