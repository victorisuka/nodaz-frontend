import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { adminApi } from '../lib/api.js'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'

const LOW_STOCK_THRESHOLD = 5

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

function hasReviewRequest(user) {
  const history = Array.isArray(user.sellerProfile?.approvalHistory) ? user.sellerProfile.approvalHistory : []
  const lastEntry = history[history.length - 1] ?? null

  return user.sellerProfile?.approvalStatus === 'pending' && lastEntry?.actorRole === 'seller'
}

function getLatestReviewRequestDate(user) {
  if (!hasReviewRequest(user)) {
    return 0
  }

  const history = Array.isArray(user.sellerProfile?.approvalHistory) ? user.sellerProfile.approvalHistory : []
  const lastEntry = history[history.length - 1] ?? null

  return lastEntry?.createdAt ? new Date(lastEntry.createdAt).getTime() : 0
}

function getPendingRequestDate(user) {
  return user.sellerProfile?.createdAt ? new Date(user.sellerProfile.createdAt).getTime() : 0
}

function getPriorityRank(user) {
  const approvalStatus = user.sellerProfile?.approvalStatus ?? ''
  const accountStatus = user.status || 'active'

  if (hasReviewRequest(user)) {
    return 0
  }

  if (approvalStatus === 'pending') {
    return 1
  }

  if (approvalStatus === 'suspended') {
    return 2
  }

  if (accountStatus === 'suspended' || accountStatus === 'blocked') {
    return 3
  }

  return 4
}

function getMovementTone(movement) {
  if ((movement.newStock ?? 0) <= LOW_STOCK_THRESHOLD) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  if ((movement.delta ?? 0) < 0) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function DashboardMetric({ label, value, tone, helper }) {
  return (
    <div className={`rounded-3xl border px-4 py-4 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {helper ? <p className="mt-2 text-sm opacity-80">{helper}</p> : null}
    </div>
  )
}

function DashboardModule({ title, description, stats, actions }) {
  return (
    <article className="panel space-y-4 px-5 py-5 sm:px-6">
      <div>
        <h2 className="headline text-2xl text-[#161d29]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#627083]">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={`${title}-${stat.label}`} className="rounded-2xl bg-[#f9fbfd] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">{stat.label}</p>
            <p className="mt-2 text-xl font-bold text-[#161d29]">{stat.value}</p>
            {stat.helper ? <p className="mt-1 text-sm text-[#627083]">{stat.helper}</p> : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Link key={`${title}-${action.to}`} to={action.to} className={action.primary ? 'button-primary' : 'button-secondary'}>
            {action.label}
          </Link>
        ))}
      </div>
    </article>
  )
}

export function AdminDashboardPage() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function loadDashboard() {
    setError('')

    return Promise.allSettled([
      adminApi.getAdminOverview(),
      adminApi.getAdminUsers(),
      adminApi.getAdminCategories(),
      adminApi.getAdminStockMovements({ limit: 12 }),
    ]).then(([overviewResult, usersResult, categoriesResult, movementsResult]) => {
      let hasFailure = false

      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value?.overview ?? null)
      } else {
        hasFailure = true
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value?.users ?? [])
      } else {
        hasFailure = true
      }

      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value?.categories ?? [])
      } else {
        hasFailure = true
      }

      if (movementsResult.status === 'fulfilled') {
        setMovements(movementsResult.value?.movements ?? [])
      } else {
        hasFailure = true
      }

      if (hasFailure) {
        setError('Certaines donnees admin n ont pas pu etre chargees. Les blocs disponibles ont ete affiches.')
      }
    })
  }

  useEffect(() => {
    loadDashboard().finally(() => {
      setLoading(false)
    })
  }, [])

  useRealtimeNotifications({
    enabled: true,
    onEvent: (event) => {
      if (!['seller.approval.requested', 'seller.approval.updated', 'seller.approval.resubmitted', 'user.account.updated', 'stock.low'].includes(event.type)) {
        return
      }

      loadDashboard()

      if (event.type === 'seller.approval.requested') {
        setMessage('Nouvelle demande vendeur detectee. Le dashboard a ete actualise.')
      }

      if (event.type === 'seller.approval.resubmitted') {
        setMessage('Un dossier vendeur corrige a ete renvoye. Le dashboard a ete actualise.')
      }

      if (event.type === 'stock.low') {
        setMessage('Une alerte de stock bas a ete recue. Le dashboard a ete actualise.')
      }
    },
    shouldDisplayEvent: (event) => ['seller.approval.requested', 'seller.approval.updated', 'seller.approval.resubmitted', 'user.account.updated', 'stock.low'].includes(event.type),
  })

  const summary = useMemo(() => {
    const topLevelCategories = overview?.categories?.topLevel ?? categories.filter((category) => !category.parentId).length
    const subcategories = overview?.categories?.subcategories ?? categories.filter((category) => category.parentId).length
    const pendingSellers = overview?.sellerProfiles?.pending ?? users.filter((user) => user.sellerProfile?.approvalStatus === 'pending').length
    const approvedSellers = overview?.sellerProfiles?.approved ?? users.filter((user) => user.sellerProfile?.approvalStatus === 'approved').length
    const reviewRequested = users.filter((user) => hasReviewRequest(user)).length
    const suspendedAccounts = overview?.users?.suspended ?? users.filter((user) => (user.status || 'active') === 'suspended').length
    const blockedAccounts = overview?.users?.blocked ?? users.filter((user) => (user.status || 'active') === 'blocked').length
    const lowStockMovements = movements.filter((movement) => (movement.newStock ?? Number.MAX_SAFE_INTEGER) <= LOW_STOCK_THRESHOLD).length

    return {
      totalUsers: overview?.users?.total ?? users.length,
      sellersPending: pendingSellers,
      sellersReviewRequested: reviewRequested,
      sellersApproved: approvedSellers,
      suspendedAccounts,
      blockedAccounts,
      topLevelCategories,
      subcategories,
      movements: movements.length,
      lowStockMovements,
      totalProducts: overview?.products?.total ?? 0,
      activeProducts: overview?.products?.active ?? 0,
      inactiveProducts: overview?.products?.inactive ?? 0,
      lowStockProducts: overview?.products?.lowStock ?? 0,
      totalOrders: overview?.orders?.total ?? 0,
      confirmedOrders: overview?.orders?.confirmed ?? 0,
      deliveredOrders: overview?.orders?.delivered ?? 0,
      cancelledOrders: overview?.orders?.cancelled ?? 0,
      returnRequestedOrders: overview?.orders?.returnRequested ?? 0,
      totalSellerOrders: overview?.orders?.sellerOrders ?? 0,
      sellerGross: overview?.finance?.sellerGross ?? 0,
      commissions: overview?.finance?.commissions ?? 0,
      payouts: overview?.finance?.payouts ?? 0,
    }
  }, [categories, movements, overview, users])

  const priorityUsers = useMemo(() => {
    return [...users]
      .filter((user) => getPriorityRank(user) < 4)
      .sort((left, right) => {
        const priorityDifference = getPriorityRank(left) - getPriorityRank(right)

        if (priorityDifference !== 0) {
          return priorityDifference
        }

        const reviewDateDifference = getLatestReviewRequestDate(right) - getLatestReviewRequestDate(left)

        if (reviewDateDifference !== 0) {
          return reviewDateDifference
        }

        const pendingDateDifference = getPendingRequestDate(right) - getPendingRequestDate(left)

        if (pendingDateDifference !== 0) {
          return pendingDateDifference
        }

        return (left.name || '').localeCompare(right.name || '', 'fr', { sensitivity: 'base' })
      })
      .slice(0, 5)
  }, [users])

  const categoryHighlights = useMemo(() => {
    const parents = categories.filter((category) => !category.parentId)

    return parents
      .map((category) => ({
        id: category.id,
        name: category.name,
        childCount: categories.filter((entry) => Number(entry.parentId) === Number(category.id)).length,
        imageUrl: category.imageUrl || '',
      }))
      .sort((left, right) => right.childCount - left.childCount || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }))
      .slice(0, 4)
  }, [categories])

  const recentMovements = useMemo(() => movements.slice(0, 6), [movements])

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title="Piloter la plateforme"
        description="Le tableau de bord centralise les validations vendeur, la sante des comptes, la couverture du catalogue et l activite stock deja disponibles dans l application."
      />

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <section className="panel space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Vue d ensemble</p>
            <h2 className="mt-2 text-2xl font-bold text-[#161d29]">Operations admin en direct</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users" className="button-primary">Traiter les utilisateurs</Link>
            <Link to="/admin/orders" className="button-secondary">Suivre les commandes</Link>
            <Link to="/admin/categories" className="button-secondary">Configurer les categories</Link>
            <Link to="/admin/stock-history" className="button-secondary">Voir l audit stock</Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetric label="Demandes vendeur" value={summary.sellersPending} helper={`${summary.sellersReviewRequested} dossier(s) a revoir`} tone="border-amber-200 bg-amber-50 text-amber-800" />
          <DashboardMetric label="Vendeurs actifs" value={summary.sellersApproved} helper="Espaces vendeur approuves" tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
          <DashboardMetric label="Comptes a risque" value={summary.suspendedAccounts + summary.blockedAccounts} helper={`${summary.suspendedAccounts} suspendu(s), ${summary.blockedAccounts} bloque(s)`} tone="border-rose-200 bg-rose-50 text-rose-800" />
          <DashboardMetric label="Categories" value={summary.topLevelCategories} helper={`${summary.subcategories} sous-categorie(s)`} tone="border-sky-200 bg-sky-50 text-sky-800" />
          <DashboardMetric label="Commandes" value={summary.totalOrders} helper={`${summary.confirmedOrders} en cours, ${summary.deliveredOrders} livree(s)`} tone="border-indigo-200 bg-indigo-50 text-indigo-800" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="panel space-y-5 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Priorite admin</p>
              <h2 className="mt-2 text-2xl font-bold text-[#161d29]">Dossiers a traiter en premier</h2>
            </div>
            <Link to="/admin/users" className="text-sm font-semibold text-teal-800">Ouvrir la file complete</Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Chargement des priorites...</div>
          ) : priorityUsers.length ? (
            <div className="space-y-3">
              {priorityUsers.map((user) => {
                const approvalStatus = user.sellerProfile?.approvalStatus ?? ''
                const accountStatus = user.status || 'active'
                const badge = hasReviewRequest(user)
                  ? 'A revoir'
                  : approvalStatus === 'pending'
                    ? 'Nouvelle demande'
                    : approvalStatus === 'suspended'
                      ? 'Vendeur suspendu'
                      : accountStatus === 'blocked'
                        ? 'Compte bloque'
                        : 'Compte suspendu'

                return (
                  <div key={user.id} className="rounded-3xl border border-slate-200 bg-[#f9fbfd] px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#161d29]">{user.name}</p>
                        <p className="mt-1 text-sm text-[#627083]">{user.email}</p>
                        {user.sellerProfile?.storeName ? <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#8a94a3]">{user.sellerProfile.storeName}</p> : null}
                      </div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">{badge}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#627083]">
                      {approvalStatus ? <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Validation: {approvalStatus}</span> : null}
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Compte: {accountStatus}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Mis a jour le {formatDateTime(user.updatedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Aucun dossier prioritaire pour le moment.</div>
          )}
        </article>

        <article className="panel space-y-5 px-5 py-5 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Catalogue</p>
              <h2 className="mt-2 text-2xl font-bold text-[#161d29]">Couverture des categories</h2>
            </div>
            <Link to="/admin/categories" className="text-sm font-semibold text-teal-800">Tout gerer</Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Chargement des categories...</div>
          ) : categoryHighlights.length ? (
            <div className="space-y-3">
              {categoryHighlights.map((category) => (
                <div key={category.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#161d29]">{category.name}</p>
                      <p className="mt-1 text-sm text-[#627083]">{category.childCount} sous-categorie(s)</p>
                    </div>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">{category.imageUrl ? 'Image configuree' : 'Image a verifier'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Aucune categorie n est encore disponible.</div>
          )}
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardModule
          title="Utilisateurs"
          description="Le module utilisateurs couvre deja la revue vendeur, la gestion des statuts de compte et le controle des roles applicatifs."
          stats={[
            { label: 'Total comptes', value: summary.totalUsers },
            { label: 'Dossiers a revoir', value: summary.sellersReviewRequested },
            { label: 'Comptes suspendus', value: summary.suspendedAccounts },
            { label: 'Comptes bloques', value: summary.blockedAccounts },
          ]}
          actions={[
            { to: '/admin/users', label: 'Ouvrir les utilisateurs', primary: true },
          ]}
        />
        <DashboardModule
          title="Catalogue"
          description="Le parametrage de catalogue permet deja d enrichir les categories, de suivre les produits actifs et de surveiller les faibles niveaux de stock."
          stats={[
            { label: 'Categories racine', value: summary.topLevelCategories },
            { label: 'Sous-categories', value: summary.subcategories },
            { label: 'Produits actifs', value: summary.activeProducts },
            { label: 'Stock bas', value: summary.lowStockProducts },
          ]}
          actions={[
            { to: '/admin/categories', label: 'Parametrer les categories', primary: true },
          ]}
        />
        <DashboardModule
          title="Commandes"
          description="La supervision des commandes couvre deja les volumes, les livraisons, les annulations et les retours demandes par les acheteurs."
          stats={[
            { label: 'Total commandes', value: summary.totalOrders },
            { label: 'Confirmees', value: summary.confirmedOrders },
            { label: 'Livrees', value: summary.deliveredOrders },
            { label: 'Retours demandes', value: summary.returnRequestedOrders },
          ]}
          actions={[
            { to: '/admin/orders', label: 'Voir les commandes', primary: true },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardModule
          title="Flux financiers"
          description="Le dashboard expose maintenant les volumes vendeurs, la commission marketplace et les montants estimatifs de reversement deja traces par seller order."
          stats={[
            { label: 'Volume vendeurs', value: `${summary.sellerGross.toFixed(0)} XAF` },
            { label: 'Commissions', value: `${summary.commissions.toFixed(0)} XAF` },
            { label: 'Reversements', value: `${summary.payouts.toFixed(0)} XAF` },
            { label: 'Commandes vendeur', value: summary.totalSellerOrders },
          ]}
          actions={[
            { to: '/admin/users', label: 'Voir les vendeurs', primary: false },
            { to: '/admin/orders', label: 'Suivre les commandes', primary: true },
          ]}
        />
        <DashboardModule
          title="Risque et moderation"
          description="Les alertes deja exploitables cote admin sont les comptes suspendus ou bloques, les vendeurs refuses et les ruptures proches."
          stats={[
            { label: 'Comptes suspendus', value: summary.suspendedAccounts },
            { label: 'Comptes bloques', value: summary.blockedAccounts },
            { label: 'Produits inactifs', value: summary.inactiveProducts },
            { label: 'Mouvements recents', value: summary.movements },
          ]}
          actions={[
            { to: '/admin/users', label: 'Traiter les risques', primary: true },
          ]}
        />
      </div>

      <article className="panel space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Activite recente</p>
            <h2 className="mt-2 text-2xl font-bold text-[#161d29]">Mouvements de stock surveilles</h2>
          </div>
          <Link to="/admin/stock-history" className="text-sm font-semibold text-teal-800">Voir tout l audit</Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Chargement des mouvements...</div>
        ) : recentMovements.length ? (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#161d29]">{movement.product?.title || 'Produit supprime'}</p>
                    <p className="mt-1 text-sm text-[#627083]">{movement.source || 'source inconnue'}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${getMovementTone(movement)}`}>
                    {(movement.delta ?? 0) >= 0 ? `+${movement.delta}` : movement.delta}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-[#627083]">
                  <p>Stock: {movement.previousStock} {'->'} {movement.newStock}</p>
                  <p>Par {movement.actor?.name || 'Systeme'}</p>
                  <p>{formatDateTime(movement.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Aucun mouvement de stock recent n a ete charge.</div>
        )}
      </article>
    </section>
  )
}