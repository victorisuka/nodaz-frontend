import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { AddToCartAction } from '../components/shop/AddToCartAction.jsx'
import { ProductCard } from '../components/shop/ProductCard.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { fetchProducts } from '../redux/products/productsActions.js'
import { getProductCategoryLabel, getProductSearchText } from '../lib/productMeta.js'

const ALL_CATEGORIES = 'Toutes les categories'

export function ProductsPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.products)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortValue, setSortValue] = useState('featured')

  const searchValue = searchParams.get('search') || ''
  const selectedCategory = searchParams.get('category') || ALL_CATEGORIES

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const categoryOptions = useMemo(() => {
    const catalogCategories = items
      .map((product) => getProductCategoryLabel(product))
      .filter(Boolean)

    return [ALL_CATEGORIES, ...new Set(catalogCategories)]
  }, [items])

  function updateCatalogParams(nextValues) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextValues.search !== undefined) {
      if (nextValues.search.trim()) {
        nextParams.set('search', nextValues.search.trim())
      } else {
        nextParams.delete('search')
      }
    }

    if (nextValues.category !== undefined) {
      if (nextValues.category && nextValues.category !== ALL_CATEGORIES) {
        nextParams.set('category', nextValues.category)
      } else {
        nextParams.delete('category')
      }
    }

    setSearchParams(nextParams)
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    const filteredProducts = items.filter((product) => {
      const matchesQuery = !normalizedQuery || getProductSearchText(product).includes(normalizedQuery)
      const productCategory = getProductCategoryLabel(product)
      const matchesCategory = selectedCategory === ALL_CATEGORIES || productCategory === selectedCategory

      return matchesQuery && matchesCategory
    })

    const sortedProducts = [...filteredProducts]

    if (sortValue === 'price-asc') {
      sortedProducts.sort((left, right) => Number(left.price) - Number(right.price))
    } else if (sortValue === 'price-desc') {
      sortedProducts.sort((left, right) => Number(right.price) - Number(left.price))
    } else if (sortValue === 'name') {
      sortedProducts.sort((left, right) => left.title.localeCompare(right.title))
    }

    return sortedProducts
  }, [items, searchValue, selectedCategory, sortValue])

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Catalogue"
        title="Trouver un produit rapidement"
        description="Recherchez, filtrez et triez sans charger l'ecran de controles inutiles."
      />

      <section className="panel space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px] xl:grid-cols-[minmax(0,1.6fr)_220px_220px]">
          <input
            type="search"
            className="soft-input"
            placeholder="Rechercher un produit"
            value={searchValue}
            onChange={(event) => updateCatalogParams({ search: event.target.value })}
          />

          <select className="soft-select" value={selectedCategory} onChange={(event) => updateCatalogParams({ category: event.target.value })}>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select className="soft-select" value={sortValue} onChange={(event) => setSortValue(event.target.value)}>
            <option value="featured">Tri : Par defaut</option>
            <option value="price-asc">Prix : croissant</option>
            <option value="price-desc">Prix : decroissant</option>
            <option value="name">Nom : A a Z</option>
          </select>
        </div>

        <div className="text-sm text-[#5b6f60]">
          <p>
            <span className="font-bold text-[#203728]">{visibleProducts.length}</span> produit(s) sur{' '}
            <span className="font-bold text-[#203728]">{items.length}</span>
          </p>
        </div>
      </section>

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {status === 'loading' ? (
        <div className="panel px-6 py-10 text-[#5b6f60]">Chargement du catalogue...</div>
      ) : visibleProducts.length ? (
        <div className="section-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              action={
                isAuthenticated ? (
                  user && product.userId === user.id ? (
                    <span className="inline-flex items-center rounded-full border border-[#d7e3d4] bg-[#edf5ea] px-4 py-3 text-sm font-semibold text-[#35523d]">
                      Votre produit
                    </span>
                  ) : (
                    <AddToCartAction
                      productId={product.id}
                      stock={product.stock}
                    />
                  )
                ) : (
                  <Link to="/login" className="button-primary">
                    Se connecter
                  </Link>
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={items.length ? 'Aucun produit ne correspond a votre recherche' : 'Aucun produit disponible'}
          description={items.length ? 'Essayez une recherche plus simple ou reinitialisez les filtres.' : 'Le catalogue sera affiche ici quand des produits seront publies.'}
          action={
            items.length ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setSearchParams(new URLSearchParams())
                  setSortValue('featured')
                }}
              >
                Reinitialiser
              </button>
            ) : null
          }
        />
      )}
    </section>
  )
}