import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { FiBox, FiChevronDown, FiClipboard, FiGrid, FiHome, FiLogIn, FiLogOut, FiPackage, FiSearch, FiShield, FiShoppingCart, FiTag, FiUser, FiUsers, FiX } from 'react-icons/fi'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import { hydrateSession, logoutUser } from '../../redux/auth/authActions.js'
import { fetchOrders } from '../../redux/orders/ordersActions.js'
import { fetchProductById, fetchProducts } from '../../redux/products/productsActions.js'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications.js'
import { getProductCategoryLabel } from '../../lib/productMeta.js'
import { NotificationCenter } from '../ui/NotificationCenter.jsx'

const ALL_CATEGORIES = 'Toutes les categories'

function formatRoleLabel(role) {
  if (role === 'seller') {
    return 'Vendeur'
  }

  if (role === 'admin') {
    return 'Admin'
  }

  if (role === 'moderator') {
    return 'Moderateur'
  }

  return 'Client'
}

function navClassName({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-[#e7f7fd] text-[#0b6b8d]'
      : 'text-[#556274] hover:bg-white hover:text-[#1b2533]'
  }`
}

function workspaceNavClassName({ isActive }) {
  return `rounded-full border px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'border-[#0e9bce] bg-[#0e9bce] text-white'
      : 'border-[#dfe5ec] bg-white text-[#516071] hover:border-[#0e9bce] hover:text-[#161d29]'
  }`
}

function navContent(link) {
  const Icon = link.icon

  return (
    <span className="inline-flex items-center gap-2">
      {Icon ? <Icon className="text-[0.95rem]" aria-hidden="true" /> : null}
      <span>{link.label}</span>
    </span>
  )
}

export function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const cartItems = useAppSelector((state) => state.cart.items)
  const { items: products, status: productsStatus } = useAppSelector((state) => state.products)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [headerSearchValue, setHeaderSearchValue] = useState('')

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )
  const primaryLinks = useMemo(() => {
    const links = [
      { to: '/', label: 'Accueil', end: true, icon: FiHome },
      { to: '/products', label: 'Catalogue', icon: FiGrid },
    ]

    if (isAuthenticated && user?.role === 'buyer') {
      links.push({ to: '/cart', label: 'Panier', icon: FiShoppingCart })
      links.push({ to: '/orders', label: 'Commandes', icon: FiClipboard })
    }

    return links
  }, [isAuthenticated, user?.role])

  const sellerLinks = useMemo(() => {
    if (!user || user.role !== 'seller') {
      return []
    }

    if (user.sellerProfile?.approvalStatus !== 'approved') {
      return [
        { to: '/seller/approval', label: 'Validation', icon: FiShield },
        { to: '/seller/store', label: 'Dossier', icon: FiBox },
      ]
    }

    return [
      { to: '/seller/store', label: 'Boutique', icon: FiBox },
      { to: '/seller/products', label: 'Produits', icon: FiPackage },
      { to: '/seller/orders', label: 'Commandes', icon: FiClipboard },
    ]
  }, [user])

  const adminLinks = useMemo(() => {
    if (!user || user.role !== 'admin') {
      return []
    }

    return [
      { to: '/admin', label: 'Dashboard', icon: FiShield },
      { to: '/admin/banners', label: 'Bannieres', icon: FiGrid },
      { to: '/admin/products', label: 'Produits', icon: FiPackage },
      { to: '/admin/orders', label: 'Commandes', icon: FiClipboard },
      { to: '/admin/users', label: 'Utilisateurs', icon: FiUsers },
      { to: '/admin/categories', label: 'Categories', icon: FiTag },
    ]
  }, [user])

  const workspaceSection = useMemo(() => {
    if (user?.role === 'admin') {
      return {
        title: 'Espace admin',
        links: adminLinks,
      }
    }

    if (user?.role === 'seller') {
      return {
        title: user.sellerProfile?.approvalStatus === 'approved' ? 'Espace vendeur' : 'Activation vendeur',
        links: sellerLinks,
      }
    }

    return null
  }, [adminLinks, sellerLinks, user])

  const categoryOptions = useMemo(() => {
    const labels = products
      .map((product) => getProductCategoryLabel(product))
      .filter(Boolean)

    return [ALL_CATEGORIES, ...new Set(labels)]
  }, [products])

  const selectedCategory = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('category') || ALL_CATEGORIES
  }, [location.search])

  useEffect(() => {
    if (productsStatus === 'idle') {
      dispatch(fetchProducts())
    }
  }, [dispatch, productsStatus])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setHeaderSearchValue(params.get('search') || '')
  }, [location.search])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsNotificationOpen(false)
    setIsProfileMenuOpen(false)
  }, [location.pathname, location.search])

  const handleRealtimeEvent = useEffectEvent((event) => {
    const currentProductId = location.pathname.startsWith('/products/')
      ? location.pathname.split('/')[2]
      : null

    if (event.entity?.kind === 'product') {
      dispatch(fetchProducts())

      if (currentProductId && String(event.entity.id) === currentProductId && event.type !== 'product.deleted') {
        dispatch(fetchProductById(currentProductId))
      }
    }

    if (event.type === 'review.seller.upserted' && currentProductId) {
      dispatch(fetchProductById(currentProductId))
    }

    if (['order.created', 'order.updated', 'order.return-requested'].includes(event.type) && isAuthenticated) {
      dispatch(fetchOrders())
    }

    if (['user.account.updated', 'seller.approval.updated'].includes(event.type) && isAuthenticated) {
      dispatch(hydrateSession())
    }
  })

  const { items: notifications, status: realtimeStatus, unreadCount, dismiss, markAllRead } = useRealtimeNotifications({
    enabled: true,
    onEvent: handleRealtimeEvent,
    shouldDisplayEvent: (event) => {
      if (!event.visibleToUserIds && !event.visibleToRoles) {
        return true
      }

      if (!user) {
        return false
      }

      if (Array.isArray(event.visibleToUserIds) && event.visibleToUserIds.includes(user.id)) {
        return true
      }

      if (Array.isArray(event.visibleToRoles) && event.visibleToRoles.includes(user.role)) {
        return true
      }

      return false
    },
  })

  const realtimeStatusLabel =
    realtimeStatus === 'connected' ? 'Connecte' : realtimeStatus === 'connecting' ? 'Connexion' : 'Hors ligne'

  const realtimeStatusDotClassName =
    realtimeStatus === 'connected'
      ? 'bg-emerald-500'
      : realtimeStatus === 'connecting'
        ? 'bg-amber-400'
        : 'bg-slate-400'

  async function handleLogout() {
    await dispatch(logoutUser())
    navigate('/login')
  }

  function navigateToCatalog(nextSearchValue, nextCategory) {
    const params = new URLSearchParams()
    const normalizedSearch = nextSearchValue.trim()

    if (normalizedSearch) {
      params.set('search', normalizedSearch)
    }

    if (nextCategory && nextCategory !== ALL_CATEGORIES) {
      params.set('category', nextCategory)
    }

    navigate({ pathname: '/products', search: params.toString() ? `?${params.toString()}` : '' })
  }

  function handleHeaderSearchSubmit(event) {
    event.preventDefault()
    navigateToCatalog(headerSearchValue, selectedCategory)
  }

  function handleViewAllNotifications() {
    markAllRead()
    setIsNotificationOpen(false)
    setIsMobileMenuOpen(false)

    navigate('/notifications', {
      state: {
        notifications,
        status: realtimeStatus,
      },
    })
  }

  const accountActions = isAuthenticated ? (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-3 rounded-full border border-[#dceef5] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfe_100%)] px-3 py-2 text-sm font-semibold text-[#1f3f4d] shadow-[0_16px_35px_-30px_rgba(14,155,206,0.4)] transition hover:border-[#0e9bce]"
        aria-expanded={isProfileMenuOpen}
        aria-label="Ouvrir le menu profil"
        onClick={() => setIsProfileMenuOpen((current) => !current)}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0e9bce] text-white">
          <FiUser className="text-base" aria-hidden="true" />
        </span>
        <span className="text-left leading-tight">
          <span className="block max-w-32 truncate text-sm font-semibold text-[#17313d]">{user?.name}</span>
          <span className="block text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#6b90a0]">{formatRoleLabel(user?.role)}</span>
        </span>
        <FiChevronDown className={`text-sm text-[#6b90a0] transition ${isProfileMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isProfileMenuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 min-w-64 rounded-[1.4rem] border border-[#dceef5] bg-white p-3 shadow-[0_24px_60px_-38px_rgba(14,155,206,0.38)]">
          <div className="rounded-[1.1rem] bg-[#f4fbfe] px-4 py-3">
            <p className="text-sm font-semibold text-[#17313d]">{user?.name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b90a0]">{formatRoleLabel(user?.role)}</p>
          </div>

          {user?.role === 'seller' && user.sellerProfile?.approvalStatus !== 'approved' ? (
            <Link to="/seller/approval" className="mt-3 flex rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Validation en attente
            </Link>
          ) : null}

          <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#edf1f4] bg-white px-4 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#0e9bce] hover:text-[#161d29]" onClick={handleLogout}>
            <FiLogOut className="text-base" aria-hidden="true" />
            Deconnexion
          </button>
        </div>
      ) : null}
    </div>
  ) : (
    <>
      <NavLink to="/login" className={navClassName}>
        <span className="inline-flex items-center gap-2">
          <FiLogIn className="text-base" aria-hidden="true" />
          <span>Connexion</span>
        </span>
      </NavLink>
      <Link to="/signup" className="button-secondary rounded-lg px-4 py-3 text-sm">
        Creer un compte
      </Link>
    </>
  )

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-30 pb-5 pt-0">
        <div className="top-nav-shell overflow-visible rounded-none">
          <div className="border-b border-[#edf1f4] px-4 py-3 sm:px-5 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="min-w-0 flex items-center gap-3">
                <img src="/nodinno_logo.png" alt="Nodinno" className="h-11 w-auto max-w-28 object-contain" />
                <div className="min-w-0">
                  <p className="headline truncate text-[1.35rem] leading-none text-[#151d28]">Noma</p>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#7d8795]">Marketplace</p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  to={isAuthenticated ? '/cart' : '/login'}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#dfe5ec] bg-white text-[#334155]"
                  aria-label={cartCount ? `Panier (${cartCount})` : 'Panier'}
                >
                  <FiShoppingCart className="text-[1.05rem]" aria-hidden="true" />
                  {cartCount ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0e9bce] px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border text-[#334155] transition ${isMobileMenuOpen ? 'border-[#0e9bce] bg-[#e7f7fd] text-[#0b6b8d]' : 'border-[#dfe5ec] bg-white'}`}
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                >
                  {isMobileMenuOpen ? <FiX className="text-[1.2rem]" aria-hidden="true" /> : (
                    <span className="flex flex-col gap-1.5">
                      <span className="h-0.5 w-5 rounded-full bg-current" />
                      <span className="h-0.5 w-5 rounded-full bg-current" />
                      <span className="h-0.5 w-5 rounded-full bg-current" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleHeaderSearchSubmit}>
              <div className="soft-input flex items-center gap-3 border border-[#dceef5] bg-white px-0 py-0 shadow-[0_14px_32px_-28px_rgba(14,155,206,0.28)]">
                <span className="pl-4 text-[#6b90a0]">
                  <FiSearch className="text-base" aria-hidden="true" />
                </span>
                <input
                  type="search"
                  className="min-w-0 flex-1 bg-transparent py-3 pr-2 text-[#1b2533] outline-none placeholder:text-[#8a94a3]"
                  placeholder="Rechercher un produit"
                  value={headerSearchValue}
                  onChange={(event) => setHeaderSearchValue(event.target.value)}
                />
                <button type="submit" className="button-primary rounded-l-none rounded-r-xl px-4 py-3 text-sm">
                  OK
                </button>
              </div>

              <select
                className="soft-select w-full border border-[#dceef5] bg-white shadow-[0_14px_32px_-28px_rgba(14,155,206,0.2)]"
                value={selectedCategory}
                onChange={(event) => navigateToCatalog(headerSearchValue, event.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </form>

            {isMobileMenuOpen ? (
              <div className="mt-4 space-y-4 rounded-3xl border border-[#dceef5] bg-[linear-gradient(180deg,#ffffff_0%,#f7fcfe_100%)] p-4 shadow-[0_22px_40px_-34px_rgba(14,155,206,0.3)]">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4fbfe] px-3 py-3">
                  <span
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#edf1f4] bg-white px-3 py-2 text-xs font-semibold text-[#475467]"
                    aria-label={`Statut temps reel : ${realtimeStatusLabel}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${realtimeStatusDotClassName}`} aria-hidden="true" />
                    <span>{realtimeStatusLabel}</span>
                  </span>
                  <NotificationCenter
                    items={notifications}
                    status={realtimeStatus}
                    unreadCount={unreadCount}
                    isOpen={isNotificationOpen}
                    onToggle={() => {
                      setIsNotificationOpen((current) => !current)
                      if (!isNotificationOpen) {
                        markAllRead()
                      }
                    }}
                    onDismiss={dismiss}
                    onMarkAllRead={markAllRead}
                    onViewAll={handleViewAllNotifications}
                  />
                </div>

                <nav className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a94a3]">Navigation</p>
                  {primaryLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} className={navClassName} end={link.end}>
                      {navContent(link)}
                    </NavLink>
                  ))}
                  {!isAuthenticated ? (
                    <NavLink to="/signup" className={navClassName}>
                      {navContent({ label: 'Devenir vendeur', icon: FiBox })}
                    </NavLink>
                  ) : null}
                </nav>

                {workspaceSection?.links.length ? (
                  <div className="space-y-3 rounded-3xl border border-[#dceef5] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfe_100%)] px-4 py-4 shadow-[0_18px_45px_-40px_rgba(14,155,206,0.4)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b90a0]">{workspaceSection.title}</p>
                    <div className="flex flex-col gap-2">
                      {workspaceSection.links.map((link) => (
                        <NavLink key={link.to} to={link.to} className={workspaceNavClassName} end={link.end}>
                          {navContent(link)}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  {accountActions}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden flex-col gap-4 border-b border-[#edf1f4] px-5 py-4 lg:flex lg:px-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4 xl:min-w-55">
              <Link to="/" className="flex items-center gap-3">
                <img src="/nodinno_logo.png" alt="Nodinno" className="h-13 w-auto max-w-36 object-contain" />
                <div>
                  <p className="headline text-[1.9rem] leading-none text-[#151d28]">Noma</p>
                </div>
              </Link>
            </div>

            <form className="grid gap-3 xl:min-w-130 xl:grid-cols-[180px_minmax(0,1fr)]" onSubmit={handleHeaderSearchSubmit}>
              <select
                className="button-secondary rounded-xl px-4 text-sm"
                value={selectedCategory}
                onChange={(event) => navigateToCatalog(headerSearchValue, event.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="soft-input flex items-center gap-3 px-0 py-0">
                <input
                  type="search"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[#1b2533] outline-none placeholder:text-[#8a94a3]"
                  placeholder="Rechercher un produit"
                  value={headerSearchValue}
                  onChange={(event) => setHeaderSearchValue(event.target.value)}
                />
                <button type="submit" className="button-primary rounded-l-none rounded-r-xl px-4 py-3 text-sm">
                  Rechercher
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <span
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#edf1f4] bg-white px-3 py-2 text-xs font-semibold text-[#475467]"
                aria-label={`Statut temps reel : ${realtimeStatusLabel}`}
                title={`Statut temps reel : ${realtimeStatusLabel}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${realtimeStatusDotClassName}`} aria-hidden="true" />
                <span>{realtimeStatusLabel}</span>
              </span>
              {user?.role === 'buyer' || !isAuthenticated ? (
                <Link to={isAuthenticated ? '/cart' : '/login'} className="rounded-full border border-[#edf1f4] bg-white px-4 py-2 text-xs font-semibold text-[#161d29]">
                  Panier {cartCount ? `(${cartCount})` : ''}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="hidden flex-col gap-4 px-5 py-4 lg:flex lg:px-7 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap items-center gap-2 xl:flex">
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClassName} end={link.end}>
                  {navContent(link)}
                </NavLink>
              ))}
              {!isAuthenticated ? (
                <NavLink to="/signup" className={navClassName}>
                  {navContent({ label: 'Devenir vendeur', icon: FiBox })}
                </NavLink>
              ) : null}
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <NotificationCenter
                items={notifications}
                status={realtimeStatus}
                unreadCount={unreadCount}
                isOpen={isNotificationOpen}
                onToggle={() => {
                  setIsNotificationOpen((current) => !current)
                  if (!isNotificationOpen) {
                    markAllRead()
                  }
                }}
                onDismiss={dismiss}
                onMarkAllRead={markAllRead}
                onViewAll={handleViewAllNotifications}
              />
              {accountActions}
            </div>
          </div>

          {workspaceSection?.links.length ? (
            <div className="hidden border-t border-[#edf1f4] px-5 py-4 lg:block lg:px-7">
              <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[#dceef5] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfe_100%)] px-5 py-4 shadow-[0_18px_50px_-40px_rgba(14,155,206,0.42)] xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b90a0]">{workspaceSection.title}</p>
                  <p className="mt-1 text-sm text-[#627083]">Accedez rapidement aux sections utiles pour votre role.</p>
                </div>
                <nav className="flex flex-wrap items-center gap-2">
                  {workspaceSection.links.map((link) => (
                    <NavLink key={link.to} to={link.to} className={workspaceNavClassName} end={link.end}>
                      {navContent(link)}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="space-y-8 pb-16">
        {children}
      </main>
    </div>
  )
}