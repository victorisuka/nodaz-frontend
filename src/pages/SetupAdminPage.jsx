import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { authApi } from '../lib/api.js'
import { hydrateSession } from '../redux/auth/authActions.js'

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function SetupAdminPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { initialized, isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [formState, setFormState] = useState(initialState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bootstrapStatus, setBootstrapStatus] = useState({ canBootstrap: false, hasAdmin: false })

  useEffect(() => {
    authApi.getAdminBootstrapStatus()
      .then((response) => {
        setBootstrapStatus({
          canBootstrap: Boolean(response?.canBootstrap),
          hasAdmin: Boolean(response?.hasAdmin),
        })
      })
      .catch((caughtError) => {
        setError(caughtError.message || 'Impossible de verifier la configuration admin.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  function handleChange(event) {
    setError('')
    setFormState((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await authApi.createInitialAdmin({
        name: formState.name.trim(),
        email: formState.email.trim().toLowerCase(),
        password: formState.password,
        confirmPassword: formState.confirmPassword,
      })
      await dispatch(hydrateSession())
      navigate('/admin', { replace: true })
    } catch (caughtError) {
      setError(caughtError.message || 'Impossible de creer le compte admin.')

      try {
        const statusResponse = await authApi.getAdminBootstrapStatus()
        setBootstrapStatus({
          canBootstrap: Boolean(statusResponse?.canBootstrap),
          hasAdmin: Boolean(statusResponse?.hasAdmin),
        })
      } catch {
        // Keep the original error if the refresh fails.
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (initialized && isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (loading) {
    return <section className="mx-auto max-w-3xl"><div className="panel px-6 py-10 text-slate-600">Verification de la configuration admin...</div></section>
  }

  if (!bootstrapStatus.canBootstrap) {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-8 sm:px-8">
          <p className="pill">Configuration admin</p>
          <h1 className="headline mt-5 text-4xl text-slate-950">Un compte admin existe deja.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Le premier administrateur a deja ete configure depuis le backend ou via cette interface. Connectez-vous avec un compte admin existant pour acceder au tableau de bord.
          </p>
        </div>

        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

        <div className="panel space-y-4 px-6 py-6 sm:px-8">
          <p className="text-sm text-slate-600">Si vous devez donner les droits admin a un autre utilisateur, utilisez la commande backend de promotion.</p>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Commande</p>
            <pre className="mt-3 overflow-x-auto text-sm font-medium text-slate-900">npm run admin:promote -- --email=utilisateur@example.com</pre>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="button-primary">Aller a la connexion</Link>
            <Link to="/signup" className="button-secondary">Creer un compte standard</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_38%),linear-gradient(180deg,#f8fffd_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
        <p className="pill">Premier admin</p>
        <h1 className="headline mt-5 text-4xl text-slate-950">Configurez le premier compte administrateur.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Cette page n est disponible que tant qu aucun administrateur n existe dans la base. Le compte cree ici sera connecte automatiquement puis redirige vers l espace admin.
        </p>
      </div>

      <form className="panel space-y-6 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Nom complet</label>
            <input id="name" name="name" type="text" className="field" value={formState.name} onChange={handleChange} required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email admin</label>
            <input id="email" name="email" type="email" className="field" value={formState.email} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
            <input id="password" name="password" type="password" className="field" value={formState.password} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input id="confirmPassword" name="confirmPassword" type="password" className="field" value={formState.confirmPassword} onChange={handleChange} required />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm text-emerald-900">
          <p className="font-semibold">Ce que cette action fait</p>
          <p className="mt-2 leading-6">Le backend cree un utilisateur avec le role admin, active le compte, initialise son panier, ouvre la session, puis bloque cette page pour les prochaines visites.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? 'Creation...' : 'Creer le compte admin'}
          </button>
          <Link to="/login" className="button-secondary">Retour a la connexion</Link>
        </div>
      </form>
    </section>
  )
}