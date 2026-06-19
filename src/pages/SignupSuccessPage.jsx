import { Link, Navigate, useLocation } from 'react-router-dom'

import { useAppSelector } from '../redux/hooks.js'

export function SignupSuccessPage() {
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const successMessage = location.state?.message ?? 'Compte cree avec succes.'
  const role = location.state?.role ?? user?.role ?? 'buyer'
  const storeName = location.state?.storeName ?? user?.sellerProfile?.storeName ?? ''
  const sellerApprovalStatus = location.state?.sellerApprovalStatus ?? user?.sellerProfile?.approvalStatus ?? ''
  const isSellerPending = role === 'seller' && sellerApprovalStatus && sellerApprovalStatus !== 'approved'

  if (!location.state && !isAuthenticated) {
    return <Navigate to="/signup" replace />
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="pill">Inscription terminee</p>
        <h1 className="headline mt-5 text-4xl text-slate-950">{isSellerPending ? 'Votre demande vendeur a bien ete envoyee.' : 'Votre compte est pret.'}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600">
          {isSellerPending && storeName
            ? `${storeName} sera active apres validation par un administrateur.`
            : role === 'seller' && storeName
            ? `${storeName} est maintenant enregistre sur la marketplace.`
            : 'Votre profil est maintenant actif sur la marketplace.'}
        </p>
      </div>

      <div className="panel space-y-5 px-6 py-6 sm:px-8">
        <div className="rounded-3xl border border-[#d8eadc] bg-[#f4fbf4] px-5 py-4 text-[#1f5d32]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em]">Confirmation</p>
          <p className="mt-2 text-base font-medium">{successMessage}</p>
        </div>

        <div className="rounded-3xl border border-[#edf1f4] bg-[#f9fbfd] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Type de compte</p>
          <p className="mt-2 text-lg font-bold capitalize text-[#161d29]">{role}</p>
          {isSellerPending ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Statut vendeur</p>
              <p className="mt-2 text-base text-[#161d29]">En attente de validation</p>
            </>
          ) : null}
          {storeName ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Boutique</p>
              <p className="mt-2 text-base text-[#161d29]">{storeName}</p>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="button-secondary">
            Aller a l'accueil
          </Link>
          <Link to={role === 'seller' ? (isSellerPending ? '/seller/approval' : '/seller/store') : '/products'} className="button-primary">
            {role === 'seller' ? (isSellerPending ? 'Voir le statut vendeur' : 'Completer ma boutique') : 'Explorer les produits'}
          </Link>
        </div>
      </div>
    </section>
  )
}
