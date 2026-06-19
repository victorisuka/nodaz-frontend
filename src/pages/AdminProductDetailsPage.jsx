import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { deleteAdminProduct, fetchAdminProducts, fetchAdminStockMovements, reviewAdminProduct, toggleAdminProductActivation, updateAdminProductStock } from '../redux/admin/adminActions.js'
import { getProductImageUrl } from '../lib/productImage.js'

function formatMovementDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMovementSource(value) {
  switch (value) {
    case 'product_create':
      return 'Creation du produit'
    case 'product_edit':
      return 'Mise a jour du produit'
    case 'manual_update':
      return 'Mise a jour manuelle'
    case 'stock_import':
      return 'Import Excel'
    default:
      return value || 'Mouvement'
  }
}

function formatVariantLabel(variant) {
  return variant.color ? 'Couleur disponible' : 'Couleur'
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(Number(value ?? 0))
}

export function AdminProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { items, stockMovements, status, stockMovementStatus, error } = useAppSelector((state) => state.admin)
  const isAdminView = user?.role === 'admin'
  const basePath = isAdminView ? '/admin/products' : '/seller/products'
  const [activeImageUrl, setActiveImageUrl] = useState('')
  const [stockDraft, setStockDraft] = useState('0')
  const [stockMessage, setStockMessage] = useState('')
  const [savingStock, setSavingStock] = useState(false)
  const [reviewDraft, setReviewDraft] = useState({ moderationStatus: 'pending', moderationNote: '' })
  const [reviewMessage, setReviewMessage] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const product = useMemo(
    () => items.find((entry) => String(entry.id) === String(productId)),
    [items, productId],
  )
  const productMovements = useMemo(
    () => stockMovements.filter((movement) => String(movement.productId) === String(productId)),
    [productId, stockMovements],
  )
  const galleryImages = (product?.imageUrls?.length ? product.imageUrls : [product?.imageUrl]).filter(Boolean)
  const priceLabel = useMemo(() => formatPrice(product?.price ?? 0), [product?.price])

  useEffect(() => {
    if (status === 'idle' || !items.length) {
      dispatch(fetchAdminProducts())
    }

    if (stockMovementStatus === 'idle' || !stockMovements.length) {
      dispatch(fetchAdminStockMovements({ limit: 120 }))
    }
  }, [dispatch, items.length, status, stockMovementStatus, stockMovements.length])

  useEffect(() => {
    setActiveImageUrl(galleryImages[0] || '')
    setStockDraft(String(product?.stock ?? 0))
    setStockMessage('')
    setReviewDraft({
      moderationStatus: product?.moderationStatus || 'pending',
      moderationNote: product?.moderationNote || '',
    })
    setReviewMessage('')
  }, [product?.id])

  async function handleStockSubmit() {
    if (!product) {
      return
    }

    const nextStock = Number.parseInt(stockDraft, 10)

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setStockMessage('Entrez une quantite valide.')
      return
    }

    setSavingStock(true)
    const action = await dispatch(updateAdminProductStock({ productId: product.id, stock: nextStock }))
    setSavingStock(false)

    if (updateAdminProductStock.fulfilled.match(action)) {
      dispatch(fetchAdminStockMovements({ limit: 120 }))
      setStockMessage(`Stock mis a jour: ${nextStock}`)
      return
    }

    setStockMessage(action.error.message)
  }

  async function handleDelete() {
    if (!product) {
      return
    }

    await dispatch(deleteAdminProduct(product.id))
    navigate(basePath)
  }

  async function handleReviewSubmit(event) {
    event.preventDefault()

    if (!product || !isAdminView) {
      return
    }

    setSavingReview(true)
    setReviewMessage('')

    const action = await dispatch(reviewAdminProduct({ productId: product.id, payload: reviewDraft }))
    setSavingReview(false)

    if (reviewAdminProduct.fulfilled.match(action)) {
      setReviewMessage('Validation produit mise a jour.')
      return
    }

    setReviewMessage(action.error.message)
  }

  if (status === 'loading' && !product) {
    return <div className="panel px-6 py-10 text-slate-600">Chargement du produit...</div>
  }

  if (error && !product) {
    return <StatusMessage tone="error">{error}</StatusMessage>
  }

  if (!product) {
    return <StatusMessage tone="error">Produit introuvable.</StatusMessage>
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isAdminView ? 'Supervision admin produit' : 'Detail produit vendeur'}
        title={product.title}
        description={isAdminView ? 'L administration valide, corrige, masque ou supprime ce produit et controle sa conformite.' : 'Consultez la fiche complete du produit, suivez le stock et retrouvez tout l historique des mouvements au meme endroit.'}
        action={
          <div className="flex flex-wrap gap-3">
            <Link to={basePath} className="button-secondary">Retour a la liste</Link>
            <Link to={`${basePath}/${product.id}/edit`} className="button-primary">Modifier</Link>
          </div>
        }
      />

      {reviewMessage ? <StatusMessage tone={reviewMessage.startsWith('Validation produit') ? 'success' : 'error'}>{reviewMessage}</StatusMessage> : null}
      {stockMessage ? (
        <p className={`text-sm font-medium ${stockMessage.startsWith('Stock mis a jour') ? 'text-emerald-700' : 'text-rose-700'}`}>
          {stockMessage}
        </p>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
            <div className="overflow-hidden rounded-3xl bg-slate-200" style={{ aspectRatio: '4 / 3' }}>
              <img
                src={getProductImageUrl(activeImageUrl || product.imageUrl)}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    key={`${product.id}-${index}`}
                    type="button"
                    className={`overflow-hidden rounded-2xl border ${activeImageUrl === imageUrl ? 'border-[#1b2533]' : 'border-[#dfe5ec]'} bg-white`}
                    onClick={() => setActiveImageUrl(imageUrl)}
                  >
                    <img src={getProductImageUrl(imageUrl)} alt={`${product.title} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-wrap gap-2 text-sm font-medium text-[#556274]">
              {product.category ? <span className="rounded-full border border-[#dfe5ec] bg-white px-3 py-2">{product.category.name}</span> : null}
              {product.subcategory ? <span className="rounded-full border border-[#dfe5ec] bg-white px-3 py-2">{product.subcategory.name}</span> : null}
            </div>

            <h1 className="headline mt-5 text-4xl text-slate-950 sm:text-5xl">{product.title}</h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{product.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Prix</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{priceLabel}</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Stock</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{product.stock ?? 0}</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Photos</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{galleryImages.length}</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Visibilite</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{product.isActive ? 'Actif' : 'Desactive'}</p>
              </div>
              {isAdminView ? (
                <div className="market-note">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Validation</p>
                  <p className="mt-2 text-lg font-bold text-[#161d29]">{product.moderationStatus || 'pending'}</p>
                </div>
              ) : null}
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Variantes</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{product.variants?.length ?? 0}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Quantite disponible
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="field min-w-32"
                    value={stockDraft}
                    onChange={(event) => setStockDraft(event.target.value)}
                  />
                </label>
                <button type="button" className="button-primary" onClick={handleStockSubmit} disabled={savingStock}>
                  {savingStock ? 'Enregistrement...' : 'Mettre a jour le stock'}
                </button>
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(product.isActive)}
                    onChange={(event) => dispatch(toggleAdminProductActivation({ productId: product.id, isActive: event.target.checked }))}
                  />
                  {product.isActive ? 'Produit actif' : 'Produit desactive'}
                </label>
                <button type="button" className="button-danger" onClick={handleDelete}>
                  Supprimer
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/products/${product.id}`} className="button-secondary">Voir la fiche publique</Link>
            </div>

            {isAdminView ? (
              <form className="mt-6 space-y-4 rounded-[1.4rem] border border-[#edf1f4] bg-white px-4 py-4 sm:px-5" onSubmit={handleReviewSubmit}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Conformite produit</p>
                  <h2 className="mt-2 text-xl font-bold text-[#161d29]">Valider ou corriger cette fiche</h2>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Statut de validation
                  <select
                    className="field mt-2"
                    value={reviewDraft.moderationStatus}
                    onChange={(event) => setReviewDraft((current) => ({ ...current, moderationStatus: event.target.value }))}
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Valide</option>
                    <option value="changes_requested">Correction demandee</option>
                    <option value="rejected">Refuse</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Note de conformite
                  <textarea
                    className="field mt-2 min-h-24"
                    value={reviewDraft.moderationNote}
                    onChange={(event) => setReviewDraft((current) => ({ ...current, moderationNote: event.target.value }))}
                    placeholder="Precisez les corrections, anomalies ou motifs de refus."
                  />
                </label>
                <button type="submit" className="button-primary" disabled={savingReview}>
                  {savingReview ? 'Enregistrement...' : 'Enregistrer la validation'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <section className="panel px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">{isAdminView ? 'Resume admin' : 'Resume vendeur'}</p>
            <div className="mt-4 space-y-3">
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Statut du stock</p>
                <p className="mt-2 text-base font-bold text-[#161d29]">{Number(product.stock ?? 0) <= 5 ? 'Stock bas a surveiller' : 'Stock correct'}</p>
              </div>
              {isAdminView && product.seller ? (
                <div className="market-note">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Vendeur</p>
                  <p className="mt-2 text-base font-bold text-[#161d29]">{product.seller.storeName || product.seller.ownerName}</p>
                </div>
              ) : null}
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Activite recente</p>
                <p className="mt-2 text-base font-bold text-[#161d29]">{productMovements.length} mouvement(s) recenses</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Visibilite publique</p>
                <p className="mt-2 text-base font-bold text-[#161d29]">{product.isActive ? 'Affiche dans le catalogue' : 'Masque du catalogue'}</p>
              </div>
            </div>
          </section>

          <section className="panel px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Couleurs du catalogue</p>
            {product.variants?.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  variant.color ? (
                    <span
                      key={variant.id}
                      className="h-8 w-8 rounded-full border border-white shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                      style={{ backgroundColor: variant.color }}
                      aria-label="Couleur disponible"
                      title="Couleur disponible"
                    />
                  ) : null
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.3rem] border border-dashed border-[#d9e1e8] bg-[#f9fbfd] px-5 py-6 text-sm text-[#627083]">
                Aucune variante configuree pour ce produit.
              </div>
            )}
          </section>
        </div>

        <section className="panel px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Historique des mouvements</p>
              <h2 className="headline mt-2 text-2xl text-[#161d29]">Toutes les evolutions de stock du produit</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              {stockMovementStatus === 'loading' ? 'Actualisation...' : `${productMovements.length} mouvement(s)`}
            </span>
          </div>

          {productMovements.length ? (
            <div className="mt-5 space-y-4">
              {productMovements.map((movement) => (
                <div key={movement.id} className="grid gap-3 rounded-[1.3rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-4 sm:grid-cols-[auto_1fr]">
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold ${movement.delta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                    {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                  </span>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#161d29]">{formatMovementSource(movement.source)}</p>
                      <span className="text-xs font-medium text-[#627083]">{formatMovementDate(movement.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-[#475467]">
                      <span className="rounded-full border border-white bg-white px-3 py-1">Avant {movement.previousStock}</span>
                      <span className="rounded-full border border-white bg-white px-3 py-1">Apres {movement.newStock}</span>
                      {movement.notes ? <span className="rounded-full border border-white bg-white px-3 py-1">{movement.notes}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.3rem] border border-dashed border-[#d9e1e8] bg-[#f9fbfd] px-5 py-8 text-sm text-[#627083]">
              Aucun mouvement enregistre pour ce produit.
            </div>
          )}
        </section>
      </section>
    </div>
  )
}