import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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

function getCategoryTypeLabel(category) {
  return category.parentId ? 'Sous-categorie' : 'Categorie principale'
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [draft, setDraft] = useState(createCategoryDraft())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingCategoryId, setSavingCategoryId] = useState(null)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState(null)

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories],
  )

  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  )

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => {
      if (left.parentId === right.parentId) {
        return left.name.localeCompare(right.name)
      }

      if (!left.parentId) {
        return -1
      }

      if (!right.parentId) {
        return 1
      }

      return left.parentId - right.parentId
    }),
    [categories],
  )

  useEffect(() => {
    adminApi.getAdminCategories()
      .then((response) => {
        const nextCategories = response.categories ?? []
        setCategories(nextCategories)
      })
      .catch((caughtError) => {
        setError(caughtError.message)
        setCategories([])
      })
  }, [])

  function resetForm() {
    setDraft(createCategoryDraft())
  }

  function openCreateModal() {
    setDraft(createCategoryDraft())
    setIsCreateModalOpen(true)
    setMessage('')
    setError('')
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    setDraft(createCategoryDraft())
  }

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
    setSubmittingForm(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        imageUrl: draft.imageUrl,
        parentId: draft.parentId === '' ? null : Number(draft.parentId),
        isActive: draft.isActive,
      }

      const response = await adminApi.createAdminCategory(payload)

      setCategories((current) => [...current, response.category])
      setMessage('Categorie ajoutee.')
      closeCreateModal()
      resetForm()
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setSubmittingForm(false)
  }

  function renderCategoryForm({ title, description, submitLabel, onCancel, panelClassName = 'panel space-y-4 p-5' }) {
    return (
      <form className={panelClassName} onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#161d29]">{title}</h2>
            <p className="mt-1 text-sm text-[#627083]">{description}</p>
          </div>
          {onCancel ? (
            <button type="button" className="button-secondary" onClick={onCancel}>
              Annuler
            </button>
          ) : null}
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Nom
          <input
            type="text"
            className="field mt-2"
            value={draft.name}
            onChange={(event) => handleDraftChange('name', event.target.value)}
            placeholder="Ex: Produits frais"
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
            {topLevelCategories
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            className="field mt-2 min-h-28"
            value={draft.description}
            onChange={(event) => handleDraftChange('description', event.target.value)}
            placeholder="Resume court pour aider l equipe et les vendeurs."
          />
        </label>

        <div className="space-y-3">
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
          <label className="button-secondary inline-flex cursor-pointer items-center rounded-lg px-4 py-3 text-sm">
            Importer une image
            <input type="file" accept="image/*" className="hidden" onChange={handleCategoryFileChange} />
          </label>
          <div className="overflow-hidden rounded-2xl border border-[#edf1f4] bg-[#f8fafc]" style={{ aspectRatio: '16 / 10' }}>
            <img
              src={getProductImageUrl(draft.imageUrl)}
              alt={draft.name || 'Apercu categorie'}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#334155]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0e9bce]"
            checked={draft.isActive}
            onChange={(event) => handleDraftChange('isActive', event.target.checked)}
          />
          <span>{draft.isActive ? 'Categorie active' : 'Categorie desactivee'}</span>
        </label>

        <button type="submit" className="button-primary w-full justify-center" disabled={submittingForm}>
          {submittingForm ? 'Enregistrement...' : submitLabel}
        </button>
      </form>
    )
  }

  async function handleToggleCategory(category) {
    setSavingCategoryId(category.id)
    setMessage('')
    setError('')

    try {
      const response = await adminApi.updateAdminCategory(category.id, {
        name: category.name,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        parentId: category.parentId ?? null,
        isActive: !category.isActive,
      })

      setCategories((current) => current.map((entry) => (entry.id === category.id ? response.category : entry)))
      setMessage(response.category.isActive ? 'Categorie activee.' : 'Categorie desactivee.')
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setSavingCategoryId(null)
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`Supprimer la categorie "${category.name}" ?`)) {
      return
    }

    setDeletingCategoryId(category.id)
    setMessage('')
    setError('')

    try {
      await adminApi.deleteAdminCategory(category.id)
      setCategories((current) => current.filter((entry) => entry.id !== category.id))

      setMessage('Categorie supprimee.')
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setDeletingCategoryId(null)
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Parametrage admin"
        title="Configurer les categories"
        description="Ajoutez, modifiez, activez, desactivez ou supprimez les categories depuis une interface simple."
      />

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      <div className="grid gap-6">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf1f4] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[#161d29]">Liste des categories</h2>
              <p className="mt-1 text-sm text-[#627083]">Consultez l ensemble des categories et intervenez rapidement sur leur statut.</p>
            </div>
            <button type="button" className="button-primary" onClick={openCreateModal}>
              Ajouter une categorie
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f9fbfd]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a94a3]">
                  <th className="px-5 py-4">Categorie</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Parent</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => (
                  <tr key={category.id} className="border-b border-[#edf1f4] text-[#475467] transition hover:bg-[#fbfcfe] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex min-w-72 items-center gap-3">
                        <img
                          src={getProductImageUrl(category.imageUrl)}
                          alt={category.name}
                          className="h-12 w-12 rounded-2xl border border-[#edf1f4] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#161d29]">{category.name}</p>
                          <p className="mt-1 truncate text-xs text-[#8a94a3]">{category.description || 'Aucune description.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{getCategoryTypeLabel(category)}</td>
                    <td className="px-5 py-4">{category.parentId ? (categoriesById[category.parentId]?.name || 'Categorie indisponible') : 'Racine'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {category.isActive ? 'Active' : 'Desactivee'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-64 flex-wrap justify-end gap-2">
                        <Link to={`/admin/categories/${category.id}`} className="button-secondary">
                          Modifier
                        </Link>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => handleToggleCategory(category)}
                          disabled={savingCategoryId === category.id}
                        >
                          {savingCategoryId === category.id ? 'Mise a jour...' : category.isActive ? 'Desactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deletingCategoryId === category.id}
                        >
                          {deletingCategoryId === category.id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!sortedCategories.length ? (
            <div className="px-5 py-6 text-sm text-[#627083]">
              Aucune categorie disponible pour le moment.
            </div>
          ) : null}
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {renderCategoryForm({
              title: 'Ajouter une categorie',
              description: 'Creez une categorie principale ou une sous-categorie depuis cette fenetre.',
              submitLabel: 'Ajouter la categorie',
              onCancel: closeCreateModal,
              panelClassName: 'space-y-4 p-5 sm:p-6',
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}