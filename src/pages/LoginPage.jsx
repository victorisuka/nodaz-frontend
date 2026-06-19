import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { StatusMessage } from '../components/ui/StatusMessage.jsx'
import { authApi } from '../lib/api.js'
import { loginUser } from '../redux/auth/authActions.js'

const initialState = {
  email: '',
  password: '',
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((state) => state.auth)
  const [formState, setFormState] = useState(initialState)
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false)

  useEffect(() => {
    authApi.getAdminBootstrapStatus()
      .then((response) => {
        setBootstrapAvailable(Boolean(response?.canBootstrap))
      })
      .catch(() => {
        setBootstrapAvailable(false)
      })
  }, [])

  function handleChange(event) {
    setFormState((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const action = await dispatch(loginUser(formState))

    if (loginUser.fulfilled.match(action)) {
      navigate(location.state?.from ?? '/')
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="pill">Connexion</p>
        <h1 className="headline mt-5 text-4xl text-slate-950">Connectez-vous simplement.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
          Accedez a votre panier, vos commandes et votre espace vendeur depuis un seul ecran.
        </p>
      </div>

      <form className="panel space-y-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        {bootstrapAvailable ? (
          <StatusMessage>
            Aucun administrateur n est configure pour le moment. <Link to="/setup/admin" className="font-semibold text-slate-900 underline underline-offset-4">Creer le premier compte admin</Link>
          </StatusMessage>
        ) : null}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input id="email" name="email" type="email" className="field" value={formState.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <input id="password" name="password" type="password" className="field" value={formState.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="button-primary w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Pas encore de compte ? <Link to="/signup" className="font-semibold text-teal-800">Creer un compte</Link>
        </p>
      </form>
    </section>
  )
}