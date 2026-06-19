import { useEffect, useMemo, useState } from 'react'

import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { adminApi } from '../lib/api.js'
import { getProductImageUrl } from '../lib/productImage.js'

function formatDateValue(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(value) {
  if (!value) {
    return 'Libre'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date invalide'
  }

  return date.toLocaleDateString('fr-FR')
}

function buildBannerGradientStyle(banner) {
  const fromColor = banner?.gradientFromColor || '#0e9bce'
  const toColor = banner?.gradientToColor || '#7dd3fc'

  return {
    backgroundImage: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Impossible de lire l image selectionnee.'))
    reader.readAsDataURL(file)
  })
}

function createBannerDraft(banner = null) {
  return {
    title: banner?.title || '',
    promotionText: banner?.promotionText || '',
    buttonLabel: banner?.buttonLabel || '',
    linkUrl: banner?.linkUrl || '/products',
    imageUrl: banner?.imageUrl || '',
    startDate: formatDateValue(banner?.startDate),
    endDate: formatDateValue(banner?.endDate),
    gradientFromColor: banner?.gradientFromColor || '#0e9bce',
    gradientToColor: banner?.gradientToColor || '#7dd3fc',
    sortOrder: banner?.sortOrder ?? 0,
    isActive: banner?.isActive ?? true,
  }
}

export function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [draft, setDraft] = useState(createBannerDraft())
  const [editingBannerId, setEditingBannerId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyBannerId, setBusyBannerId] = useState(null)

  const sortedBanners = useMemo(
    () => [...banners].sort((left, right) => {
      if (left.sortOrder === right.sortOrder) {
        return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0)
      }

      return left.sortOrder - right.sortOrder
    }),
    [banners],
  )

  useEffect(() => {
    adminApi.getAdminBanners()
      .then((response) => setBanners(response.banners ?? []))
      .catch((caughtError) => {
        setError(caughtError.message)
        setBanners([])
      })
  }, [])

  function openCreateModal() {
    setEditingBannerId(null)
    setDraft(createBannerDraft())
    setIsModalOpen(true)
    setMessage('')
    setError('')
  }

  function openEditModal(banner) {
    setEditingBannerId(banner.id)
    setDraft(createBannerDraft(banner))
    setIsModalOpen(true)
    setMessage('')
    setError('')
  }

  function closeModal() {
    setEditingBannerId(null)
    setDraft(createBannerDraft())
    setIsModalOpen(false)
  }

  function handleDraftChange(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleBannerFileChange(event) {
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
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        title: draft.title,
        promotionText: draft.promotionText,
        buttonLabel: draft.buttonLabel,
        linkUrl: draft.linkUrl,
        imageUrl: draft.imageUrl,
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
        gradientFromColor: draft.gradientFromColor,
        gradientToColor: draft.gradientToColor,
        sortOrder: Number(draft.sortOrder) || 0,
        isActive: draft.isActive,
      }

      if (editingBannerId) {
        const response = await adminApi.updateAdminBanner(editingBannerId, payload)
        setBanners((current) => current.map((entry) => (entry.id === editingBannerId ? response.banner : entry)))
        setMessage('Banniere mise a jour.')
      } else {
        const response = await adminApi.createAdminBanner(payload)
        setBanners((current) => [...current, response.banner])
        setMessage('Banniere ajoutee.')
      }

      closeModal()
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setIsSubmitting(false)
  }

  async function handleToggleBanner(banner) {
    setBusyBannerId(banner.id)
    setMessage('')
    setError('')

    try {
      const response = await adminApi.updateAdminBanner(banner.id, {
        ...createBannerDraft(banner),
        isActive: !banner.isActive,
      })

      setBanners((current) => current.map((entry) => (entry.id === banner.id ? response.banner : entry)))
      setMessage(response.banner.isActive ? 'Banniere activee.' : 'Banniere desactivee.')
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setBusyBannerId(null)
  }

  async function handleDeleteBanner(banner) {
    if (!window.confirm(`Supprimer la banniere "${banner.title}" ?`)) {
      return
    }

    setBusyBannerId(banner.id)
    setMessage('')
    setError('')

    try {
      await adminApi.deleteAdminBanner(banner.id)
      setBanners((current) => current.filter((entry) => entry.id !== banner.id))
      setMessage('Banniere supprimee.')
    } catch (caughtError) {
      setError(caughtError.message)
    }

    setBusyBannerId(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Contenu accueil"
        title="Bannieres"
        description="Ajoutez, mettez a jour ou retirez les bannieres visibles sur la page d accueil."
        action={
          <button type="button" className="button-primary" onClick={openCreateModal}>
            Ajouter une banniere
          </button>
        }
      />

      {message ? <StatusMessage tone="success" message={message} /> : null}
      {error ? <StatusMessage tone="error" message={error} /> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#edf1f4] text-sm text-[#334155]">
            <thead className="bg-[#f8fbfd] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
              <tr>
                <th className="px-4 py-4">Banniere</th>
                <th className="px-4 py-4">Promotion</th>
                <th className="px-4 py-4">Lien</th>
                <th className="px-4 py-4">Periode</th>
                <th className="px-4 py-4">Ordre</th>
                <th className="px-4 py-4">Statut</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f4] bg-white">
              {sortedBanners.length > 0 ? sortedBanners.map((banner) => {
                const isBusy = busyBannerId === banner.id

                return (
                  <tr key={banner.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex min-w-[16rem] items-start gap-4">
                        <div className="relative h-18 w-28 overflow-hidden rounded-2xl border border-[#edf1f4]" style={buildBannerGradientStyle(banner)}>
                          <img src={getProductImageUrl(banner.imageUrl)} alt={banner.title} className="h-full w-full object-cover opacity-90" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-[#161d29]">{banner.title}</p>
                          <p className="text-xs text-[#627083]">{banner.buttonLabel || 'Bouton par defaut'}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="h-3 w-3 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: banner.gradientFromColor || '#0e9bce' }} />
                            <span className="h-3 w-3 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: banner.gradientToColor || '#7dd3fc' }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#627083]">{banner.promotionText || 'Aucune promotion'}</td>
                    <td className="px-4 py-4 text-[#627083]">{banner.linkUrl || '/products'}</td>
                    <td className="px-4 py-4 text-[#627083]">{`${formatDisplayDate(banner.startDate)} - ${formatDisplayDate(banner.endDate)}`}</td>
                    <td className="px-4 py-4 font-medium text-[#161d29]">{banner.sortOrder}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${banner.isActive ? 'bg-[#e8f7ee] text-[#166534]' : 'bg-[#eef2f6] text-[#64748b]'}`}>
                        {banner.isActive ? 'Active' : 'Masquee'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => openEditModal(banner)} disabled={isBusy}>
                          Modifier
                        </button>
                        <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => handleToggleBanner(banner)} disabled={isBusy}>
                          {isBusy ? '...' : banner.isActive ? 'Desactiver' : 'Activer'}
                        </button>
                        <button type="button" className="rounded-full border border-[#fecaca] bg-[#fff1f2] px-4 py-2 text-xs font-semibold text-[#b42318] transition hover:bg-[#ffe4e6]" onClick={() => handleDeleteBanner(banner)} disabled={isBusy}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#627083]">
                    Aucune banniere pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172acc] px-4 py-6">
          <div className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-7">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b90a0]">Accueil</p>
                  <h2 className="headline mt-2 text-2xl text-[#161d29]">
                    {editingBannerId ? 'Modifier la banniere' : 'Ajouter une banniere'}
                  </h2>
                  <p className="mt-2 text-sm text-[#627083]">Renseignez le visuel, la promotion, la periode de diffusion et le gradient de fond.</p>
                </div>
                <button type="button" className="button-secondary" onClick={closeModal}>
                  Fermer
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Titre
                  <input
                    type="text"
                    className="field mt-2"
                    value={draft.title}
                    onChange={(event) => handleDraftChange('title', event.target.value)}
                    placeholder="Ex: Offres du week-end"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Ordre d affichage
                  <input
                    type="number"
                    min="0"
                    className="field mt-2"
                    value={draft.sortOrder}
                    onChange={(event) => handleDraftChange('sortOrder', event.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Promotion
                <textarea
                  className="field mt-2 min-h-28"
                  value={draft.promotionText}
                  onChange={(event) => handleDraftChange('promotionText', event.target.value)}
                  placeholder="Ex: Jusqu a 25% de reduction sur une selection courte."
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Texte du bouton
                  <input
                    type="text"
                    className="field mt-2"
                    value={draft.buttonLabel}
                    onChange={(event) => handleDraftChange('buttonLabel', event.target.value)}
                    placeholder="Ex: Voir l offre"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Lien
                  <input
                    type="text"
                    className="field mt-2"
                    value={draft.linkUrl}
                    onChange={(event) => handleDraftChange('linkUrl', event.target.value)}
                    placeholder="/products ou https://..."
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Date de debut
                  <input
                    type="date"
                    className="field mt-2"
                    value={draft.startDate}
                    onChange={(event) => handleDraftChange('startDate', event.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Date de fin
                  <input
                    type="date"
                    className="field mt-2"
                    value={draft.endDate}
                    onChange={(event) => handleDraftChange('endDate', event.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Couleur 1 du gradient
                  <input
                    type="color"
                    className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-[#d8e1ea] bg-white px-2 py-2"
                    value={draft.gradientFromColor}
                    onChange={(event) => handleDraftChange('gradientFromColor', event.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Couleur 2 du gradient
                  <input
                    type="color"
                    className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-[#d8e1ea] bg-white px-2 py-2"
                    value={draft.gradientToColor}
                    onChange={(event) => handleDraftChange('gradientToColor', event.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    URL de l image
                    <input
                      type="text"
                      className="field mt-2"
                      value={draft.imageUrl}
                      onChange={(event) => handleDraftChange('imageUrl', event.target.value)}
                      placeholder="https://... ou image importee"
                      required
                    />
                  </label>
                  <label className="button-secondary inline-flex w-fit cursor-pointer items-center rounded-lg px-4 py-3 text-sm">
                    Importer une image
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                  </label>
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#334155]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#0e9bce]"
                      checked={draft.isActive}
                      onChange={(event) => handleDraftChange('isActive', event.target.checked)}
                    />
                    <span>{draft.isActive ? 'Banniere active' : 'Banniere masquee'}</span>
                  </label>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[#edf1f4]" style={buildBannerGradientStyle(draft)}>
                  <img src={getProductImageUrl(draft.imageUrl)} alt={draft.title || 'Apercu banniere'} className="h-full w-full object-cover opacity-90" />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="button-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : editingBannerId ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}