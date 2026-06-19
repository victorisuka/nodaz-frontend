import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { AddToCartAction } from '../components/shop/AddToCartAction.jsx'
import { ReviewSection } from '../components/shop/ReviewSection.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { fetchProductById } from '../redux/products/productsActions.js'
import { buyerApi } from '../lib/api.js'
import { getProductImageUrl } from '../lib/productImage.js'

const emptyReviewForm = {
  rating: '5',
  title: '',
  comment: '',
}

function formatVariantLabel(variant) {
  return variant.color ? 'Couleur disponible' : 'Couleur'
}

export function ProductDetailsPage() {
  const { productId } = useParams()
  const dispatch = useAppDispatch()
  const { selectedProduct, status, error } = useAppSelector((state) => state.products)
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [productReviewForm, setProductReviewForm] = useState(emptyReviewForm)
  const [sellerReviewForm, setSellerReviewForm] = useState(emptyReviewForm)
  const [productReviewStatus, setProductReviewStatus] = useState('idle')
  const [sellerReviewStatus, setSellerReviewStatus] = useState('idle')
  const [productReviewMessage, setProductReviewMessage] = useState('')
  const [sellerReviewMessage, setSellerReviewMessage] = useState('')
  const [productReviewError, setProductReviewError] = useState('')
  const [sellerReviewError, setSellerReviewError] = useState('')
  const [activeImageUrl, setActiveImageUrl] = useState('')
  const galleryImages = (selectedProduct?.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct?.imageUrl]).filter(Boolean)

  useEffect(() => {
    dispatch(fetchProductById(productId))
  }, [dispatch, productId])

  useEffect(() => {
    setActiveImageUrl(galleryImages[0] || '')
  }, [selectedProduct?.id])

  function handleFormChange(setter) {
    return (event) => {
      setter((current) => ({
        ...current,
        [event.target.name]: event.target.value,
      }))
    }
  }

  async function handleProductReviewSubmit(event) {
    event.preventDefault()
    setProductReviewStatus('loading')
    setProductReviewError('')
    setProductReviewMessage('')

    try {
      await buyerApi.createProductReview(productId, {
        ...productReviewForm,
        rating: Number(productReviewForm.rating),
      })
      await dispatch(fetchProductById(productId))
      setProductReviewMessage('Product review saved.')
      setProductReviewForm(emptyReviewForm)
      setProductReviewStatus('succeeded')
    } catch (caughtError) {
      setProductReviewError(caughtError.message)
      setProductReviewStatus('failed')
    }
  }

  async function handleSellerReviewSubmit(event) {
    event.preventDefault()

    if (!selectedProduct?.seller?.id) {
      return
    }

    setSellerReviewStatus('loading')
    setSellerReviewError('')
    setSellerReviewMessage('')

    try {
      await buyerApi.createSellerReview(selectedProduct.seller.id, {
        ...sellerReviewForm,
        rating: Number(sellerReviewForm.rating),
      })
      await dispatch(fetchProductById(productId))
      setSellerReviewMessage('Seller review saved.')
      setSellerReviewForm(emptyReviewForm)
      setSellerReviewStatus('succeeded')
    } catch (caughtError) {
      setSellerReviewError(caughtError.message)
      setSellerReviewStatus('failed')
    }
  }

  if (status === 'loading') {
    return <div className="panel px-6 py-10 text-slate-600">Loading product details...</div>
  }

  if (error) {
    return <StatusMessage tone="error">{error}</StatusMessage>
  }

  if (!selectedProduct) {
    return <StatusMessage tone="error">Product not found.</StatusMessage>
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
            <div className="min-h-80 overflow-hidden rounded-3xl bg-slate-200 sm:min-h-96">
              <img
                src={getProductImageUrl(activeImageUrl || selectedProduct.imageUrl)}
                alt={selectedProduct.title}
                className="h-full w-full object-cover"
              />
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    key={`${selectedProduct.id}-${index}`}
                    type="button"
                    className={`overflow-hidden rounded-2xl border ${activeImageUrl === imageUrl ? 'border-[#1b2533]' : 'border-[#dfe5ec]'} bg-white`}
                    onClick={() => setActiveImageUrl(imageUrl)}
                  >
                    <img
                      src={getProductImageUrl(imageUrl)}
                      alt={`${selectedProduct.title} ${index + 1}`}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <p className="pill">Product details</p>
            <h1 className="headline mt-5 text-4xl text-slate-950 sm:text-5xl">{selectedProduct.title}</h1>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-[#556274]">
              {selectedProduct.category ? <span className="pill">{selectedProduct.category.name}</span> : null}
              {selectedProduct.subcategory ? <span className="pill">{selectedProduct.subcategory.name}</span> : null}
              <span className="rounded-full border border-[#dfe5ec] bg-white px-3 py-2">
                Stock: {selectedProduct.stock ?? 0}
              </span>
              <span className="rounded-full border border-[#dfe5ec] bg-white px-3 py-2">
                Product rating: {selectedProduct.reviewSummary?.averageRating ?? 0}/5 ({selectedProduct.reviewSummary?.reviewCount ?? 0})
              </span>
            </div>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{selectedProduct.description}</p>

            {selectedProduct.variants?.length ? (
              <div className="mt-6 rounded-[1.4rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94a3]">Couleurs disponibles</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedProduct.variants.map((variant) => (
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
              </div>
            ) : null}

            {selectedProduct.seller ? (
              <div className="mt-6 rounded-[1.4rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94a3]">Seller</p>
                <p className="mt-2 text-xl font-bold text-[#161d29]">{selectedProduct.seller.storeName}</p>
                <p className="mt-2 text-sm leading-7 text-[#627083]">
                  {selectedProduct.seller.description || `Managed by ${selectedProduct.seller.ownerName}.`}
                </p>
                <p className="mt-3 text-sm font-medium text-[#475467]">
                  Seller rating: {selectedProduct.sellerReviewSummary?.averageRating ?? 0}/5 ({selectedProduct.sellerReviewSummary?.reviewCount ?? 0})
                </p>
              </div>
            ) : null}

            <p className="mt-6 text-3xl font-semibold text-teal-800">${Number(selectedProduct.price).toFixed(2)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                user && selectedProduct.userId === user.id ? (
                  <span className="inline-flex items-center rounded-full border border-[#d7e3d4] bg-[#edf5ea] px-4 py-3 text-sm font-semibold text-[#35523d]">
                    Votre produit
                  </span>
                ) : (
                  <AddToCartAction
                    productId={selectedProduct.id}
                    stock={selectedProduct.stock}
                    alwaysExpanded
                  />
                )
              ) : (
                <Link to="/login" className="button-primary">
                  Login to Buy
                </Link>
              )}
              <Link to="/products" className="button-secondary">
                Back to products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ReviewSection
          eyebrow="Product reviews"
          title="What buyers think about this item"
          summary={selectedProduct.reviewSummary}
          reviews={selectedProduct.reviews ?? []}
          formState={productReviewForm}
          onChange={handleFormChange(setProductReviewForm)}
          onSubmit={handleProductReviewSubmit}
          submitStatus={productReviewStatus}
          message={productReviewMessage}
          error={productReviewError}
          loginRequired={!isAuthenticated}
          emptyMessage="No product review yet. Be the first to rate this listing."
        />

        <ReviewSection
          eyebrow="Seller reviews"
          title={selectedProduct.seller ? `How buyers rate ${selectedProduct.seller.storeName}` : 'Seller reputation'}
          summary={selectedProduct.sellerReviewSummary}
          reviews={selectedProduct.sellerReviews ?? []}
          formState={sellerReviewForm}
          onChange={handleFormChange(setSellerReviewForm)}
          onSubmit={handleSellerReviewSubmit}
          submitStatus={sellerReviewStatus}
          message={sellerReviewMessage}
          error={sellerReviewError}
          loginRequired={!isAuthenticated || !selectedProduct.seller}
          emptyMessage="No seller review yet. Help future buyers by rating this store."
        />
      </section>
    </div>
  )
}