import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getProductImageUrl } from '../lib/productImage.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { fetchAdminProducts, fetchAdminStockMovements, importAdminStockRows, toggleAdminProductActivation, updateAdminProductStock } from '../redux/admin/adminActions.js'

function getModerationBadgeClassName(status) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700'
    case 'changes_requested':
      return 'bg-amber-100 text-amber-700'
    case 'rejected':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-200 text-slate-700'
  }
}

function getModerationLabel(status) {
  switch (status) {
    case 'approved':
      return 'Valide'
    case 'changes_requested':
      return 'Correction demandee'
    case 'rejected':
      return 'Refuse'
    default:
      return 'En attente'
  }
}

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

function normalizeImportRows(rows) {
  return rows
    .map((row) => ({
      productId: row.productId ?? row['Product ID'] ?? row['ID produit'] ?? row.id ?? '',
      title: row.title ?? row.Title ?? row['Nom produit'] ?? row.product ?? '',
      price: row.price ?? row.Price ?? row['Prix'] ?? '',
      stock: row.stock ?? row.Stock ?? row.quantity ?? row['Quantite disponible'] ?? row['Quantity available'] ?? '',
      notes: row.notes ?? row.Notes ?? row.Note ?? '',
    }))
    .filter((row) => String(row.productId).trim() || String(row.title).trim())
}

export function AdminProductsPage() {
  const dispatch = useAppDispatch()
  const { items, stockMovements, status, stockMovementStatus, importStatus, importReport, error } = useAppSelector((state) => state.admin)
  const user = useAppSelector((state) => state.auth.user)
  const isAdminView = user?.role === 'admin'
  const basePath = isAdminView ? '/admin/products' : '/seller/products'
  const [stockDrafts, setStockDrafts] = useState({})
  const [stockMessages, setStockMessages] = useState({})
  const [savingProductId, setSavingProductId] = useState(null)
  const [importMessage, setImportMessage] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    dispatch(fetchAdminProducts())
    dispatch(fetchAdminStockMovements({ limit: 120 }))
  }, [dispatch])

  useEffect(() => {
    setStockDrafts(Object.fromEntries(items.map((product) => [product.id, String(product.stock ?? 0)])))
  }, [items])

  const movementsByProductId = useMemo(
    () => stockMovements.reduce((accumulator, movement) => {
      const bucket = accumulator[movement.productId] ?? []
      bucket.push(movement)
      accumulator[movement.productId] = bucket
      return accumulator
    }, {}),
    [stockMovements],
  )

  function latestMovementForProduct(productId) {
    return (movementsByProductId[productId] ?? [])[0] ?? null
  }

  function renderMovementSummary(product) {
    const movement = latestMovementForProduct(product.id)

    if (!movement) {
      return <p className="text-sm text-[#627083]">Aucun mouvement enregistre pour le moment.</p>
    }

    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#475467]">
        <span className={`rounded-full px-3 py-1 font-semibold ${movement.delta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
          {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
        </span>
        <span>{formatMovementSource(movement.source)}</span>
        <span className="text-[#627083]">{formatMovementDate(movement.createdAt)}</span>
      </div>
    )
  }

  function renderStockEditor(product, compact = false) {
    return (
      <div className={`flex flex-wrap items-end gap-3 ${compact ? '' : 'mt-4'}`}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {compact ? null : 'Quantite disponible'}
          <input
            type="number"
            min="0"
            step="1"
            className={`field ${compact ? 'min-w-24' : 'min-w-32'}`}
            value={stockDrafts[product.id] ?? String(product.stock ?? 0)}
            onChange={(event) => handleStockChange(product.id, event.target.value)}
            onBlur={() => {
              if (compact && String(stockDrafts[product.id] ?? product.stock ?? 0) !== String(product.stock ?? 0)) {
                handleStockSubmit(product)
              }
            }}
            onKeyDown={(event) => {
              if (compact && event.key === 'Enter') {
                event.preventDefault()
                handleStockSubmit(product)
              }
            }}
          />
        </label>
        {!compact ? (
          <button
            type="button"
            className="button-primary"
            onClick={() => handleStockSubmit(product)}
            disabled={savingProductId === product.id}
          >
            {savingProductId === product.id ? 'Enregistrement...' : 'Mettre a jour'}
          </button>
        ) : null}
      </div>
    )
  }

  function renderProductActionLinks(product, compact = false) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to={`${basePath}/${product.id}`} className="button-secondary">
          Voir details
        </Link>
        <Link to={`${basePath}/${product.id}/edit`} className="button-secondary">
          Edit
        </Link>
        <label className={`flex items-center gap-2 ${compact ? 'rounded-xl' : 'rounded-full'} border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700`}>
          <input
            type="checkbox"
            checked={Boolean(product.isActive)}
            onChange={(event) => dispatch(toggleAdminProductActivation({ productId: product.id, isActive: event.target.checked }))}
          />
          {product.isActive ? 'Actif' : 'Desactive'}
        </label>
      </div>
    )
  }

  function renderTableView() {
    return (
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f9fbfd]">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a94a3]">
                <th className="px-5 py-4">Produit</th>
                <th className="px-5 py-4">Prix</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Statut</th>
                {isAdminView ? <th className="px-5 py-4">Conformite</th> : null}
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id} className="border-b border-[#edf1f4] align-top text-[#475467] transition hover:bg-[#fbfcfe] last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="flex min-w-72 items-center gap-3">
                      <img
                        src={getProductImageUrl(product.imageUrl)}
                        alt={product.title}
                        className="h-14 w-14 rounded-2xl border border-[#edf1f4] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#161d29]">{product.title}</p>
                        <p className="mt-1 text-xs text-[#8a94a3]">{product.category?.name || 'Sans categorie'}</p>
                        {isAdminView && product.seller ? <p className="mt-1 text-xs text-[#8a94a3]">{product.seller.storeName || product.seller.ownerName}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#161d29]">${Number(product.price).toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      {renderStockEditor(product, true)}
                      {stockMessages[product.id] ? (
                        <p className={`text-xs ${stockMessages[product.id].startsWith('Stock mis a jour') ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {stockMessages[product.id]}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-3">
                      <p className={`text-xs ${Number(product.stock ?? 0) <= 5 ? 'text-amber-700' : 'text-[#627083]'}`}>
                        {Number(product.stock ?? 0) <= 5 ? 'Stock bas' : 'Stock normal'}
                      </p>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-[#475467]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#0e9bce]"
                          checked={Boolean(product.isActive)}
                          onChange={(event) => dispatch(toggleAdminProductActivation({ productId: product.id, isActive: event.target.checked }))}
                        />
                        <span>{product.isActive ? 'Desactiver' : 'Activer'}</span>
                      </label>
                    </div>
                  </td>
                  {isAdminView ? (
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getModerationBadgeClassName(product.moderationStatus)}`}>
                          {getModerationLabel(product.moderationStatus)}
                        </span>
                        {product.moderationNote ? <p className="text-xs text-[#627083]">{product.moderationNote}</p> : null}
                      </div>
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    <div className="flex min-w-56 flex-wrap justify-end gap-2">
                      <Link to={`${basePath}/${product.id}`} className="rounded-lg border border-[#dfe5ec] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#0e9bce] hover:text-[#161d29]">
                        Details
                      </Link>
                      <Link to={`${basePath}/${product.id}/edit`} className="rounded-lg border border-[#dfe5ec] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#0e9bce] hover:text-[#161d29]">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function handleStockChange(productId, value) {
    setStockDrafts((current) => ({
      ...current,
      [productId]: value,
    }))
    setStockMessages((current) => ({
      ...current,
      [productId]: '',
    }))
  }

  async function handleStockSubmit(product) {
    const nextStock = Number.parseInt(stockDrafts[product.id] ?? product.stock ?? 0, 10)

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setStockMessages((current) => ({
        ...current,
        [product.id]: 'Entrez une quantite valide.',
      }))
      return
    }

    setSavingProductId(product.id)
    const action = await dispatch(updateAdminProductStock({ productId: product.id, stock: nextStock }))
    setSavingProductId(null)

    if (updateAdminProductStock.fulfilled.match(action)) {
      dispatch(fetchAdminStockMovements({ limit: 120 }))
    }

    setStockMessages((current) => ({
      ...current,
      [product.id]: updateAdminProductStock.fulfilled.match(action)
        ? `Stock mis a jour: ${nextStock}`
        : action.error.message,
    }))
  }

  async function handleImportFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const { read, utils } = await import('xlsx')
      const workbook = read(await file.arrayBuffer())
      const firstSheetName = workbook.SheetNames[0]

      if (!firstSheetName) {
        throw new Error('Le fichier Excel est vide.')
      }

      const sheet = workbook.Sheets[firstSheetName]
      const rawRows = utils.sheet_to_json(sheet, { defval: '' })
      const rows = normalizeImportRows(rawRows)

      if (!rows.length) {
        throw new Error('Aucune ligne exploitable trouvee. Colonnes attendues: productId ou title, puis title, price, stock.')
      }

      setImportMessage('')
      const action = await dispatch(importAdminStockRows({ rows }))

      if (importAdminStockRows.fulfilled.match(action)) {
        dispatch(fetchAdminStockMovements({ limit: 120 }))
        setImportMessage(`Import termine: ${action.payload.summary.updatedCount} ligne(s) mises a jour.`)
      } else {
        setImportMessage(action.error.message)
      }
    } catch (caughtError) {
      setImportMessage(caughtError.message)
    }

    event.target.value = ''
  }

  async function handleExportProducts() {
    try {
      const { utils, writeFile } = await import('xlsx')
      const rows = items.map((product) => ({
        productId: product.id,
        title: product.title,
        stock: Number(product.stock ?? 0),
        notes: '',
        price: Number(product.price ?? 0),
        isActive: product.isActive ? 'true' : 'false',
      }))

      const worksheet = utils.json_to_sheet(rows)
      const workbook = utils.book_new()
      utils.book_append_sheet(workbook, worksheet, 'Stocks')
      writeFile(workbook, 'produits-stock-export.xlsx')
      setExportMessage(`Export termine: ${rows.length} produit(s) dans produits-stock-export.xlsx`)
    } catch (caughtError) {
      setExportMessage(caughtError.message)
    }
  }

  return (
    <section className="space-y-6">
      {isAdminView ? null : (
        <SectionHeading
          eyebrow="Catalogue vendeur"
          title="Gerer vos produits simplement"
          description={
            user?.sellerProfile
              ? `Boutique : ${user.sellerProfile.storeName}`
              : 'Retrouvez ici vos produits, leur stock et les actions principales.'
          }
          action={<Link to="/seller/products/new" className="button-primary">Ajouter un produit</Link>}
        />
      )}

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <section className="panel space-y-4 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {isAdminView ? null : <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Automatisation du stock</p>}
            <h2 className="headline mt-2 text-2xl text-[#161d29]">Exporter puis importer les quantites depuis un fichier Excel</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#627083]">
              Colonnes supportees: <strong>productId</strong> ou <strong>title</strong>, puis <strong>title</strong>, <strong>price</strong>, <strong>stock</strong>. La colonne <strong>notes</strong> reste facultative.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="button-primary rounded-lg px-4 py-3 text-sm" onClick={handleExportProducts} disabled={!items.length}>
              Exporter les produits
            </button>
            <label className="button-secondary cursor-pointer rounded-lg px-4 py-3 text-sm">
              {importStatus === 'loading' ? 'Import en cours...' : 'Importer un fichier Excel'}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFileChange} disabled={importStatus === 'loading'} />
            </label>
          </div>
        </div>

        {exportMessage ? <p className="text-sm font-medium text-[#35523d]">{exportMessage}</p> : null}
        {importMessage ? <p className="text-sm font-medium text-[#35523d]">{importMessage}</p> : null}
        {importReport?.summary ? (
          <div className="flex flex-wrap gap-3 text-sm text-[#475467]">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Lignes: {importReport.summary.totalRows}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">Mises a jour: {importReport.summary.updatedCount}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">Echecs: {importReport.summary.failedCount}</span>
          </div>
        ) : null}
      </section>

      {status === 'loading' ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement des produits...</div>
      ) : items.length ? (
        renderTableView()
      ) : (
        <EmptyState
          title="Aucun produit pour le moment"
          description={isAdminView ? 'Aucun produit n est encore disponible pour supervision.' : 'Ajoutez votre premier produit pour commencer a vendre.'}
          action={isAdminView ? null : <Link to="/seller/products/new" className="button-primary">Creer un produit</Link>}
        />
      )}
    </section>
  )
}