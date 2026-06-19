import { useEffect, useState } from 'react'

import { SectionHeading } from '../components/ui/SectionHeading.jsx'
import { useAppSelector } from '../redux/hooks.js'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { sellerApi } from '../lib/api.js'

const emptySellerOptions = {
  legalForms: [],
  identityDocumentNames: [],
  productCategories: [],
  deliveryTerms: [],
}

const emptyForm = {
  legalName: '',
  legalForm: '',
  rccm: '',
  nif: '',
  identityDocumentName: '',
  identityDocumentNumber: '',
  storeName: '',
  physicalAddress: '',
  phoneNumber: '',
  professionalEmail: '',
  productCategories: '',
  deliveryTerms: '',
  deliveryTermsDetails: '',
  returnPolicy: '',
  logoUrl: '',
  description: '',
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Impossible de lire le logo selectionne.'))
    reader.readAsDataURL(file)
  })
}

function mapSellerProfileToForm(profile, options) {
  const deliveryTermOptions = options.deliveryTerms ?? []
  const savedDeliveryTerms = profile?.deliveryTerms ?? ''
  const usesPresetDeliveryTerms = !savedDeliveryTerms || deliveryTermOptions.includes(savedDeliveryTerms)

  return {
    legalName: profile?.legalName ?? '',
    legalForm: profile?.legalForm ?? '',
    rccm: profile?.rccm ?? '',
    nif: profile?.nif ?? '',
    identityDocumentName: profile?.identityDocumentName ?? '',
    identityDocumentNumber: profile?.identityDocumentNumber ?? '',
    storeName: profile?.storeName ?? '',
    physicalAddress: profile?.physicalAddress ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    professionalEmail: profile?.professionalEmail ?? '',
    productCategories: profile?.productCategories ?? '',
    deliveryTerms: usesPresetDeliveryTerms ? savedDeliveryTerms : '',
    deliveryTermsDetails: profile?.deliveryTermsDetails ?? (!usesPresetDeliveryTerms ? savedDeliveryTerms : ''),
    returnPolicy: profile?.returnPolicy ?? '',
    logoUrl: profile?.logoUrl ?? '',
    description: profile?.description ?? '',
  }
}

export function SellerStorePage() {
  const user = useAppSelector((state) => state.auth.user)
  const [formState, setFormState] = useState(emptyForm)
  const [sellerOptions, setSellerOptions] = useState(emptySellerOptions)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus('loading')

    Promise.all([
      sellerApi.getSellerProfileOptions().catch(() => emptySellerOptions),
      sellerApi.getSellerProfile().catch(() => null),
    ])
      .then(([optionsResponse, profileResponse]) => {
        const nextOptions = {
          legalForms: optionsResponse.legalForms ?? [],
          identityDocumentNames: optionsResponse.identityDocumentNames ?? [],
          productCategories: optionsResponse.productCategories ?? [],
          deliveryTerms: optionsResponse.deliveryTerms ?? [],
        }

        setSellerOptions(nextOptions)

        const sourceProfile = profileResponse?.sellerProfile ?? user?.sellerProfile

        if (sourceProfile) {
          setFormState(mapSellerProfileToForm(sourceProfile, nextOptions))
          setStatus('succeeded')
          return
        }

        setStatus('idle')
      })
  }, [user])

  function handleChange(event) {
    setFormState((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const logoUrl = await readFileAsDataUrl(file)
      setError('')
      setFormState((current) => ({
        ...current,
        logoUrl,
      }))
    } catch (caughtError) {
      setError(caughtError.message)
    }

    event.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setMessage('')

    try {
      const response = await sellerApi.updateSellerProfile(formState)
      setMessage(response.message ?? 'Profil boutique enregistre.')
      setStatus('succeeded')
    } catch (caughtError) {
      setError(caughtError.message)
      setStatus('failed')
    }
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Boutique"
        title="Gerer votre vitrine"
        description="Mettez a jour les informations utiles de votre boutique dans un formulaire plus clair."
      />

      {status === 'loading' && !formState.storeName && !formState.legalName ? (
        <div className="panel px-6 py-10 text-slate-600">Chargement du profil boutique...</div>
      ) : null}

      <form className="panel space-y-5 px-6 py-6" onSubmit={handleSubmit}>
        {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

        <section className="space-y-4 rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Identite legale</p>
            <h2 className="mt-2 text-xl font-bold text-[#161d29]">Informations officielles</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="legalName" className="mb-2 block text-sm font-medium text-slate-700">
                Raison sociale
              </label>
              <input id="legalName" name="legalName" className="field" value={formState.legalName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="legalForm" className="mb-2 block text-sm font-medium text-slate-700">
                Forme juridique
              </label>
              <select id="legalForm" name="legalForm" className="field" value={formState.legalForm} onChange={handleChange} required>
                <option value="">Choisir une forme juridique</option>
                {sellerOptions.legalForms.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rccm" className="mb-2 block text-sm font-medium text-slate-700">
                RCCM
              </label>
              <input id="rccm" name="rccm" className="field" value={formState.rccm} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="nif" className="mb-2 block text-sm font-medium text-slate-700">
                NIF
              </label>
              <input id="nif" name="nif" className="field" value={formState.nif} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="identityDocumentName" className="mb-2 block text-sm font-medium text-slate-700">
                Piece d identite
              </label>
              <select id="identityDocumentName" name="identityDocumentName" className="field" value={formState.identityDocumentName} onChange={handleChange} required>
                <option value="">Choisir une piece</option>
                {sellerOptions.identityDocumentNames.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="identityDocumentNumber" className="mb-2 block text-sm font-medium text-slate-700">
                Numero du document
              </label>
              <input id="identityDocumentNumber" name="identityDocumentNumber" className="field" value={formState.identityDocumentNumber} onChange={handleChange} required />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-[#edf1f4] bg-white p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Boutique</p>
            <h2 className="mt-2 text-xl font-bold text-[#161d29]">Presentation</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <div>
                <label htmlFor="storeName" className="mb-2 block text-sm font-medium text-slate-700">
                  Nom de la boutique
                </label>
                <input id="storeName" name="storeName" className="field" value={formState.storeName} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  className="field"
                  value={formState.description}
                  onChange={handleChange}
                  placeholder="Presentez votre boutique en quelques lignes."
                />
              </div>
            </div>
            <div>
              <label htmlFor="logoUpload" className="mb-2 block text-sm font-medium text-slate-700">
                Logo
              </label>
              {formState.logoUrl ? (
                <div className="mb-3 h-28 w-28 overflow-hidden rounded-3xl border border-[#dfe5ec] bg-white">
                  <img src={formState.logoUrl} alt={formState.storeName || 'Logo boutique'} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <input
                id="logoUpload"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#e7f7fd] file:px-4 file:py-2 file:font-semibold file:text-[#0b6b8d]"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Contact et livraison</p>
            <h2 className="mt-2 text-xl font-bold text-[#161d29]">Informations pratiques</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="physicalAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Adresse
              </label>
              <textarea id="physicalAddress" name="physicalAddress" rows="3" className="field" value={formState.physicalAddress} onChange={handleChange} required />
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="mb-2 block text-sm font-medium text-slate-700">
                  Telephone / WhatsApp
                </label>
                <input id="phoneNumber" name="phoneNumber" className="field" value={formState.phoneNumber} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="professionalEmail" className="mb-2 block text-sm font-medium text-slate-700">
                  Email professionnel
                </label>
                <input id="professionalEmail" name="professionalEmail" type="email" className="field" value={formState.professionalEmail} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label htmlFor="productCategories" className="mb-2 block text-sm font-medium text-slate-700">
                Categorie de produits
              </label>
              <select id="productCategories" name="productCategories" className="field" value={formState.productCategories} onChange={handleChange} required>
                <option value="">Choisir une categorie</option>
                {sellerOptions.productCategories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deliveryTerms" className="mb-2 block text-sm font-medium text-slate-700">
                Conditions de livraison
              </label>
              <select id="deliveryTerms" name="deliveryTerms" className="field" value={formState.deliveryTerms} onChange={handleChange} required>
                <option value="">Choisir les conditions</option>
                {sellerOptions.deliveryTerms.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deliveryTermsDetails" className="mb-2 block text-sm font-medium text-slate-700">
                Details de livraison
              </label>
              <textarea id="deliveryTermsDetails" name="deliveryTermsDetails" rows="3" className="field" value={formState.deliveryTermsDetails} onChange={handleChange} placeholder="Zones, horaires, frais, transporteurs..." />
            </div>
            <div>
              <label htmlFor="returnPolicy" className="mb-2 block text-sm font-medium text-slate-700">
                Politique de retour
              </label>
              <textarea id="returnPolicy" name="returnPolicy" rows="3" className="field" value={formState.returnPolicy} onChange={handleChange} required />
            </div>
          </div>
        </section>

        <button type="submit" className="button-primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enregistrement...' : 'Enregistrer la boutique'}
        </button>
      </form>
    </section>
  )
}