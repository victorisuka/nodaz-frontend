import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { adminApi } from '../lib/api.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'buyer', label: 'Acheteur' },
  { value: 'seller', label: 'Vendeur' },
  { value: 'moderator', label: 'Moderateur' },
]

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'blocked', label: 'Bloque' },
]

const approvalOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuve' },
  { value: 'rejected', label: 'Refuse' },
  { value: 'suspended', label: 'Suspendu' },
]

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

function getStatusBadgeClassName(status) {
  switch (status) {
    case 'blocked':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'suspended':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-slate-200 bg-white text-slate-700'
  }
}

function getApprovalBadgeClassName(status) {
  switch (status) {
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'suspended':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function createDraft(user) {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    whatsappNumber: user?.whatsappNumber ?? '',
    role: user?.role ?? 'buyer',
    status: user?.status ?? 'active',
    sellerApprovalStatus: user?.sellerProfile?.approvalStatus ?? 'pending',
    sellerApprovalNote: user?.sellerProfile?.approvalNote ?? '',
  }
}

export function AdminUserDetailsPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [draft, setDraft] = useState(createDraft(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordDraft, setPasswordDraft] = useState({ password: '', confirmPassword: '' })

  useEffect(() => {
    setLoading(true)
    setError('')

    adminApi.getAdminUser(userId)
      .then((response) => {
        const nextUser = response.user ?? null
        setUser(nextUser)
        setDraft(createDraft(nextUser))
      })
      .catch((caughtError) => {
        setError(caughtError.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId])

  const requiresSellerReason = useMemo(
    () => ['rejected', 'suspended'].includes(draft.sellerApprovalStatus),
    [draft.sellerApprovalStatus],
  )

  async function handleSubmit(event) {
    event.preventDefault()

    if (!user) {
      return
    }

    if (user.sellerProfile && requiresSellerReason && !draft.sellerApprovalNote.trim()) {
      setError('Ajoutez un motif pour un refus ou une suspension vendeur.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        name: draft.name,
        email: draft.email,
        phoneNumber: draft.phoneNumber,
        whatsappNumber: draft.whatsappNumber,
        role: draft.role,
        status: draft.status,
      }

      if (user.sellerProfile) {
        payload.sellerApprovalStatus = draft.sellerApprovalStatus
        payload.sellerApprovalNote = requiresSellerReason ? draft.sellerApprovalNote : ''
      }

      const response = await adminApi.updateAdminUser(user.id, payload)
      setUser(response.user)
      setDraft(createDraft(response.user))
      setMessage('Utilisateur mis a jour.')
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()

    if (!user || user.role !== 'admin') {
      return
    }

    setSavingPassword(true)
    setMessage('')
    setError('')

    try {
      await adminApi.updateAdminUserPassword(user.id, passwordDraft)
      setPasswordDraft({ password: '', confirmPassword: '' })
      setMessage('Mot de passe admin mis a jour.')
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="panel px-6 py-10 text-slate-600">Chargement de l utilisateur...</div>
  }

  if (error && !user) {
    return <StatusMessage tone="error">{error}</StatusMessage>
  }

  if (!user) {
    return <StatusMessage tone="error">Utilisateur introuvable.</StatusMessage>
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title={user.name}
        description="Consultez les informations completes du compte et appliquez les modifications au meme endroit."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users" className="button-secondary">Retour au tableau</Link>
            <button type="button" className="button-secondary" onClick={() => navigate(-1)}>Retour</button>
          </div>
        }
      />

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="panel space-y-4 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Compte #{user.id}</span>
            <span className={`rounded-full border px-3 py-2 ${getStatusBadgeClassName(user.status || 'active')}`}>{user.status || 'active'}</span>
            {user.sellerProfile ? (
              <span className={`rounded-full border px-3 py-2 ${getApprovalBadgeClassName(user.sellerProfile.approvalStatus || 'pending')}`}>
                Vendeur: {user.sellerProfile.approvalStatus || 'pending'}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="market-note">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Email</p>
              <p className="mt-2 text-base font-bold text-[#161d29] break-all">{user.email}</p>
            </div>
            <div className="market-note">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Role actuel</p>
              <p className="mt-2 text-base font-bold text-[#161d29]">{user.role}</p>
            </div>
            <div className="market-note">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Compte cree</p>
              <p className="mt-2 text-base font-bold text-[#161d29]">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="market-note">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Derniere mise a jour</p>
              <p className="mt-2 text-base font-bold text-[#161d29]">{formatDateTime(user.updatedAt)}</p>
            </div>
          </div>

          {user.sellerProfile ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Profil vendeur</p>
              <div className="mt-3 space-y-2">
                <p><span className="font-semibold text-[#161d29]">Boutique:</span> {user.sellerProfile.storeName || 'Non renseigne'}</p>
                <p><span className="font-semibold text-[#161d29]">Telephone:</span> {user.sellerProfile.phoneNumber || 'Non renseigne'}</p>
                <p><span className="font-semibold text-[#161d29]">Email pro:</span> {user.sellerProfile.professionalEmail || 'Non renseigne'}</p>
                <p><span className="font-semibold text-[#161d29]">Cree le:</span> {formatDateTime(user.sellerProfile.createdAt)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {user.role === 'admin' ? 'Ce compte appartient a l equipe admin.' : 'Aucun profil vendeur associe a ce compte.'}
            </div>
          )}
        </section>

        <form className="panel space-y-5 px-5 py-5 sm:px-6" onSubmit={handleSubmit}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Modification</p>
            <h3 className="mt-2 text-2xl font-bold text-[#161d29]">Mettre a jour ce compte</h3>
            <p className="mt-2 text-sm text-[#627083]">{user.role === 'admin' ? 'Les informations, le statut et le mot de passe de ce compte admin se gerent ici.' : 'Les changements de role, de statut et de validation vendeur se font ici.'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Nom complet
              <input
                type="text"
                className="field mt-2"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                className="field mt-2"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Telephone
              <input
                type="text"
                className="field mt-2"
                value={draft.phoneNumber}
                onChange={(event) => setDraft((current) => ({ ...current, phoneNumber: event.target.value }))}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              WhatsApp
              <input
                type="text"
                className="field mt-2"
                value={draft.whatsappNumber}
                onChange={(event) => setDraft((current) => ({ ...current, whatsappNumber: event.target.value }))}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Role
              <select
                className="field mt-2"
                value={draft.role}
                disabled={user.role === 'admin'}
                onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
              >
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Statut du compte
              <select
                className="field mt-2"
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              >
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {user.sellerProfile ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[#161d29]">Validation vendeur</p>
                <p className="mt-1 text-sm text-slate-600">Utilisez cette section pour approuver, suspendre ou refuser le dossier vendeur.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Statut vendeur
                  <select
                    className="field mt-2"
                    value={draft.sellerApprovalStatus}
                    onChange={(event) => setDraft((current) => ({ ...current, sellerApprovalStatus: event.target.value }))}
                  >
                    {approvalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                  {requiresSellerReason
                    ? 'Un motif est obligatoire pour un refus ou une suspension.'
                    : 'Le motif est vide quand le dossier est approuve ou remis en attente.'}
                </div>
              </div>

              <label className="text-sm font-medium text-slate-700">
                Motif admin
                <textarea
                  className="field mt-2 min-h-28"
                  value={draft.sellerApprovalNote}
                  onChange={(event) => setDraft((current) => ({ ...current, sellerApprovalNote: event.target.value }))}
                  placeholder="Expliquez la decision prise sur le dossier vendeur"
                />
              </label>
            </div>
          ) : null}

          {user.role === 'admin' ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[#161d29]">Mot de passe admin</p>
                <p className="mt-1 text-sm text-slate-600">Utilisez ce bloc pour definir un nouveau mot de passe pour ce compte admin.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nouveau mot de passe
                  <input
                    type="password"
                    className="field mt-2"
                    value={passwordDraft.password}
                    onChange={(event) => setPasswordDraft((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Confirmation
                  <input
                    type="password"
                    className="field mt-2"
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="button-secondary" disabled={savingPassword || !passwordDraft.password || !passwordDraft.confirmPassword} onClick={handlePasswordSubmit}>
                  {savingPassword ? 'Mise a jour...' : 'Modifier le mot de passe'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="button-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <Link to="/admin/users" className="button-secondary">Retour au tableau</Link>
          </div>
        </form>
      </div>

      {Array.isArray(user.sellerProfile?.approvalHistory) && user.sellerProfile.approvalHistory.length ? (
        <section className="panel px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Historique des decisions</p>
          <div className="mt-4 space-y-3">
            {[...user.sellerProfile.approvalHistory].reverse().map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#161d29]">{entry.title || 'Mise a jour vendeur'}</p>
                    <p className="mt-1 text-sm text-[#627083]">{entry.message || 'Le statut vendeur a ete mis a jour.'}</p>
                  </div>
                  <span className="text-xs font-medium text-[#8a94a3]">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#8a94a3]">{entry.actorName || 'Administration'}</p>
                {entry.note ? <p className="mt-2 text-sm text-[#475467]">Motif: {entry.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
