import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { adminApi } from '../lib/api.js'
import { getProductImageUrl } from '../lib/productImage.js'
import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Impossible de lire l image selectionnee.'))
    reader.readAsDataURL(file)
  })
}

function createCategoryDraft(category = null) {
  return {
    name: category?.name || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    parentId: category?.parentId ?? '',
    isActive: category?.isActive ?? true,
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getStatusBadgeClassName(isActive) {
  return isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'
}

function getCategoryTypeLabel(category) {
  return category?.parentId ? 'Sous-categorie' : 'Categorie principale'
}

export function AdminCategoryDetailsPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [draft, setDraft] = useState(createCategoryDraft())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setMessage('')
    setError('')

    adminApi.getAdminCategories()
      .then((response) => {
        const nextCategories = response.categories ?? []
        const nextCategory = nextCategories.find((entry) => String(entry.id) === String(categoryId)) ?? null

        setCategories(nextCategories)
        setCategory(nextCategory)
        setDraft(createCategoryDraft(nextCategory))

        if (!nextCategory) {
          setError('Categorie introuvable.')
        }
      })
      .catch((caughtError) => {
        setError(caughtError.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [categoryId])

  const parentCategory = useMemo(
    () => categories.find((entry) => entry.id === category?.parentId) ?? null,
    [categories, category?.parentId],
  )

  const topLevelCategories = useMemo(
    () => categories.filter((entry) => !entry.parentId && entry.id !== category?.id),
    [categories, category?.id],
  )

  function handleDraftChange(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleCategoryFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)
      setDraft((current) => ({
        ...current,
        imageUrl,
      }))
      setMessage('')
      setError('')
    } catch (caughtError) {
      setError(caughtError.message)
    }

    event.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!category) {
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await adminApi.updateAdminCategory(category.id, {
        name: draft.name,
        description: draft.description,
        imageUrl: draft.imageUrl,
        parentId: draft.parentId === '' ? null : Number(draft.parentId),
        isActive: draft.isActive,
      })

      setCategory(response.category)
      setDraft(createCategoryDraft(response.category))
      setCategories((current) => current.map((entry) => (entry.id === response.category.id ? response.category : entry)))
      setMessage('Categorie mise a jour.')
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="panel px-6 py-10 text-slate-600">Chargement de la categorie...</div>
  }

  if (error && !category) {
    return <StatusMessage tone="error">{error}</StatusMessage>
  }

  if (!category) {
    return <StatusMessage tone="error">Categorie introuvable.</StatusMessage>
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title={category.name}
        description="Modifiez les informations de cette categorie depuis une page dediee."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/categories" className="button-secondary">Retour a la liste</Link>
            <button type="button" className="button-secondary" onClick={() => navigate(-1)}>Retour</button>
          </div>
        }
      />

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="panel space-y-6 px-5 py-5 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Categorie #{category.id}</span>
              <span className={`rounded-full border px-3 py-2 ${getStatusBadgeClassName(category.isActive)}`}>
                {category.isActive ? 'Active' : 'Desactivee'}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700">{getCategoryTypeLabel(category)}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Slug</p>
                <p className="mt-2 break-all text-sm font-semibold text-[#161d29]">{category.slug}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Parent</p>
                <p className="mt-2 text-sm font-semibold text-[#161d29]">{parentCategory?.name || 'Racine'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Mise a jour</p>
                <p className="mt-2 text-sm font-semibold text-[#161d29]">{formatDateTime(category.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#edf1f4] bg-[#f8fafc]" style={{ aspectRatio: '16 / 10' }}>
            <img
              src={getProductImageUrl(draft.imageUrl)}
              alt={draft.name || 'Apercu categorie'}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#161d29]">Modifier la categorie</h3>
            <p className="text-sm text-slate-600">Mettez a jour les informations essentielles de cette categorie.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Nom
              <input
                type="text"
                className="field mt-2"
                value={draft.name}
                onChange={(event) => handleDraftChange('name', event.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Type parent
              <select
                className="field mt-2"
                value={draft.parentId}
                onChange={(event) => handleDraftChange('parentId', event.target.value)}
              >
                <option value="">Categorie principale</option>
                {topLevelCategories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              className="field mt-2 min-h-32"
              value={draft.description}
              onChange={(event) => handleDraftChange('description', event.target.value)}
              placeholder="Resume court pour aider l equipe et les vendeurs."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="block text-sm font-medium text-slate-700">
              URL de l image
              <input
                type="text"
                className="field mt-2"
                value={draft.imageUrl}
                onChange={(event) => handleDraftChange('imageUrl', event.target.value)}
                placeholder="https://... ou image importee"
              />
            </label>

            <label className="button-secondary inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-3 text-sm md:min-w-48">
              Importer une image
              <input type="file" accept="image/*" className="hidden" onChange={handleCategoryFileChange} />
            </label>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#334155]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#0e9bce]"
                checked={draft.isActive}
                onChange={(event) => handleDraftChange('isActive', event.target.checked)}
              />
              <span>{draft.isActive ? 'Categorie active' : 'Categorie desactivee'}</span>
            </label>

            <button type="submit" className="button-primary min-w-56 justify-center" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}