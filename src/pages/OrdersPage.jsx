import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { OrderCard } from '../components/shop/OrderCard.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { cancelOrder, confirmOrderDelivery, fetchOrders, requestOrderReturn } from '../redux/orders/ordersActions.js'

export function OrdersPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  async function handleConfirmDelivery(orderId) {
    await dispatch(confirmOrderDelivery(orderId)).unwrap()
  }

  async function handleCancelOrder(orderId) {
    await dispatch(cancelOrder(orderId)).unwrap()
  }

  async function handleRequestReturn(orderId, reason) {
    await dispatch(requestOrderReturn({ orderId, reason })).unwrap()
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Commandes"
        title="Suivre vos commandes simplement"
        description="Retrouvez le statut, les articles et les actions utiles sans surcharge."
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {status === 'loading' ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement des commandes...</div>
      ) : items.length ? (
        <div className="space-y-4">
          {items.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isBusy={status === 'loading'}
              onCancelOrder={handleCancelOrder}
              onConfirmDelivery={handleConfirmDelivery}
              onRequestReturn={handleRequestReturn}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune commande pour le moment"
          description="Vos commandes apparaitront ici apres votre premier achat."
        />
      )}
    </section>
  )
}