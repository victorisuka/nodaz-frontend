import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { adminApi } from '../lib/api.js'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.js'
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

function getRoleLabel(role) {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}

function getStatusLabel(status) {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function getApprovalLabel(status) {
  return approvalOptions.find((option) => option.value === status)?.label ?? status
}

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

function isSameCalendarDay(leftValue, rightValue) {
  if (!leftValue || !rightValue) {
    return false
  }

  const leftDate = new Date(leftValue)
  const rightDate = new Date(rightValue)

  return leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth()
    && leftDate.getDate() === rightDate.getDate()
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

function hasReviewRequest(user) {
  const history = Array.isArray(user.sellerProfile?.approvalHistory) ? user.sellerProfile.approvalHistory : []
  const lastEntry = history[history.length - 1] ?? null

  return user.sellerProfile?.approvalStatus === 'pending' && lastEntry?.actorRole === 'seller'
}

function getLatestApprovalHistoryEntry(user) {
  const history = Array.isArray(user.sellerProfile?.approvalHistory) ? user.sellerProfile.approvalHistory : []
  return history[history.length - 1] ?? null
}

function getLatestReviewRequestDate(user) {
  if (!hasReviewRequest(user)) {
    return 0
  }

  const latestEntry = getLatestApprovalHistoryEntry(user)
  return latestEntry?.createdAt ? new Date(latestEntry.createdAt).getTime() : 0
}

function getPendingRequestDate(user) {
  return user.sellerProfile?.createdAt ? new Date(user.sellerProfile.createdAt).getTime() : 0
}

function getPendingStateLabel(user) {
  return hasReviewRequest(user) ? 'A revoir' : 'Premiere demande'
}

function isResubmittedToday(user) {
  if (!hasReviewRequest(user)) {
    return false
  }

  const latestEntry = getLatestApprovalHistoryEntry(user)
  return isSameCalendarDay(latestEntry?.createdAt, new Date())
}

function isPriorityUser(user) {
  const approvalStatus = user.sellerProfile?.approvalStatus ?? ''
  const accountStatus = user.status || 'active'

  return hasReviewRequest(user) || approvalStatus === 'pending' || approvalStatus === 'suspended' || accountStatus === 'suspended' || accountStatus === 'blocked'
}

function getUserPriority(user) {
  const approvalStatus = user.sellerProfile?.approvalStatus ?? ''

  if (approvalStatus === 'pending') {
    return hasReviewRequest(user) ? 0 : 1
  }

  if (approvalStatus === 'rejected' || approvalStatus === 'suspended') {
    return 2
  }

  if (user.role === 'seller') {
    return 3
  }

  if (user.role === 'buyer' || user.role === 'moderator') {
    return 4
  }

  return 5
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false)
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [decisionDraft, setDecisionDraft] = useState({ userId: null, status: '', note: '' })
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    sellerApprovalStatus: 'all',
    scope: 'all',
    reviewState: 'all',
  })

  function loadUsers({ preserveMessage = true } = {}) {
    if (!preserveMessage) {
      setMessage('')
    }

    setError('')

    return adminApi.getAdminUsers()
      .then((response) => {
        setUsers(response.users ?? [])
        return true
      })
      .catch((caughtError) => {
        setError(caughtError.message)
        return false
      })
  }

  useEffect(() => {
    loadUsers({ preserveMessage: false })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useRealtimeNotifications({
    enabled: true,
    onEvent: (event) => {
      if (!['seller.approval.requested', 'seller.approval.updated', 'seller.approval.resubmitted', 'user.account.updated'].includes(event.type)) {
        return
      }

      loadUsers()

      if (event.type === 'seller.approval.requested') {
        setMessage('Nouvelle demande vendeur recue. La liste a ete actualisee.')
      }

      if (event.type === 'seller.approval.resubmitted') {
        setMessage('Un vendeur refuse a mis a jour son dossier. La liste a ete actualisee.')
      }
    },
    shouldDisplayEvent: (event) => ['seller.approval.requested', 'seller.approval.updated', 'seller.approval.resubmitted', 'user.account.updated'].includes(event.type),
  })

  async function handleUserUpdate(userId, payload) {
    setMessage('')
    setError('')

    try {
      const response = await adminApi.updateAdminUser(userId, payload)
      setUsers((current) => current.map((user) => (user.id === userId ? response.user : user)))
      setMessage('Utilisateur mis a jour.')
      return true
    } catch (caughtError) {
      setError(caughtError.message)
      return false
    }
  }

  async function handleCreateAdmin(event) {
    event.preventDefault()
    setCreatingAdmin(true)
    setMessage('')
    setError('')

    try {
      await adminApi.createAdminUser(adminForm)
      await loadUsers({ preserveMessage: true })
      setAdminForm({
        name: '',
        email: '',
        phoneNumber: '',
        whatsappNumber: '',
        password: '',
        confirmPassword: '',
      })
      setIsCreateAdminModalOpen(false)
      setMessage('Compte admin cree.')
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setCreatingAdmin(false)
    }
  }


  function openCreateAdminModal() {
    setError('')
    setIsCreateAdminModalOpen(true)
  }

  function closeCreateAdminModal() {
    if (creatingAdmin) {
      return
    }

    setIsCreateAdminModalOpen(false)
    setAdminForm({
      name: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      password: '',
      confirmPassword: '',
    })
  }

  async function confirmPasswordChange(userId) {
    setSavingUserId(userId)
    setMessage('')
    setError('')

    try {
      await adminApi.updateAdminUserPassword(userId, {
        password: passwordDraft.password,
        confirmPassword: passwordDraft.confirmPassword,
      })
      setMessage('Mot de passe admin mis a jour.')
      cancelPasswordChange()
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setSavingUserId(null)
    }
  }

  function beginDecision(user, status) {
    setDecisionDraft({
      userId: user.id,
      status,
      note: status === 'rejected' || status === 'suspended' ? (user.sellerProfile?.approvalNote ?? '') : '',
    })
  }

  function cancelDecision() {
    setDecisionDraft({ userId: null, status: '', note: '' })
  }

  async function confirmDecision(userId) {
    const payload = {
      sellerApprovalStatus: decisionDraft.status,
      sellerApprovalNote: decisionDraft.note,
    }

    const succeeded = await handleUserUpdate(userId, payload)

    if (succeeded) {
      cancelDecision()
    }
  }

  const pendingSellerCount = useMemo(
    () => users.filter((user) => user.sellerProfile?.approvalStatus === 'pending').length,
    [users],
  )

  const summary = useMemo(() => ({
    total: users.length,
    pending: users.filter((user) => user.sellerProfile?.approvalStatus === 'pending').length,
    initialPending: users.filter((user) => user.sellerProfile?.approvalStatus === 'pending' && !hasReviewRequest(user)).length,
    reviewRequested: users.filter((user) => hasReviewRequest(user)).length,
    approvedSellers: users.filter((user) => user.sellerProfile?.approvalStatus === 'approved').length,
    suspendedAccounts: users.filter((user) => (user.status || 'active') === 'suspended').length,
    blockedAccounts: users.filter((user) => (user.status || 'active') === 'blocked').length,
    priority: users.filter((user) => isPriorityUser(user)).length,
  }), [users])

  const pendingSellers = useMemo(
    () => users
      .filter((user) => user.sellerProfile?.approvalStatus === 'pending')
      .sort((left, right) => {
        const leftReviewDate = getLatestReviewRequestDate(left)
        const rightReviewDate = getLatestReviewRequestDate(right)

        if (leftReviewDate !== rightReviewDate) {
          return rightReviewDate - leftReviewDate
        }

        const leftPendingDate = getPendingRequestDate(left)
        const rightPendingDate = getPendingRequestDate(right)

        if (leftPendingDate !== rightPendingDate) {
          return rightPendingDate - leftPendingDate
        }

        return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
      }),
    [users],
  )

  const adminUsers = useMemo(
    () => users
      .filter((user) => user.role === 'admin')
      .sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()

    return [...users]
      .filter((user) => {
        if (user.role === 'admin') {
          return false
        }

        if (filters.role !== 'all' && user.role !== filters.role) {
          return false
        }

        if (filters.status !== 'all' && (user.status || 'active') !== filters.status) {
          return false
        }

        if (filters.sellerApprovalStatus !== 'all') {
          const approvalStatus = user.sellerProfile?.approvalStatus ?? 'none'

          if (approvalStatus !== filters.sellerApprovalStatus) {
            return false
          }
        }

        if (filters.scope === 'priority' && !isPriorityUser(user)) {
          return false
        }

        if (filters.reviewState === 'needs-review' && !hasReviewRequest(user)) {
          return false
        }

        if (filters.reviewState === 'initial-review' && (user.sellerProfile?.approvalStatus !== 'pending' || hasReviewRequest(user))) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [user.name, user.email, user.sellerProfile?.storeName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const priorityDifference = getUserPriority(left) - getUserPriority(right)

        if (priorityDifference !== 0) {
          return priorityDifference
        }

        const leftReviewDate = getLatestReviewRequestDate(left)
        const rightReviewDate = getLatestReviewRequestDate(right)

        if (leftReviewDate !== rightReviewDate) {
          return rightReviewDate - leftReviewDate
        }

        const leftPendingDate = getPendingRequestDate(left)
        const rightPendingDate = getPendingRequestDate(right)

        if (leftPendingDate !== rightPendingDate) {
          return rightPendingDate - leftPendingDate
        }

        return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
      })
  }, [filters, users])

  function handleFilterChange(event) {
    const { name, value } = event.target

    setFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function renderQuickSellerAction(user, approvalStatus) {
    if (!user.sellerProfile || approvalStatus !== 'pending') {
      return null
    }

    const isSaving = savingUserId === user.id

    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          onClick={() => beginDecision(user, 'approved')}
        >
          Approuver
        </button>
        <button
          type="button"
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          onClick={() => beginDecision(user, 'rejected')}
        >
          Refuser
        </button>
      </div>
    )
  }

  function renderDecisionPanel(user) {
    if (decisionDraft.userId !== user.id || !decisionDraft.status) {
      return null
    }

    const requiresReason = decisionDraft.status === 'rejected' || decisionDraft.status === 'suspended'
    const isSaving = savingUserId === user.id
    const actionLabel = decisionDraft.status === 'approved'
      ? 'approuver'
      : decisionDraft.status === 'suspended'
        ? 'suspendre'
        : 'refuser'

    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm font-semibold text-[#161d29]">Confirmer l action</p>
        <p className="mt-2 text-sm text-slate-600">
          Vous allez {actionLabel} la demande vendeur de {user.name}.
        </p>
        {requiresReason ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Motif admin
            <textarea
              className="field mt-2 min-h-28"
              value={decisionDraft.note}
              onChange={(event) => setDecisionDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="Expliquez clairement la raison du refus ou de la suspension"
            />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="button-primary"
            disabled={isSaving || (requiresReason && !decisionDraft.note.trim())}
            onClick={() => confirmDecision(user.id)}
          >
            Confirmer
          </button>
          <button type="button" className="button-secondary" disabled={isSaving} onClick={cancelDecision}>
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title="Gerer les utilisateurs"
        description="L administrateur peut controler les roles, les statuts de compte et la validation des vendeurs. Les vendeurs en attente sont affiches en priorite."
      />

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {loading ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement des utilisateurs...</div>
      ) : (
        <div className="space-y-4">
          {isCreateAdminModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
              <div className="absolute inset-0" onClick={closeCreateAdminModal} />
              <form
                className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-4xl border border-slate-200 bg-white px-5 py-5 shadow-2xl sm:px-6"
                onSubmit={handleCreateAdmin}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-admin-modal-title"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Nouveau compte</p>
                    <h3 id="create-admin-modal-title" className="mt-2 text-2xl font-bold text-[#161d29]">Creer un administrateur</h3>
                    <p className="mt-2 text-sm text-[#627083]">Le compte sera cree directement dans la base et pourra se connecter immediatement.</p>
                  </div>
                  <button type="button" className="button-secondary" disabled={creatingAdmin} onClick={closeCreateAdminModal}>
                    Fermer
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nom complet
                    <input
                      type="text"
                      className="field mt-2"
                      value={adminForm.name}
                      onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Responsable administration"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Email
                    <input
                      type="email"
                      className="field mt-2"
                      value={adminForm.email}
                      onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="admin@exemple.com"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Telephone
                    <input
                      type="text"
                      className="field mt-2"
                      value={adminForm.phoneNumber}
                      onChange={(event) => setAdminForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      placeholder="Numero principal"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    WhatsApp
                    <input
                      type="text"
                      className="field mt-2"
                      value={adminForm.whatsappNumber}
                      onChange={(event) => setAdminForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                      placeholder="Numero WhatsApp"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Mot de passe
                    <input
                      type="password"
                      className="field mt-2"
                      value={adminForm.password}
                      onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Au moins 8 caracteres"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Confirmation
                    <input
                      type="password"
                      className="field mt-2"
                      value={adminForm.confirmPassword}
                      onChange={(event) => setAdminForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      placeholder="Repetez le mot de passe"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Utilisez cette fenetre uniquement pour la creation. Les comptes deja existants se gerent dans la section principale.
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="submit" className="button-primary" disabled={creatingAdmin}>
                    {creatingAdmin ? 'Creation...' : 'Creer le compte admin'}
                  </button>
                  <button type="button" className="button-secondary" disabled={creatingAdmin} onClick={closeCreateAdminModal}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="panel space-y-4 px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Total</p>
                <p className="mt-2 text-2xl font-bold text-[#161d29]">{summary.total}</p>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">En attente</p>
                <p className="mt-2 text-2xl font-bold text-amber-800">{summary.pending}</p>
              </div>
              <div className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">A revoir</p>
                <p className="mt-2 text-2xl font-bold text-sky-800">{summary.reviewRequested}</p>
              </div>
              <div className="rounded-3xl border border-indigo-200 bg-indigo-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Premieres demandes</p>
                <p className="mt-2 text-2xl font-bold text-indigo-800">{summary.initialPending}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Vendeurs valides</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">{summary.approvedSellers}</p>
              </div>
              <div className="rounded-3xl border border-orange-200 bg-orange-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Suspendus</p>
                <p className="mt-2 text-2xl font-bold text-orange-800">{summary.suspendedAccounts}</p>
              </div>
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Bloques</p>
                <p className="mt-2 text-2xl font-bold text-rose-800">{summary.blockedAccounts}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-700">
                {pendingSellerCount} vendeur(s) en attente
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 font-semibold text-sky-700">
                {summary.reviewRequested} dossier(s) a revoir
              </span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 font-semibold text-indigo-700">
                {summary.initialPending} premiere(s) demande(s)
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700">
                {summary.priority} action(s) prioritaire(s)
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700">
                {filteredUsers.length} resultat(s)
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-medium text-slate-700 xl:col-span-2">
                Recherche
                <input
                  type="search"
                  name="search"
                  className="field mt-2"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Nom, email ou boutique"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Portee
                <select name="scope" className="field mt-2" value={filters.scope} onChange={handleFilterChange}>
                  <option value="all">Tous les comptes</option>
                  <option value="priority">Actions prioritaires</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Relecture
                <select name="reviewState" className="field mt-2" value={filters.reviewState} onChange={handleFilterChange}>
                  <option value="all">Tous</option>
                  <option value="needs-review">Dossiers a revoir</option>
                  <option value="initial-review">Premieres demandes</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Role
                <select name="role" className="field mt-2" value={filters.role} onChange={handleFilterChange}>
                  <option value="all">Tous les roles</option>
                  <option value="buyer">Acheteurs</option>
                  <option value="seller">Vendeurs</option>
                  <option value="moderator">Moderateurs</option>
                  <option value="admin">Admins</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Statut du compte
                <select name="status" className="field mt-2" value={filters.status} onChange={handleFilterChange}>
                  <option value="all">Tous les statuts</option>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 xl:col-span-2">
                Validation vendeur
                <select name="sellerApprovalStatus" className="field mt-2" value={filters.sellerApprovalStatus} onChange={handleFilterChange}>
                  <option value="all">Tous</option>
                  <option value="none">Sans profil vendeur</option>
                  {approvalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {pendingSellers.length ? (
            <div className="panel space-y-5 border border-amber-200 bg-amber-50/50 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Validation prioritaire</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#161d29]">Vendeurs en attente</h3>
                  <p className="mt-2 text-sm text-[#627083]">Traitez ici les nouvelles demandes sans parcourir toute la liste.</p>
                </div>
                <span className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700">
                  {pendingSellers.length} a valider
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {pendingSellers.map((user) => (
                  <article key={`pending-${user.id}`} className="rounded-3xl border border-amber-200 bg-white px-5 py-5 shadow-sm">
                    {(() => {
                      const latestEntry = getLatestApprovalHistoryEntry(user)

                      return (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Compte #{user.id}</p>
                        <h4 className="mt-2 text-xl font-bold text-[#161d29]">{user.name}</h4>
                        <p className="mt-2 text-sm text-[#627083]">{user.email}</p>
                        {user.sellerProfile?.storeName ? (
                          <p className="mt-2 text-sm font-medium text-[#475467]">Boutique: {user.sellerProfile.storeName}</p>
                        ) : null}
                        <div className="mt-3 space-y-1 text-xs text-[#627083]">
                          <p>Compte cree le {formatDateTime(user.createdAt)}</p>
                          <p>Demande vendeur creee le {formatDateTime(user.sellerProfile?.createdAt)}</p>
                          {hasReviewRequest(user) && latestEntry?.createdAt ? <p>Derniere resoumission le {formatDateTime(latestEntry.createdAt)}</p> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasReviewRequest(user) ? (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">A revoir</span>
                        ) : null}
                        {isResubmittedToday(user) ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">Resoumis aujourd hui</span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{getPendingStateLabel(user)}</span>
                        <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${getApprovalBadgeClassName('pending')}`}>
                          {getApprovalLabel('pending')}
                        </span>
                      </div>
                    </div>
                      )
                    })()}

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{getRoleLabel(user.role)}</span>
                      <span className={`rounded-full border px-3 py-2 ${getStatusBadgeClassName(user.status || 'active')}`}>
                        {getStatusLabel(user.status || 'active')}
                      </span>
                    </div>

                    <div className="mt-5">
                      {renderQuickSellerAction(user, 'pending')}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {filteredUsers.length === 0 ? (
            <div className="panel px-6 py-10 text-sm text-slate-600">
              Aucun utilisateur ne correspond aux filtres actuels.
            </div>
          ) : null}

          {filteredUsers.length ? (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#f9fbfd]">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a94a3]">
                      <th className="px-5 py-4">Utilisateur</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Statut</th>
                      <th className="px-5 py-4">Vendeur</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const sellerApprovalStatus = user.sellerProfile?.approvalStatus ?? ''
                      const accountStatus = user.status || 'active'

                      return (
                        <tr key={user.id} className="border-b border-[#edf1f4] align-top text-[#475467] transition hover:bg-[#fbfcfe] last:border-b-0">
                          <td className="px-5 py-4">
                            <div className="min-w-64">
                              <p className="font-semibold text-[#161d29]">{user.name}</p>
                              <p className="mt-1 text-sm text-[#627083]">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-2 text-xs font-semibold ${getStatusBadgeClassName(accountStatus)}`}>
                              {getStatusLabel(accountStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {user.sellerProfile ? (
                              <span className={`inline-flex rounded-full border px-3 py-2 text-xs font-semibold ${getApprovalBadgeClassName(sellerApprovalStatus || 'pending')}`}>
                                {getApprovalLabel(sellerApprovalStatus || 'pending')}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-500">Sans profil vendeur</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link to={`/admin/users/${user.id}`} className="inline-flex rounded-lg border border-[#dfe5ec] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#0e9bce] hover:text-[#161d29]">
                              Details
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
            <section className="panel space-y-4 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Equipe admin</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#161d29]">Gerer les comptes administrateurs</h3>
                  <p className="mt-2 text-sm text-[#627083]">Consultez ici les comptes de l equipe admin. Les modifications detaillees se font depuis la fiche de chaque administrateur.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {adminUsers.length} admin(s)
                  </span>
                  <button type="button" className="button-primary" onClick={openCreateAdminModal}>
                    Nouveau compte admin
                  </button>
                </div>
              </div>

              {adminUsers.length ? (
                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#f9fbfd]">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a94a3]">
                        <th className="px-5 py-4">Admin</th>
                        <th className="px-5 py-4">Statut</th>
                        <th className="px-5 py-4">Creation</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => {
                        const accountStatus = user.status || 'active'

                        return (
                          <tr key={`admin-${user.id}`} className="border-t border-slate-200 text-[#475467] transition hover:bg-[#fbfcfe]">
                            <td className="px-5 py-4">
                              <div className="min-w-64">
                                <p className="font-semibold text-[#161d29]">{user.name}</p>
                                <p className="mt-1 text-sm text-[#627083]">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-2 text-xs font-semibold ${getStatusBadgeClassName(accountStatus)}`}>
                                {getStatusLabel(accountStatus)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-[#627083]">{formatDateTime(user.createdAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <Link to={`/admin/users/${user.id}`} className="inline-flex rounded-lg border border-[#dfe5ec] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#0e9bce] hover:text-[#161d29]">
                                Details
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  Aucun administrateur charge pour le moment.
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </section>
  )
}