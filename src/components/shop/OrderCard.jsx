import { useState } from 'react'
import { Link } from 'react-router-dom'

import { getProductImageUrl } from '../../lib/productImage.js'

function getStatusLabel(status) {
  const labels = {
    confirmed: 'Confirmee',
    cancelled: 'Annulee',
    preparing: 'En preparation',
    in_transit: 'En cours de livraison',
    delivered: 'Livree',
  }

  return labels[status] ?? status
}

function getOrderSteps(order) {
  const hasBuyerProfile = Boolean(order.buyer?.name && order.buyer?.email && order.buyer?.phoneNumber)
  const hasPayment = Boolean(order.paymentStatus)
  const isCancelled = order.status === 'cancelled'
  const isPreparing = ['preparing', 'in_transit', 'delivered'].includes(order.status)
  const isShipped = ['in_transit', 'delivered'].includes(order.status)
  const isDelivered = order.status === 'delivered'

  return [
    {
      key: 'order',
      label: 'Commande',
      state: 'done',
      description: `Commande #${order.id} enregistree`,
    },
    {
      key: 'profile',
      label: 'Profil',
      state: hasBuyerProfile ? 'done' : 'pending',
      description: hasBuyerProfile ? 'Informations personnelles confirmees' : 'Informations en attente',
    },
    {
      key: 'payment',
      label: 'Paiement',
      state: hasPayment ? 'done' : 'pending',
      description: hasPayment ? `${order.paymentMethod === 'visa' ? 'Visa' : 'Mobile Money'} verifie` : 'Paiement en attente',
    },
    {
      key: 'preparation',
      label: 'Preparation',
      state: isCancelled ? 'pending' : isPreparing ? (order.status === 'preparing' ? 'active' : 'done') : 'pending',
      description: isCancelled ? 'Commande annulee avant preparation' : isPreparing ? 'Le vendeur prepare la commande' : 'En attente vendeur',
    },
    {
      key: 'shipping',
      label: 'Expedition',
      state: isCancelled ? 'pending' : isShipped ? (order.status === 'in_transit' ? 'active' : 'done') : 'pending',
      description: isCancelled ? 'Expedition annulee' : isShipped ? (order.trackingNumber || 'Colis remis au transporteur') : 'Pas encore expedie',
    },
    {
      key: 'delivery',
      label: 'Livraison',
      state: isCancelled ? 'pending' : isDelivered ? 'done' : 'pending',
      description: isCancelled ? 'Livraison annulee' : isDelivered ? 'Reception confirmee' : 'Livraison en attente',
    },
    {
      key: 'review',
      label: 'Avis',
      state: isCancelled ? 'pending' : isDelivered ? 'active' : 'pending',
      description: isCancelled ? 'Aucun avis sur une commande annulee' : isDelivered ? 'Vous pouvez laisser un avis' : 'Disponible apres livraison',
    },
  ]
}

function getStepStyles(state) {
  if (state === 'done') {
    return {
      badgeClassName: 'border-emerald-600 bg-emerald-600 text-white',
      lineClassName: 'bg-emerald-500',
      textClassName: 'text-emerald-900',
      descriptionClassName: 'text-emerald-700',
    }
  }

  if (state === 'active') {
    return {
      badgeClassName: 'border-amber-500 bg-amber-500 text-slate-950',
      lineClassName: 'bg-slate-200',
      textClassName: 'text-amber-950',
      descriptionClassName: 'text-amber-800',
    }
  }

  return {
    badgeClassName: 'border-slate-300 bg-white text-slate-500',
    lineClassName: 'bg-slate-200',
    textClassName: 'text-slate-700',
    descriptionClassName: 'text-slate-500',
  }
}

export function OrderCard({ order, onCancelOrder, onConfirmDelivery, onRequestReturn, isBusy = false }) {
  const [returnReason, setReturnReason] = useState('')
  const steps = getOrderSteps(order)

  async function handleReturnSubmit(event) {
    event.preventDefault()

    if (!returnReason.trim()) {
      return
    }

    await onRequestReturn?.(order.id, returnReason.trim())
    setReturnReason('')
  }

  return (
    <article className="panel overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Commande #{order.id}</p>
          <h3 className="headline mt-2 text-2xl text-slate-950">{order.itemCount} articles • {getStatusLabel(order.status)}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-950 px-4 py-2 font-semibold text-white">
            ${Number(order.total).toFixed(2)}
          </span>
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-3xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Informations acheteur</p>
          <p className="mt-2 text-sm text-slate-700">{order.buyer?.name}</p>
          <p className="mt-1 text-sm text-slate-600">{order.buyer?.email}</p>
          <p className="mt-1 text-sm text-slate-600">{order.buyer?.phoneNumber}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Adresse de livraison</p>
          <p className="mt-2 text-sm text-slate-700">{order.shipping?.address}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Paiement</p>
          <p className="mt-2 text-sm text-slate-700">{order.paymentMethod === 'visa' ? 'Carte Visa' : 'Mobile Money'}</p>
          <p className="mt-1 text-sm text-slate-600">Transaction {order.paymentStatus}</p>
          <p className="mt-1 text-sm text-slate-600">Recu {order.receipt?.reference}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Suivi</p>
          <p className="mt-2 text-sm text-slate-700">{order.trackingNumber || "Attribue au moment de l'expedition"}</p>
          <p className="mt-1 text-sm text-slate-600">Canaux: {(order.receipt?.channels ?? []).join(', ') || 'email'}</p>
        </div>
      </div>

      {order.sellerOrders?.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sous-commandes vendeur</p>
          <div className="grid gap-3 xl:grid-cols-2">
            {order.sellerOrders.map((sellerOrder) => (
              <article key={sellerOrder.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{sellerOrder.sellerStoreName || `Vendeur #${sellerOrder.sellerUserId}`}</p>
                    <p className="mt-1 text-sm text-slate-600">{getStatusLabel(sellerOrder.status)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
                    ${Number(sellerOrder.sellerTotal).toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="text-sm text-slate-600">
                    <p>Commission: ${Number(sellerOrder.commissionAmount ?? 0).toFixed(2)}</p>
                    <p className="mt-1">Reversement vendeur: ${Number(sellerOrder.payoutAmount ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Suivi: {sellerOrder.trackingNumber || 'En attente'}</p>
                    <p className="mt-1">Articles: {sellerOrder.itemCount}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Etapes</p>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-0 px-1">
          {steps.map((step, index) => {
            const styles = getStepStyles(step.state)
            const isLast = index === steps.length - 1

            return (
              <div key={step.key} className="flex min-w-42 items-start">
                <div className="flex w-full flex-col items-start">
                  <div className="flex w-full items-center">
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${styles.badgeClassName}`}>
                      {index + 1}
                    </span>
                    {!isLast ? <span className={`mx-3 h-1 flex-1 rounded-full ${styles.lineClassName}`} /> : null}
                  </div>
                  <div className="pt-3 pr-4">
                    <p className={`text-sm font-semibold ${styles.textClassName}`}>{step.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${styles.descriptionClassName}`}>{step.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Articles</p>
        <ul className="space-y-4">
        {order.products.map((product) => (
          <li key={`${order.id}-${product.id}`} className="flex gap-4 rounded-3xl bg-slate-50 p-4">
            <img
              src={getProductImageUrl(product.imageUrl)}
              alt={product.title}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900">{product.title}</h4>
              <p className="mt-1 text-sm text-slate-600">{product.quantity} x ${Number(product.price).toFixed(2)}</p>
              {product.sellerStoreName ? <p className="mt-1 text-sm text-slate-500">Vendeur: {product.sellerStoreName}</p> : null}
              {order.status === 'delivered' ? (
                <Link to={`/products/${product.id}`} className="mt-2 inline-flex text-sm font-medium text-teal-800">
                  Laisser un avis
                </Link>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-teal-800">${Number(product.subtotal).toFixed(2)}</p>
          </li>
        ))}
        </ul>
      </div>

      {order.timeline?.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Historique</p>
          <ul className="space-y-3">
            {order.timeline.map((event) => (
              <li key={event.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {['confirmed', 'preparing'].includes(order.status) ? (
          <button type="button" className="button-danger" disabled={isBusy} onClick={() => onCancelOrder?.(order.id)}>
            Annuler la commande
          </button>
        ) : null}
        {order.status === 'in_transit' ? (
          <button type="button" className="button-primary" disabled={isBusy} onClick={() => onConfirmDelivery?.(order.id)}>
            Confirmer la reception
          </button>
        ) : null}
      </div>

      {order.status === 'cancelled' ? (
        <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          Cette commande a ete annulee avant expedition.
        </div>
      ) : null}

      {order.returnRequest?.status === 'requested' ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          Retour ou remboursement demande: {order.returnRequest.reason}
        </div>
      ) : null}

      {order.status === 'delivered' && order.returnRequest?.status !== 'requested' ? (
        <form className="mt-5 space-y-3" onSubmit={handleReturnSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`return-reason-${order.id}`}>
            Demander un retour ou remboursement
          </label>
          <textarea
            id={`return-reason-${order.id}`}
            rows="3"
            className="field"
            value={returnReason}
            onChange={(event) => setReturnReason(event.target.value)}
            placeholder="Expliquez le probleme rencontre avec la commande"
          />
          <button type="submit" className="button-secondary" disabled={isBusy || !returnReason.trim()}>
            Envoyer la demande
          </button>
        </form>
      ) : null}
    </article>
  )
}