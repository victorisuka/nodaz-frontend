import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { sellerApi } from '../lib/api.js'
import { signupUser } from '../redux/auth/authActions.js'

const emptySellerOptions = {
  legalForms: [],
  identityDocumentNames: [],
  productCategories: [],
  deliveryTerms: [],
}

const initialState = {
  name: '',
  email: '',
  role: 'buyer',
  buyerPhoneNumber: '',
  buyerWhatsappNumber: '',
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
  password: '',
  confirmPassword: '',
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Impossible de lire le logo selectionne.'))
    reader.readAsDataURL(file)
  })
}

function buildPayload(formState) {
  return {
    ...formState,
    name: formState.name.trim(),
    email: formState.email.trim().toLowerCase(),
    buyerPhoneNumber: formState.buyerPhoneNumber.trim(),
    buyerWhatsappNumber: formState.buyerWhatsappNumber.trim(),
    legalName: formState.legalName.trim(),
    legalForm: formState.legalForm.trim(),
    rccm: formState.rccm.trim(),
    nif: formState.nif.trim(),
    identityDocumentName: formState.identityDocumentName.trim(),
    identityDocumentNumber: formState.identityDocumentNumber.trim(),
    storeName: formState.storeName.trim(),
    physicalAddress: formState.physicalAddress.trim(),
    phoneNumber: formState.phoneNumber.trim(),
    professionalEmail: formState.professionalEmail.trim().toLowerCase(),
    productCategories: formState.productCategories.trim(),
    deliveryTerms: formState.deliveryTerms.trim(),
    deliveryTermsDetails: formState.deliveryTermsDetails.trim(),
    returnPolicy: formState.returnPolicy.trim(),
    logoUrl: formState.logoUrl.trim(),
    description: formState.description.trim(),
    password: formState.password.trim(),
    confirmPassword: formState.confirmPassword.trim(),
  }
}

function getStepError(stepId, payload) {
  switch (stepId) {
    case 'account':
      if (!payload.name || !payload.email) {
        return 'Le nom et l email sont obligatoires.'
      }

      if (payload.role === 'buyer' && !payload.buyerPhoneNumber) {
        return 'Le numero de telephone est obligatoire pour un compte client.'
      }

      return null
    case 'legal': {
      const sellerRequirements = [
        ['legalName', 'Raison sociale ou nom legal'],
        ['legalForm', 'Forme juridique'],
        ['rccm', 'RCCM'],
        ['nif', 'NIF'],
        ['identityDocumentName', 'Piece d identite'],
        ['identityDocumentNumber', 'Numero de piece'],
        ['storeName', 'Nom de la boutique'],
      ]
      const missingField = sellerRequirements.find(([field]) => !payload[field])
      return missingField ? `${missingField[1]} est obligatoire pour un compte vendeur.` : null
    }
    case 'contact': {
      const sellerRequirements = [
        ['physicalAddress', 'Adresse physique'],
        ['phoneNumber', 'Numero de telephone'],
        ['professionalEmail', 'Email professionnel'],
      ]
      const missingField = sellerRequirements.find(([field]) => !payload[field])
      return missingField ? `${missingField[1]} est obligatoire pour un compte vendeur.` : null
    }
    case 'commercial': {
      const sellerRequirements = [
        ['productCategories', 'Categorie de produits'],
        ['deliveryTerms', 'Conditions de livraison'],
        ['returnPolicy', 'Politique de retour'],
      ]
      const missingField = sellerRequirements.find(([field]) => !payload[field])
      return missingField ? `${missingField[1]} est obligatoire pour un compte vendeur.` : null
    }
    case 'security':
      if (!payload.password || !payload.confirmPassword) {
        return 'Le mot de passe et sa confirmation sont obligatoires.'
      }
      if (payload.password !== payload.confirmPassword) {
        return 'Les mots de passe ne correspondent pas.'
      }
      return null
    case 'review':
      return null
    default:
      return null
  }
}

export function SignupPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((state) => state.auth)
  const [formState, setFormState] = useState(initialState)
  const [sellerOptions, setSellerOptions] = useState(emptySellerOptions)
  const [localError, setLocalError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const displayError = localError || (error === 'An account with this email already exists.'
    ? 'Un compte existe deja avec cet email. Connectez-vous a la place.'
    : error)
  const steps = useMemo(() => {
    const commonSteps = [
      {
        id: 'account',
        label: 'Compte',
        title: 'Commencez simplement',
        description: 'Choisissez le type de compte et vos informations principales.',
      },
    ]

    if (formState.role === 'seller') {
      commonSteps.push(
        {
          id: 'legal',
          label: 'Legal',
          title: 'Informations legales',
          description: 'Renseignez l identite officielle du vendeur.',
        },
        {
          id: 'contact',
          label: 'Contact',
          title: 'Coordonnees',
          description: 'Ajoutez l adresse et les canaux de contact utiles.',
        },
        {
          id: 'commercial',
          label: 'Activite',
          title: 'Informations commerciales',
          description: 'Precisez les categories, la livraison et les retours.',
        },
        {
          id: 'brand',
          label: 'Boutique',
          title: 'Identite de la boutique',
          description: 'Ajoutez ce que les clients verront de votre boutique.',
        },
      )
    }

    commonSteps.push({
      id: 'security',
      label: 'Securite',
      title: 'Securisez le compte',
      description: 'Terminez avec le mot de passe de connexion.',
    })

    commonSteps.push({
      id: 'review',
      label: 'Resume',
      title: 'Verifiez avant creation',
      description: 'Relisez les informations avant de creer le compte.',
    })

    return commonSteps
  }, [formState.role])
  const activeStep = steps[currentStep]
  const previewPayload = buildPayload(formState)

  useEffect(() => {
    sellerApi.getSellerProfileOptions()
      .then((response) => {
        setSellerOptions({
          legalForms: response.legalForms ?? [],
          identityDocumentNames: response.identityDocumentNames ?? [],
          productCategories: response.productCategories ?? [],
          deliveryTerms: response.deliveryTerms ?? [],
        })
      })
      .catch(() => {
        setSellerOptions(emptySellerOptions)
      })
  }, [])

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1)
    }
  }, [currentStep, steps])

  function handleChange(event) {
    setLocalError('')
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
      setLocalError('')
      setFormState((current) => ({
        ...current,
        logoUrl,
      }))
    } catch (caughtError) {
      setLocalError(caughtError.message)
    }

    event.target.value = ''
  }

  function handleNextStep() {
    const stepError = getStepError(activeStep.id, previewPayload)

    if (stepError) {
      setLocalError(stepError)
      return
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  function handlePreviousStep() {
    setLocalError('')
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = previewPayload

    for (const step of steps) {
      const stepError = getStepError(step.id, payload)

      if (stepError) {
        setLocalError(stepError)
        setCurrentStep(steps.findIndex((current) => current.id === step.id))
        return
      }
    }

    const action = await dispatch(signupUser(payload))

    if (signupUser.fulfilled.match(action)) {
      navigate('/signup/success', {
        replace: true,
        state: {
          message: action.payload?.message ?? 'Compte cree avec succes.',
          role: action.payload?.user?.role ?? payload.role,
          storeName: action.payload?.user?.sellerProfile?.storeName ?? payload.storeName,
          sellerApprovalStatus: action.payload?.user?.sellerProfile?.approvalStatus ?? '',
        },
      })
      return
    }

    setLocalError(action.error?.message || 'Echec de l inscription. Verifiez le formulaire puis reessayez.')
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="pill">Inscription</p>
        <h1 className="headline mt-5 text-4xl text-slate-950">Creez votre compte en quelques etapes.</h1>
      </div>

      <form className="panel space-y-6 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
        <div className="rounded-[1.75rem] border border-[#edf1f4] bg-[#f9fbfd] p-4 sm:p-5">
          <div className="flex flex-wrap gap-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isComplete = index < currentStep

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`flex min-w-32 flex-1 items-center gap-3 rounded-[1.15rem] border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-[#0e9bce] bg-[#e7f7fd] text-[#0b6b8d] shadow-[0_16px_35px_-28px_rgba(14,155,206,0.38)]'
                      : isComplete
                        ? 'border-[#cfe6d1] bg-[#f4fbf4] text-[#1f5d32]'
                        : 'border-[#e1e7ee] bg-white text-[#66758a]'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? 'bg-[#0e9bce] text-white'
                      : isComplete
                        ? 'bg-[#2f9e44] text-white'
                        : 'bg-[#eef2f6] text-[#66758a]'
                  }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </span>
                  <span>
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] opacity-70">Etape {index + 1}</span>
                    <span className="block text-sm font-semibold">{step.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-[#161d29]">{activeStep.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5b6878]">{activeStep.description}</p>
          </div>
        </div>

        {displayError ? <StatusMessage tone="error">{displayError}</StatusMessage> : null}

        {activeStep.id === 'account' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Nom
              </label>
              <input id="name" name="name" className="field" value={formState.name} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input id="email" name="email" type="email" className="field" value={formState.email} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
                Type de compte
              </label>
              <select id="role" name="role" className="field" value={formState.role} onChange={handleChange}>
                <option value="buyer">Client</option>
                <option value="seller">Vendeur</option>
              </select>
            </div>
          </div>
        ) : null}

        {activeStep.id === 'account' && formState.role === 'buyer' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="buyerPhoneNumber" className="mb-2 block text-sm font-medium text-slate-700">
                Numero de telephone
              </label>
              <input id="buyerPhoneNumber" name="buyerPhoneNumber" className="field" value={formState.buyerPhoneNumber} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="buyerWhatsappNumber" className="mb-2 block text-sm font-medium text-slate-700">
                Numero WhatsApp (optionnel)
              </label>
              <input id="buyerWhatsappNumber" name="buyerWhatsappNumber" className="field" value={formState.buyerWhatsappNumber} onChange={handleChange} />
            </div>
          </div>
        ) : null}

        {activeStep.id === 'legal' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="legalName" className="mb-2 block text-sm font-medium text-slate-700">
                Raison sociale ou nom legal
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
                Numero de piece
              </label>
              <input id="identityDocumentNumber" name="identityDocumentNumber" className="field" value={formState.identityDocumentNumber} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="storeName" className="mb-2 block text-sm font-medium text-slate-700">
                Nom de la boutique
              </label>
              <input id="storeName" name="storeName" className="field" value={formState.storeName} onChange={handleChange} required />
            </div>
          </div>
        ) : null}

        {activeStep.id === 'contact' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="physicalAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Adresse physique
              </label>
              <textarea id="physicalAddress" name="physicalAddress" rows="4" className="field" value={formState.physicalAddress} onChange={handleChange} required />
            </div>
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
        ) : null}

        {activeStep.id === 'commercial' ? (
          <div className="grid gap-5 md:grid-cols-2">
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
                <option value="">Choisir des conditions</option>
                {sellerOptions.deliveryTerms.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deliveryTermsDetails" className="mb-2 block text-sm font-medium text-slate-700">
                Details de livraison
              </label>
              <textarea id="deliveryTermsDetails" name="deliveryTermsDetails" rows="4" className="field" value={formState.deliveryTermsDetails} onChange={handleChange} placeholder="Zones desservies, horaires, frais, transporteurs..." />
            </div>
            <div>
              <label htmlFor="returnPolicy" className="mb-2 block text-sm font-medium text-slate-700">
                Politique de retour
              </label>
              <textarea id="returnPolicy" name="returnPolicy" rows="4" className="field" value={formState.returnPolicy} onChange={handleChange} placeholder="Conditions de retour et d echange..." required />
            </div>
          </div>
        ) : null}

        {activeStep.id === 'brand' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="logoUpload" className="mb-2 block text-sm font-medium text-slate-700">
                Logo de la boutique
              </label>
              {formState.logoUrl ? (
                <div className="mb-3 h-28 w-28 overflow-hidden rounded-3xl border border-[#dfe5ec] bg-white">
                  <img src={formState.logoUrl} alt={formState.storeName || 'Store logo'} className="h-full w-full object-cover" />
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
            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                Description de la boutique
              </label>
              <textarea id="description" name="description" rows="5" className="field" value={formState.description} onChange={handleChange} placeholder="Presentez votre activite et ce que vos clients peuvent attendre." />
            </div>
          </div>
        ) : null}

        {activeStep.id === 'security' ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input id="password" name="password" type="password" className="field" value={formState.password} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="field"
                value={formState.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        ) : null}

        {activeStep.id === 'review' ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] p-5">
              <h3 className="text-lg font-bold text-[#161d29]">Resume du compte</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Nom</p>
                  <p className="mt-2 text-sm text-[#161d29]">{previewPayload.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Email</p>
                  <p className="mt-2 text-sm text-[#161d29]">{previewPayload.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Type de compte</p>
                  <p className="mt-2 text-sm text-[#161d29]">{previewPayload.role === 'seller' ? 'Vendeur' : previewPayload.role === 'buyer' ? 'Client' : '-'}</p>
                </div>
                {previewPayload.role === 'buyer' ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Telephone</p>
                      <p className="mt-2 text-sm text-[#161d29]">{previewPayload.buyerPhoneNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">WhatsApp</p>
                      <p className="mt-2 text-sm text-[#161d29]">{previewPayload.buyerWhatsappNumber || '-'}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {previewPayload.role === 'seller' ? (
              <>
                <div className="rounded-3xl border border-[#edf1f4] bg-white p-5">
                  <h3 className="text-lg font-bold text-[#161d29]">Informations legales</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Raison sociale</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.legalName || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Forme juridique</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.legalForm || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">RCCM</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.rccm || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">NIF</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.nif || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Piece d identite</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.identityDocumentName || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Numero de piece</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.identityDocumentNumber || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Boutique</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.storeName || '-'}</p></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#edf1f4] bg-white p-5">
                  <h3 className="text-lg font-bold text-[#161d29]">Coordonnees et activite</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Adresse</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.physicalAddress || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Telephone</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.phoneNumber || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Email professionnel</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.professionalEmail || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Categorie</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.productCategories || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Livraison</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.deliveryTerms || '-'}</p></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Details</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.deliveryTermsDetails || '-'}</p></div>
                    <div className="md:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Retours</p><p className="mt-2 text-sm text-[#161d29]">{previewPayload.returnPolicy || '-'}</p></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#edf1f4] bg-white p-5">
                  <h3 className="text-lg font-bold text-[#161d29]">Apercu de la boutique</h3>
                  <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
                    {previewPayload.logoUrl ? (
                      <div className="h-28 w-28 overflow-hidden rounded-3xl border border-[#dfe5ec] bg-white">
                        <img src={previewPayload.logoUrl} alt={previewPayload.storeName || 'Store logo'} className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Description</p>
                        <p className="mt-2 text-sm text-[#161d29]">{previewPayload.description || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <StatusMessage tone="success">Verifiez ces informations. Si besoin, revenez a l etape precedente.</StatusMessage>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-[#edf1f4] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            {currentStep > 0 ? (
              <button type="button" className="button-secondary" onClick={handlePreviousStep}>
                Retour
              </button>
            ) : null}
            {currentStep < steps.length - 1 ? (
              <button type="button" className="button-primary" onClick={handleNextStep}>
                Continuer
              </button>
            ) : (
              <button type="submit" className="button-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Creation...' : 'Creer le compte'}
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Etape {currentStep + 1} sur {steps.length}
          </p>
        </div>

        <p className="text-center text-sm text-slate-600">
          Vous avez deja un compte ? <Link to="/login" className="font-semibold text-teal-800">Connexion</Link>
        </p>
      </form>
    </section>
  )
}