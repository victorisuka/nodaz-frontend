import { useEffect, useState } from 'react'

import { adminApi } from '../lib/api.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'

function formatMovementDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function AdminStockAuditPage() {
  const [stockMovements, setStockMovements] = useState([])
  const [stockMovementStatus, setStockMovementStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setStockMovementStatus('loading')
    setError('')

    adminApi.getAdminStockMovements({ limit: 200 })
      .then((response) => {
        setStockMovements(response.movements ?? [])
        setStockMovementStatus('succeeded')
      })
      .catch((caughtError) => {
        setError(caughtError.message)
        setStockMovementStatus('failed')
      })
  }, [])

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Controle admin"
        title="Verifier les mises a jour de stock"
        description="Cette vue centralise les ajouts, retraits et imports de stock pour detecter les ajustements anormaux."
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.3fr)_120px_150px_150px_150px] gap-0 border-b border-[#edf1f4] bg-[#f9fbfd] px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a94a3]">
          <span>Produit</span>
          <span>Variation</span>
          <span>Avant / Apres</span>
          <span>Source</span>
          <span>Date</span>
        </div>

        {stockMovementStatus === 'loading' ? (
          <div className="px-5 py-10 text-sm text-[#627083]">Chargement de l'audit stock...</div>
        ) : stockMovements.length ? (
          <div className="divide-y divide-[#edf1f4]">
            {stockMovements.map((movement) => (
              <div key={movement.id} className="grid grid-cols-[minmax(0,1.3fr)_120px_150px_150px_150px] gap-0 px-5 py-4 text-sm text-[#475467]">
                <div>
                  <p className="font-semibold text-[#161d29]">{movement.product?.title || 'Produit supprime'}</p>
                  <p className="mt-1 text-xs text-[#627083]">
                    Par {movement.actor?.name || 'Systeme'} {movement.actor?.role ? `• ${movement.actor.role}` : ''}
                  </p>
                </div>
                <span className={`font-semibold ${movement.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                </span>
                <span>{movement.previousStock} {'->'} {movement.newStock}</span>
                <span>{movement.source}</span>
                <span>{formatMovementDate(movement.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-sm text-[#627083]">Aucun mouvement de stock n'a encore ete enregistre.</div>
        )}
      </div>
    </section>
  )
}