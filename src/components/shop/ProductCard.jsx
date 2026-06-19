import { Link } from 'react-router-dom'

import { getProductImageUrl } from '../../lib/productImage.js'
import { getProductCategoryLabel } from '../../lib/productMeta.js'

function isHexColor(value) {
  return /^#([0-9a-fA-F]{6})$/.test(typeof value === 'string' ? value.trim() : '')
}

export function ProductCard({ product, action }) {
  const categoryLabel = getProductCategoryLabel(product)
  const availableColors = [...new Set((product.variants ?? []).map((variant) => variant.color).filter(isHexColor))]

  return (
    <article className="retail-surface group flex h-full flex-col overflow-hidden rounded-3xl">
      <div className="relative overflow-hidden bg-[#f3f6f9]" style={{ aspectRatio: '4 / 3' }}>
        <img
          src={getProductImageUrl(product.imageUrl)}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {product.seller ? (
          <p className="text-sm font-medium text-[#556274]">
            Boutique {product.seller.storeName} • {product.seller.averageRating || 0}/5 ({product.seller.reviewCount || 0})
          </p>
        ) : null}
        {categoryLabel ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">
            {categoryLabel}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="headline text-2xl text-[#161d29]">{product.title}</h3>
          </div>
          <span className="rounded-full bg-[#f4f7fa] px-3 py-1 text-sm font-semibold text-[#344256]">
            ${Number(product.price).toFixed(2)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-7 text-[#627083]">{product.description}</p>
        {availableColors.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Couleurs</p>
            <div className="flex flex-wrap items-center gap-2">
              {availableColors.map((color) => (
                <span
                  key={color}
                  className="h-6 w-6 rounded-full border border-white shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                  style={{ backgroundColor: color }}
                  title="Couleur disponible"
                  aria-label="Couleur disponible"
                />
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Link to={`/products/${product.id}`} className="button-secondary">
            Voir
          </Link>
          {action}
        </div>
      </div>
    </article>
  )
}