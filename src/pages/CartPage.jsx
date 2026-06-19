import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { fetchCart, removeItemFromCart } from '../redux/cart/cartActions.js'
import { fetchOrders } from '../redux/orders/ordersActions.js'
import { createOrder } from '../redux/orders/ordersActions.js'
import { getProductImageUrl } from '../lib/productImage.js'

function formatCurrency(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

export function CartPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items, total, status, error } = useAppSelector((state) => state.cart)
  const { user } = useAppSelector((state) => state.auth)
  const ordersState = useAppSelector((state) => state.orders)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutForm, setCheckoutForm] = useState({
    buyerName: user?.name ?? '',
    buyerEmail: user?.email ?? '',
    buyerPhoneNumber: user?.phoneNumber ?? '',
    shippingAddress: '',
    shippingContactName: user?.name ?? '',
    shippingContactPhone: user?.phoneNumber ?? '',
    paymentMethod: 'mobile-money',
  })

  useEffect(() => {
    dispatch(fetchCart())
  }, [dispatch])

  useEffect(() => {
    if (ordersState.status === 'idle') {
      dispatch(fetchOrders())
    }
  }, [dispatch, ordersState.status])

  useEffect(() => {
    setCheckoutForm((current) => ({
      ...current,
      buyerName: current.buyerName || user?.name || '',
      buyerEmail: current.buyerEmail || user?.email || '',
      buyerPhoneNumber: current.buyerPhoneNumber || user?.phoneNumber || '',
      shippingContactName: current.shippingContactName || user?.name || '',
      shippingContactPhone: current.shippingContactPhone || user?.phoneNumber || '',
    }))
  }, [user])

  const savedAddresses = useMemo(
    () => [...new Set((ordersState.items ?? []).map((order) => order.shipping?.address).filter(Boolean))],
    [ordersState.items],
  )

  function handleChange(event) {
    const { name, value } = event.target
    setCheckoutForm((current) => ({ ...current, [name]: value }))
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault()
    setCheckoutError('')

    try {
      await dispatch(createOrder(checkoutForm)).unwrap()
      navigate('/orders')
    } catch (caughtError) {
      await dispatch(fetchCart())
      setCheckoutError(caughtError.message)
    }
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Votre panier"
        title="Confirmez vos informations avant paiement"
        description="Validez vos coordonnees, choisissez une adresse de livraison, puis reglez avec Visa ou Mobile Money pour lancer la preparation de la commande."
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {checkoutError ? <StatusMessage tone="error">{checkoutError}</StatusMessage> : null}

      {status === 'loading' ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement du panier...</div>
      ) : items.length ? (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="panel flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <img
                  src={getProductImageUrl(item.imageUrl)}
                  alt={item.title}
                  className="h-24 w-24 rounded-3xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">Quantite : {item.quantity}</p>
                  <p className="mt-1 text-sm text-slate-600">Prix unitaire : ${formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-semibold text-teal-800">${formatCurrency(item.subtotal)}</p>
                  <button type="button" className="button-danger" onClick={() => dispatch(removeItemFromCart(item.id))}>
                    Retirer
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="panel h-fit px-6 py-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Paiement</p>
            <h2 className="headline mt-3 text-4xl text-slate-950">${formatCurrency(total)}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Le paiement est verifie pendant la confirmation, un recu est genere pour l'email et le SMS, puis le vendeur est notifie.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCheckoutSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="buyerName">Nom complet</label>
                <input id="buyerName" name="buyerName" className="field" value={checkoutForm.buyerName} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="buyerEmail">Email</label>
                <input id="buyerEmail" name="buyerEmail" type="email" className="field" value={checkoutForm.buyerEmail} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="buyerPhoneNumber">Telephone</label>
                <input id="buyerPhoneNumber" name="buyerPhoneNumber" className="field" value={checkoutForm.buyerPhoneNumber} onChange={handleChange} />
              </div>

              {savedAddresses.length ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="savedAddress">Adresse recente</label>
                  <select
                    id="savedAddress"
                    className="field"
                    defaultValue=""
                    onChange={(event) => {
                      if (event.target.value) {
                        setCheckoutForm((current) => ({ ...current, shippingAddress: event.target.value }))
                      }
                    }}
                  >
                    <option value="">Choisir une adresse deja utilisee</option>
                    {savedAddresses.map((address) => (
                      <option key={address} value={address}>{address}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="shippingAddress">Adresse de livraison</label>
                <textarea id="shippingAddress" name="shippingAddress" rows="3" className="field" value={checkoutForm.shippingAddress} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="shippingContactName">Contact livraison</label>
                <input id="shippingContactName" name="shippingContactName" className="field" value={checkoutForm.shippingContactName} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="shippingContactPhone">Telephone livraison</label>
                <input id="shippingContactPhone" name="shippingContactPhone" className="field" value={checkoutForm.shippingContactPhone} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="paymentMethod">Mode de paiement</label>
                <select id="paymentMethod" name="paymentMethod" className="field" value={checkoutForm.paymentMethod} onChange={handleChange}>
                  <option value="mobile-money">Mobile Money</option>
                  <option value="visa">Carte Visa</option>
                </select>
              </div>

              <button type="submit" className="button-primary mt-2 w-full">
                Confirmer la commande
              </button>
            </form>
          </aside>
        </div>
      ) : (
        <EmptyState
          title="Your cart is empty"
        />
      )}
    </section>
  )
}