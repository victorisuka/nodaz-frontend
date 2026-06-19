import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { ProductForm } from '../components/shop/ProductForm.jsx'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { publicApi } from '../lib/api.js'
import { fetchAdminProducts, saveAdminProduct } from '../redux/admin/adminActions.js'

const PRODUCT_IMAGE_LIMIT = 4
const DEFAULT_VARIANT_COLOR = '#0e9bce'

function isHexColor(value) {
  return /^#([0-9a-fA-F]{6})$/.test(typeof value === 'string' ? value.trim() : '')
}

function normalizeVariantColor(value) {
  return isHexColor(value) ? value.trim() : DEFAULT_VARIANT_COLOR
}

const buildImageSlots = (images = []) => Array.from({ length: PRODUCT_IMAGE_LIMIT }, (_, index) => images[index] ?? '')
const createEmptyVariant = () => ({
  id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  color: DEFAULT_VARIANT_COLOR,
})

const emptyForm = {
  title: '',
  imageUrls: buildImageSlots(),
  price: '',
  stock: '0',
  isActive: true,
  categoryId: '',
  subcategoryId: '',
  description: '',
  variants: [],
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.readAsDataURL(file)
  })
}

export function AdminProductFormPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items, status, saveStatus, error } = useAppSelector((state) => state.admin)
  const user = useAppSelector((state) => state.auth.user)
  const product = useMemo(() => items.find((item) => String(item.id) === productId), [items, productId])
  const [formState, setFormState] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [formError, setFormError] = useState('')
  const isAdminView = user?.role === 'admin'
  const basePath = isAdminView ? '/admin/products' : '/seller/products'

  useEffect(() => {
    publicApi.getCategories().then((response) => setCategories(response.categories ?? [])).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (productId && status === 'idle') {
      dispatch(fetchAdminProducts())
    }
  }, [dispatch, productId, status])

  useEffect(() => {
    if (product) {
      const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length
        ? product.imageUrls
        : [product.imageUrl].filter(Boolean)

      setFormState({
        title: product.title,
        imageUrls: buildImageSlots(imageUrls),
        price: String(product.price),
        stock: String(product.stock ?? 0),
        isActive: product.isActive !== false,
        categoryId: String(product.categoryId ?? ''),
        subcategoryId: String(product.subcategoryId ?? ''),
        description: product.description,
        variants: Array.isArray(product.variants)
          ? product.variants.map((variant, index) => ({
              id: variant.id ?? `variant-${index + 1}`,
              color: normalizeVariantColor(variant.color),
            }))
          : [],
      })
    }
  }, [product])

  function handleChange(event) {
    setFormError('')
    setFormState((current) => ({
      ...current,
      ...(event.target.name === 'categoryId' ? { subcategoryId: '' } : null),
      [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }))
  }

  function handleVariantChange(variantIndex, field, value) {
    setFormError('')
    setFormState((current) => ({
      ...current,
      variants: current.variants.map((variant, index) => (index === variantIndex ? { ...variant, [field]: value } : variant)),
    }))
  }

  function handleAddVariant() {
    setFormError('')
    setFormState((current) => ({
      ...current,
      variants: [...current.variants, createEmptyVariant()],
    }))
  }

  function handleRemoveVariant(variantIndex) {
    setFormError('')
    setFormState((current) => ({
      ...current,
      variants: current.variants.filter((_, index) => index !== variantIndex),
    }))
  }

  async function handleImageChange(index, event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file)
      setFormError('')
      setFormState((current) => {
        const nextImageUrls = [...current.imageUrls]
        nextImageUrls[index] = imageDataUrl

        return {
          ...current,
          imageUrls: nextImageUrls,
        }
      })
    } catch (caughtError) {
      setFormError(caughtError.message)
    }

    event.target.value = ''
  }

  function handleRemoveImage(index) {
    setFormError('')
    setFormState((current) => {
      const nextImageUrls = [...current.imageUrls]
      nextImageUrls[index] = ''

      return {
        ...current,
        imageUrls: nextImageUrls,
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const normalizedImageUrls = formState.imageUrls.filter(Boolean)
    const normalizedVariants = formState.variants
      .map((variant) => ({
        ...variant,
        color: variant.color.trim(),
      }))
      .filter((variant) => variant.color)

    if (!normalizedImageUrls.length) {
      setFormError('La photo principale du produit est obligatoire.')
      return
    }

    if (normalizedImageUrls.length > PRODUCT_IMAGE_LIMIT) {
      setFormError(`Un produit ne peut pas contenir plus de ${PRODUCT_IMAGE_LIMIT} photos.`)
      return
    }

    setFormError('')

    const action = await dispatch(
      saveAdminProduct({
        productId,
        payload: {
          ...formState,
          imageUrls: normalizedImageUrls,
          variants: normalizedVariants.map((variant) => ({ ...variant, color: normalizeVariantColor(variant.color) })),
          price: Number(formState.price),
          stock: Number(formState.stock),
          categoryId: Number(formState.categoryId),
          subcategoryId: formState.subcategoryId ? Number(formState.subcategoryId) : null,
        },
      }),
    )

    if (saveAdminProduct.fulfilled.match(action)) {
      navigate(basePath)
    }
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Gestion produit"
        title={productId ? (isAdminView ? 'Modifier un produit du catalogue' : 'Modifier votre produit') : 'Ajouter un nouveau produit'}
        description={isAdminView ? 'L administration corrige la fiche, verifie la conformite et ajuste la visibilite du produit.' : 'Preparez une fiche produit claire avec photos, prix et stock pour publier plus vite dans le catalogue.'}
        action={<Link to={basePath} className="button-secondary">Retour a la liste</Link>}
      />

      {productId && status === 'loading' ? <div className="panel px-6 py-10 text-slate-600">Chargement du produit...</div> : null}
      {formError ? <StatusMessage tone="error">{formError}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <ProductForm
        formState={formState}
        categories={categories}
        onChange={handleChange}
        onImageChange={handleImageChange}
        onRemoveImage={handleRemoveImage}
        onVariantChange={handleVariantChange}
        onAddVariant={handleAddVariant}
        onRemoveVariant={handleRemoveVariant}
        onSubmit={handleSubmit}
        isSubmitting={saveStatus === 'loading'}
        submitLabel={productId ? 'Mettre a jour le produit' : 'Enregistrer le produit'}
      />
    </section>
  )
}