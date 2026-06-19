import { useEffect, useState } from 'react'

import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { sellerApi } from '../lib/api.js'

function getSellerStatusLabel(status) {
  const labels = {
    confirmed: 'Confirmee',
    preparing: 'En preparation',
    in_transit: 'En cours de livraison',
    delivered: 'Livree',
  }

  return labels[status] ?? status
}

function formatAmount(value) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

export function SellerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function loadOrders() {
    setStatus('loading')
    setError('')

    try {
      const response = await sellerApi.getSellerOrders()
      setOrders(response.orders ?? [])
      setStatus('succeeded')
    } catch (caughtError) {
      setError(caughtError.message)
      setStatus('failed')
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function handleStatusUpdate(orderId, nextStatus) {
    setStatus('loading')
    setError('')

    try {
      const response = await sellerApi.updateSellerOrderStatus(orderId, { status: nextStatus })
      setOrders((current) => current.map((order) => (order.id === orderId ? response.order : order)))
      setStatus('succeeded')
    } catch (caughtError) {
      setError(caughtError.message)
      setStatus('failed')
    }
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Commandes vendeurs"
        title="Suivre et preparer les commandes"
        description="L'essentiel pour traiter une commande client rapidement."
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {status === 'loading' ? <div className="panel px-6 py-10 text-slate-600">Chargement des commandes...</div> : null}

      {status !== 'loading' && orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="panel space-y-5 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Commande #{order.parentOrderId} • Expedition #{order.id}
                  </p>
                  <h3 className="headline mt-2 text-2xl text-slate-950">{getSellerStatusLabel(order.status)}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-950 px-4 py-2 font-semibold text-white">{formatAmount(order.sellerTotal ?? order.total)}</span>
                  <span>{order.buyer?.name} • {order.buyer?.phoneNumber}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Client</p>
                  <p className="mt-2 text-sm text-slate-700">{order.buyer?.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.buyer?.email}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.buyer?.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Livraison</p>
                  <p className="mt-2 text-sm text-slate-700">{order.shipping?.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Paiement</p>
                  <p className="mt-2 text-sm text-slate-700">{order.paymentMethod === 'visa' ? 'Carte Visa' : 'Mobile Money'}</p>
                  <p className="mt-1 text-sm text-slate-600">Statut: {order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Montants</p>
                  <p className="mt-2 text-sm text-slate-700">Commission: {formatAmount(order.commissionAmount)}</p>
                  <p className="mt-1 text-sm text-slate-600">Reversement: {formatAmount(order.payoutAmount)}</p>
                  <p className="mt-1 text-sm text-slate-600">Suivi: {order.trackingNumber || 'En attente'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Articles</p>
                <ul className="space-y-3">
                {order.products.map((product) => (
                  <li key={`${order.id}-${product.id}`} className="rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900">{product.title}</span>
                      <span>{product.quantity} x {formatAmount(product.price)}</span>
                    </div>
                  </li>
                ))}
                </ul>
              </div>

              {order.timeline?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Historique</p>
                  <ul className="space-y-3">
                    {order.timeline.map((event) => (
                      <li key={event.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            {new Date(event.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{event.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {order.status === 'confirmed' ? (
                  <button type="button" className="button-primary" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                    Mettre en preparation
                  </button>
                ) : null}
                {['confirmed', 'preparing'].includes(order.status) ? (
                  <button type="button" className="button-secondary" onClick={() => handleStatusUpdate(order.id, 'in_transit')}>
                    Remettre au transporteur
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {status !== 'loading' && !orders.length ? (
        <EmptyState
          title="Aucune commande client"
          description="Les commandes de vos clients apparaitront ici des qu'un achat sera valide."
        />
      ) : null}
    </section>
  )
}