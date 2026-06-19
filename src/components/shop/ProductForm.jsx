import { useState } from 'react'

import { getProductImageUrl } from '../../lib/productImage.js'

const imageLabels = ['Photo 1', 'Photo 2', 'Photo 3', 'Photo 4']
const DEFAULT_VARIANT_COLOR = '#0e9bce'

function isHexColor(value) {
  return /^#([0-9a-fA-F]{6})$/.test(typeof value === 'string' ? value.trim() : '')
}

function normalizeColorValue(value) {
  return isHexColor(value) ? value.trim() : DEFAULT_VARIANT_COLOR
}

function formatPricePreview(value) {
  if (value === '') {
    return 'A definir'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'A definir'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatStockPreview(value) {
  if (value === '') {
    return 'Non renseigne'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'Non renseigne'
  }

  return `${amount} unite${amount > 1 ? 's' : ''}`
}

function formatVariantPreview(variant) {
  return variant.color ? 'Couleur disponible' : 'Couleur non definie'
}

export function ProductForm({
  formState,
  categories,
  onChange,
  onImageChange,
  onRemoveImage,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
  onSubmit,
  isSubmitting,
  submitLabel,
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const selectedImagesCount = formState.imageUrls.filter(Boolean).length
  const previewImage = formState.imageUrls.find(Boolean)
  const topLevelCategories = categories.filter((category) => !category.parentId)
  const subcategories = categories.filter((category) => String(category.parentId) === String(formState.categoryId))
  const selectedCategory = categories.find((category) => String(category.id) === String(formState.categoryId))
  const selectedSubcategory = categories.find((category) => String(category.id) === String(formState.subcategoryId))
  const checklist = [
    { label: 'Titre du produit', done: Boolean(formState.title.trim()) },
    { label: 'Categorie choisie', done: Boolean(formState.categoryId) },
    { label: 'Photo principale', done: Boolean(formState.imageUrls[0]) },
    { label: 'Prix renseigne', done: formState.price !== '' },
    { label: 'Description ajoutee', done: Boolean(formState.description.trim()) },
    { label: 'Variantes configurees', done: formState.variants.length > 0 },
  ]
  const completedChecklistCount = checklist.filter((item) => item.done).length
  const steps = [
    {
      label: 'Produit',
      title: 'Les informations essentielles de votre produit',
      description: 'Nom, categorie, sous-categorie et description pour classer clairement la fiche dans le catalogue.',
    },
    {
      label: 'Vente',
      title: 'Prix, stock et variantes',
      description: 'Definissez le prix principal, la disponibilite et la liste des couleurs disponibles pour ce produit.',
    },
    {
      label: 'Photos',
      title: 'Ajoutez les visuels du produit',
      description: 'La photo principale est obligatoire. Les couleurs disponibles sont gerees sans photos dediees.',
    },
    {
      label: 'Validation',
      title: 'Verifiez avant publication',
      description: 'Controlez le resume de la fiche, des variantes et des images avant enregistrement.',
    },
  ]
  const isLastStep = currentStep === steps.length - 1

  function goToPreviousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  function goToNextStep() {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={onSubmit}>
      <div className="space-y-6">
        <section className="panel px-6 py-6">
          <div className="flex flex-col gap-4 border-b border-[#edf1f4] pb-5">
            <div className="flex flex-wrap gap-3">
              {steps.map((step, index) => {
                const isActive = index === currentStep
                const isComplete = index < currentStep

                return (
                  <button
                    key={step.label}
                    type="button"
                    className={`flex min-w-36 flex-1 items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition sm:flex-none ${
                      isActive
                        ? 'border-[#0e9bce] bg-[#e7f7fd] shadow-[0_14px_30px_-24px_rgba(14,155,206,0.45)]'
                        : isComplete
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-[#edf1f4] bg-[#f9fbfd] hover:border-[#76cde9]'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-[#0e9bce] text-white' : isComplete ? 'bg-emerald-500 text-white' : 'bg-white text-[#627083]'}`}>
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Etape</span>
                      <span className="mt-1 block text-sm font-semibold text-[#161d29]">{step.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="pill">Etape {currentStep + 1} sur {steps.length}</p>
                <h2 className="headline mt-4 text-2xl text-[#161d29]">{steps[currentStep].title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#627083]">{steps[currentStep].description}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-3 text-sm text-[#475467]">
                <p className="font-semibold text-[#161d29]">{completedChecklistCount}/{checklist.length} pret</p>
                <p className="mt-1">Completez les champs cles avant publication.</p>
              </div>
            </div>
          </div>

          {currentStep === 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
                  Nom du produit
                </label>
                <input
                  id="title"
                  name="title"
                  className="field"
                  value={formState.title}
                  onChange={onChange}
                  placeholder="Ex. Sac a main artisanal en cuir"
                  required
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="mb-2 block text-sm font-semibold text-slate-700">
                  Categorie
                </label>
                <select id="categoryId" name="categoryId" className="field" value={formState.categoryId} onChange={onChange} required>
                  <option value="">Choisir une categorie</option>
                  {topLevelCategories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategoryId" className="mb-2 block text-sm font-semibold text-slate-700">
                  Sous-categorie
                </label>
                <select
                  id="subcategoryId"
                  name="subcategoryId"
                  className="field"
                  value={formState.subcategoryId}
                  onChange={onChange}
                  disabled={!formState.categoryId || !subcategories.length}
                >
                  <option value="">{subcategories.length ? 'Choisir une sous-categorie' : 'Aucune sous-categorie'}</option>
                  {subcategories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  className="field"
                  value={formState.description}
                  onChange={onChange}
                  placeholder="Decrivez les points forts, la matiere, l'usage, la taille ou toute information utile pour rassurer l'acheteur."
                  required
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                  <span>Ajoutez des details concrets pour limiter les questions avant achat.</span>
                  <span>{formState.description.trim().length} caracteres</span>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-700">
                    Prix
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="field"
                    value={formState.price}
                    onChange={onChange}
                    placeholder="25000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="stock" className="mb-2 block text-sm font-semibold text-slate-700">
                    Stock disponible
                  </label>
                  <input id="stock" name="stock" type="number" min="0" step="1" className="field" value={formState.stock} onChange={onChange} required />
                </div>

                <div className="md:col-span-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                    <input type="checkbox" name="isActive" checked={Boolean(formState.isActive)} onChange={onChange} />
                    Publier ce produit des maintenant pour le rendre visible aux acheteurs
                  </label>
                  <div className="rounded-[1.25rem] border border-[#cbeaf5] bg-[#eef9fd] px-4 py-4 text-sm text-[#0b6b8d]">
                    <p className="font-semibold uppercase tracking-[0.18em]">Statut</p>
                    <p className="mt-2 text-base font-bold text-[#161d29]">{formState.isActive ? 'Visible en boutique' : 'Brouillon'}</p>
                  </div>
                </div>
              </div>

              <section className="rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="headline text-xl text-[#161d29]">Couleurs disponibles</h3>
                    <p className="mt-2 text-sm leading-6 text-[#627083]">Ajoutez simplement les couleurs disponibles pour ce produit.</p>
                  </div>
                  <button type="button" className="button-secondary" onClick={onAddVariant}>
                    Ajouter une couleur
                  </button>
                </div>

                {formState.variants.length ? (
                  <div className="mt-5 space-y-3">
                    {formState.variants.map((variant, variantIndex) => (
                      <div key={variant.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full border border-white shadow-[0_0_0_1px_rgba(148,163,184,0.35)]" style={{ backgroundColor: normalizeColorValue(variant.color) }} />
                          <p className="text-sm font-semibold text-[#161d29]">Couleur {variantIndex + 1}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="color"
                            className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-1"
                            value={normalizeColorValue(variant.color)}
                            onChange={(event) => onVariantChange(variantIndex, 'color', event.target.value)}
                            aria-label={`Choisir la couleur ${variantIndex + 1}`}
                          />
                          <button type="button" className="text-sm font-medium text-rose-600" onClick={() => onRemoveVariant(variantIndex)}>
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-[#d9e1e8] bg-white px-5 py-6 text-sm text-[#627083]">
                    Aucune couleur ajoutee.
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="headline text-xl text-[#161d29]">Photos du produit</h3>
                    <p className="mt-2 text-sm leading-6 text-[#627083]">Ajoutez jusqu'a 4 photos. La premiere image sert de visuel principal dans le catalogue.</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-3 text-sm text-[#475467]">
                    {selectedImagesCount}/4 image{selectedImagesCount > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {imageLabels.map((label, index) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor={`image-${index}`} className="text-sm font-semibold text-slate-700">
                          {label}{index === 0 ? ' *' : ''}
                        </label>
                        {formState.imageUrls[index] ? (
                          <button type="button" className="text-sm font-medium text-rose-600" onClick={() => onRemoveImage(index)}>
                            Retirer
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-3 overflow-hidden rounded-2xl border border-dashed border-[#d9e1e8] bg-white" style={{ aspectRatio: '4 / 3' }}>
                        {formState.imageUrls[index] ? (
                          <img
                            src={getProductImageUrl(formState.imageUrls[index])}
                            alt={`${formState.title || 'Produit'} ${label}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                            Importez une image nette du produit sur fond clair ou en situation reelle.
                          </div>
                        )}
                      </div>

                      <input
                        id={`image-${index}`}
                        type="file"
                        accept="image/*"
                        className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#e7f7fd] file:px-4 file:py-2 file:font-semibold file:text-[#0b6b8d]"
                        onChange={(event) => onImageChange(index, event)}
                        required={index === 0 && !formState.imageUrls[0]}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Resume produit</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Nom</p>
                      <p className="mt-1 text-sm text-[#627083]">{formState.title.trim() || 'Non renseigne'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Categorie</p>
                      <p className="mt-1 text-sm text-[#627083]">{selectedCategory?.name || 'Non choisie'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Sous-categorie</p>
                      <p className="mt-1 text-sm text-[#627083]">{selectedSubcategory?.name || 'Aucune'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Visibilite</p>
                      <p className="mt-1 text-sm text-[#627083]">{formState.isActive ? 'Visible en boutique' : 'Brouillon'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Prix</p>
                      <p className="mt-1 text-sm text-[#627083]">{formatPricePreview(formState.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Stock</p>
                      <p className="mt-1 text-sm text-[#627083]">{formatStockPreview(formState.stock)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Photos produit</p>
                      <p className="mt-1 text-sm text-[#627083]">{selectedImagesCount}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#161d29]">Variantes</p>
                      <p className="mt-1 text-sm text-[#627083]">{formState.variants.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#edf1f4] bg-white p-5">
                  <p className="text-sm font-semibold text-[#161d29]">Description</p>
                  <p className="mt-3 text-sm leading-6 text-[#627083]">{formState.description.trim() || 'Aucune description saisie.'}</p>
                </div>

                <div className="rounded-3xl border border-[#edf1f4] bg-white p-5">
                  <p className="text-sm font-semibold text-[#161d29]">Couleurs configurees</p>
                  {formState.variants.length ? (
                    <div className="mt-4 space-y-3">
                      {formState.variants.map((variant) => (
                        <div key={variant.id} className="rounded-2xl border border-[#edf1f4] bg-[#f9fbfd] px-4 py-3 text-sm text-[#475467]">
                          <p className="font-semibold text-[#161d29]">{formatVariantPreview(variant)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#627083]">Aucune variante ajoutee.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[#edf1f4] bg-[#fff8df] p-5 text-sm text-[#6e5b16]">
                <p className="font-semibold uppercase tracking-[0.18em]">Avant d'enregistrer</p>
                <p className="mt-3 leading-6">Verifiez la photo principale, la categorie, les variantes et les prix. Si un point manque, revenez sur l'etape concernee avant publication.</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-[#edf1f4] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="button-secondary" onClick={goToPreviousStep} disabled={currentStep === 0}>
              Etape precedente
            </button>

            {!isLastStep ? (
              <button type="button" className="button-primary" onClick={goToNextStep}>
                Etape suivante
              </button>
            ) : (
              <button type="submit" className="button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : submitLabel}
              </button>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="panel px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="headline text-lg text-[#161d29]">Apercu rapide</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formState.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {formState.isActive ? 'Actif' : 'Brouillon'}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl bg-[#f3f6f9]" style={{ aspectRatio: '4 / 3' }}>
            {previewImage ? (
              <img
                src={getProductImageUrl(previewImage)}
                alt={formState.title || 'Apercu du produit'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                La photo principale s'affichera ici.
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-lg font-bold text-[#161d29]">{formState.title.trim() || 'Nom du produit'}</p>
              <p className="mt-1 text-sm text-[#627083]">{selectedCategory?.name || 'Categorie non choisie'}{selectedSubcategory ? ` / ${selectedSubcategory.name}` : ''}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Prix</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{formatPricePreview(formState.price)}</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Stock</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{formatStockPreview(formState.stock)}</p>
              </div>
              <div className="market-note">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">Variantes</p>
                <p className="mt-2 text-lg font-bold text-[#161d29]">{formState.variants.length}</p>
              </div>
            </div>
          </div>
        </section>

      </aside>
    </form>
  )
}