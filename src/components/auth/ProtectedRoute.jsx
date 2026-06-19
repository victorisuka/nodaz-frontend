import { Navigate, useLocation } from 'react-router-dom'

export function ProtectedRoute({ initialized, isAuthenticated, requiredRoles, requireSellerApproval = false, user, children }) {
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="panel flex min-h-64 items-center justify-center px-6 py-10 text-slate-600">
        Checking your session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredRoles?.length && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  if (requireSellerApproval && user?.role === 'seller' && user?.sellerProfile?.approvalStatus !== 'approved') {
    return <Navigate to="/seller/approval" replace state={{ from: location.pathname }} />
  }

  return children
}