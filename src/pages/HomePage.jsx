import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ProductCard } from '../components/shop/ProductCard.jsx'
import { AddToCartAction } from '../components/shop/AddToCartAction.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { publicApi } from '../lib/api.js'
import { getProductImageUrl } from '../lib/productImage.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { fetchProducts } from '../redux/products/productsActions.js'

function buildBannerGradientStyle(banner) {
  const fromColor = banner?.gradientFromColor || '#0e9bce'
  const toColor = banner?.gradientToColor || '#7dd3fc'

  return {
    backgroundImage: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
  }
}

export function HomePage() {
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((state) => state.products)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts())
    }
  }, [dispatch, status])

  useEffect(() => {
    publicApi.getCategories()
      .then((response) => setCategories(response.categories ?? []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    publicApi.getBanners()
      .then((response) => setBanners(response.banners ?? []))
      .catch(() => setBanners([]))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) {
      setActiveBannerIndex(0)
      return undefined
    }

    const timerId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % banners.length)
    }, 5000)

    return () => window.clearInterval(timerId)
  }, [banners])

  const featuredProducts = useMemo(() => items.slice(0, 4), [items])
  const activeBanner = banners[activeBannerIndex] ?? null
  const categorySummary = useMemo(() => {
    const topLevelCategories = categories.filter((category) => !category.parentId)

    return topLevelCategories
      .map((category) => ({
        ...category,
        count: items.filter((product) => String(product.categoryId) === String(category.id)).length,
      }))
      .filter((category) => category.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 4)
  }, [categories, items])

  const sellerLink = isAuthenticated ? '/seller/store' : '/signup'

  function renderBannerAction() {
    const buttonLabel = activeBanner?.buttonLabel || 'Explorer le catalogue'
    const linkUrl = activeBanner?.linkUrl || '/products'

    if (/^https?:\/\//i.test(linkUrl)) {
      return (
        <a href={linkUrl} className="button-primary" target="_blank" rel="noreferrer">
          {buttonLabel}
        </a>
      )
    }

    return (
      <Link to={linkUrl} className="button-primary">
        {buttonLabel}
      </Link>
    )
  }

  return (
    <div className="space-y-10">
      <section className="panel overflow-hidden p-0" style={buildBannerGradientStyle(activeBanner)}>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-8 sm:py-12">
            <div className="max-w-3xl space-y-4">
              <p className="inline-flex w-fit items-center rounded-full border border-white/35 bg-white/16 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">{activeBanner ? 'Promotion' : 'Marketplace'}</p>
              <h1 className="headline text-4xl text-white sm:text-5xl">
                {activeBanner?.title || 'Acheter et vendre, sans surcharge.'}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/88 sm:text-lg">
                {activeBanner?.promotionText || 'Une entree claire vers le catalogue, la boutique vendeur et les produits du moment.'}
              </p>
              <div className="flex flex-wrap gap-3">
                {renderBannerAction()}
                <Link to={sellerLink} className="rounded-full border border-white/35 bg-white/14 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/22">
                  {isAuthenticated ? 'Ma boutique' : 'Creer un compte'}
                </Link>
              </div>
              {banners.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      className={`h-2.5 rounded-full transition ${index === activeBannerIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/45'}`}
                      aria-label={`Afficher la banniere ${index + 1}`}
                      onClick={() => setActiveBannerIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-72 bg-white/8 p-4 lg:min-h-full lg:p-5">
            <div className="h-full overflow-hidden rounded-4xl border border-white/18 bg-white/8 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.6)] backdrop-blur-sm">
            <img
              src={getProductImageUrl(activeBanner?.imageUrl)}
              alt={activeBanner?.title || 'Banniere accueil'}
              className="h-full w-full object-cover"
            />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Categories"
          title="Parcourir rapidement"
          description="Quelques points d'entree simples pour trouver la bonne categorie."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categorySummary.length > 0 ? categorySummary.map((category) => (
            <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`} className="retail-tile px-6 py-6 transition hover:-translate-y-0.5">
              <div className="overflow-hidden rounded-2xl bg-[#eef2f6]" style={{ aspectRatio: '16 / 10' }}>
                <img
                  src={getProductImageUrl(category.imageUrl)}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Categorie</p>
              <h2 className="headline mt-3 text-2xl text-[#161d29]">{category.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#627083]">{category.count} produit(s)</p>
            </Link>
          )) : (
            <article className="retail-tile px-6 py-6 sm:col-span-2 xl:col-span-4">
              <p className="text-sm text-[#627083]">Les categories apparaitront ici quand le catalogue sera charge.</p>
            </article>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Produits populaires"
          title="Une selection courte"
          description="Quelques produits suffisent pour demarrer sans surcharger l'accueil."
          action={<Link to="/products" className="button-secondary">Voir tout</Link>}
        />

        {status === 'loading' ? (
          <div className="retail-surface px-6 py-10 text-[#627083]">Chargement des produits...</div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
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
                        label="Ajouter au panier"
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
            title="Aucun produit a afficher"
            description="Ajoutez des produits ou revenez plus tard pour decouvrir le catalogue."
            action={<Link to="/products" className="button-primary">Explorer le catalogue</Link>}
          />
        )}
      </section>
    </div>
  )
}
