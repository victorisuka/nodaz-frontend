import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { adminApi } from '../lib/api.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'

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

function getStatusLabel(status) {
  return {
    confirmed: 'Confirmee',
    preparing: 'Preparation',
    in_transit: 'Livraison',
    delivered: 'Livree',
    cancelled: 'Annulee',
  }[status] ?? status
}

function getStatusClassName(status) {
  if (status === 'delivered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'cancelled') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (status === 'in_transit' || status === 'preparing') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus('loading')
    setError('')

    adminApi.getAdminOrders()
      .then((response) => {
        setOrders(response.orders ?? [])
        setStatus('succeeded')
      })
      .catch((caughtError) => {
        setError(caughtError.message)
        setStatus('failed')
      })
  }, [])

  const summary = useMemo(() => ({
    total: orders.length,
    confirmed: orders.filter((order) => order.status === 'confirmed').length,
    active: orders.filter((order) => ['preparing', 'in_transit'].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    returns: orders.filter((order) => order.returnRequest?.status === 'requested').length,
  }), [orders])

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Commandes admin"
        title="Superviser toutes les commandes"
        description="Cette vue rassemble les commandes clients, les sous-commandes vendeur et les signaux utiles pour le suivi operationnel."
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Confirmees</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.confirmed}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">En cours</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{summary.active}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Livrees</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{summary.delivered}</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Retours</p>
          <p className="mt-2 text-3xl font-bold text-rose-900">{summary.returns}</p>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement des commandes...</div>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="panel space-y-5 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Commande #{order.id}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">{order.buyer?.name || 'Acheteur inconnu'}</h2>
                  <p className="mt-2 text-sm text-slate-600">{order.buyer?.email} • {order.buyer?.phoneNumber}</p>
                  <p className="mt-2 text-sm text-slate-600">Adresse: {order.shipping?.address || 'Non renseignee'}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className={`rounded-full border px-3 py-2 ${getStatusClassName(order.status)}`}>{getStatusLabel(order.status)}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{order.itemCount} article(s)</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{Number(order.total || 0).toFixed(0)} XAF</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Paiement</p>
                  <p className="mt-2 text-sm text-slate-900">{order.paymentMethod === 'visa' ? 'Carte Visa' : 'Mobile Money'}</p>
                  <p className="mt-1 text-sm text-slate-600">Statut: {order.paymentStatus}</p>
                  <p className="mt-1 text-sm text-slate-600">Recu: {order.receipt?.reference || 'Non emis'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Vendeurs</p>
                  <p className="mt-2 text-sm text-slate-900">{order.sellerOrders?.length || 0} sous-commande(s)</p>
                  <p className="mt-1 text-sm text-slate-600">Commission: {Number(order.marketplaceCommissionTotal || 0).toFixed(0)} XAF</p>
                  <p className="mt-1 text-sm text-slate-600">Reversement: {Number(order.sellerPayoutTotal || 0).toFixed(0)} XAF</p>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Retour / livraison</p>
                  <p className="mt-2 text-sm text-slate-900">Suivi: {order.trackingNumber || 'Non attribue'}</p>
                  <p className="mt-1 text-sm text-slate-600">Retour: {order.returnRequest?.status || 'none'}</p>
                  {order.returnRequest?.reason ? <p className="mt-1 text-sm text-slate-600">Motif: {order.returnRequest.reason}</p> : null}
                </div>
              </div>

              {order.sellerOrders?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sous-commandes vendeur</p>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {order.sellerOrders.map((sellerOrder) => (
                      <div key={sellerOrder.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{sellerOrder.sellerStoreName || `Vendeur #${sellerOrder.sellerUserId}`}</p>
                            <p className="mt-1 text-sm text-slate-600">{getStatusLabel(sellerOrder.status)}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${getStatusClassName(sellerOrder.status)}`}>{sellerOrder.itemCount} article(s)</span>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p>Total vendeur: {Number(sellerOrder.sellerTotal || 0).toFixed(0)} XAF</p>
                          <p>Commission: {Number(sellerOrder.commissionAmount || 0).toFixed(0)} XAF</p>
                          <p>Tracking: {sellerOrder.trackingNumber || 'En attente'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Link to="/admin/users" className="button-secondary">Voir les vendeurs</Link>
                <Link to="/admin/stock-history" className="button-secondary">Verifier le stock</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel px-6 py-10 text-slate-600">Aucune commande n a encore ete enregistree.</div>
      )}
    </section>
  )
}