import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from './redux/hooks.js'
import { AppShell } from './components/layout/AppShell.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { hydrateSession } from './redux/auth/authActions.js'
import { fetchCart } from './redux/cart/cartActions.js'
import { AdminProductFormPage } from './pages/AdminProductFormPage.jsx'
import { AdminProductDetailsPage } from './pages/AdminProductDetailsPage.jsx'
import { AdminProductsPage } from './pages/AdminProductsPage.jsx'
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx'
import { AdminBannersPage } from './pages/AdminBannersPage.jsx'
import { AdminCategoriesPage } from './pages/AdminCategoriesPage.jsx'
import { AdminCategoryDetailsPage } from './pages/AdminCategoryDetailsPage.jsx'
import { AdminOrdersPage } from './pages/AdminOrdersPage.jsx'
import { AdminStockAuditPage } from './pages/AdminStockAuditPage.jsx'
import { AdminUserDetailsPage } from './pages/AdminUserDetailsPage.jsx'
import { AdminUsersPage } from './pages/AdminUsersPage.jsx'
import { CartPage } from './pages/CartPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { NotificationsPage } from './pages/NotificationsPage.jsx'
import { OrdersPage } from './pages/OrdersPage.jsx'
import { ProductDetailsPage } from './pages/ProductDetailsPage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { SetupAdminPage } from './pages/SetupAdminPage.jsx'
import { SellerApprovalPage } from './pages/SellerApprovalPage.jsx'
import { SellerOrdersPage } from './pages/SellerOrdersPage.jsx'
import { SellerStorePage } from './pages/SellerStorePage.jsx'
import { SignupPage } from './pages/SignupPage.jsx'
import { SignupSuccessPage } from './pages/SignupSuccessPage.jsx'

function App() {
  const dispatch = useAppDispatch()
  const { initialized, isAuthenticated, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(hydrateSession())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
    }
  }, [dispatch, isAuthenticated])

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} requireSellerApproval user={user}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/new"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} requireSellerApproval user={user}>
              <AdminProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/:productId/edit"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} requireSellerApproval user={user}>
              <AdminProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products/:productId"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} requireSellerApproval user={user}>
              <AdminProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminBannersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId/edit"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminUserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/:categoryId"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminCategoryDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stock-history"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['admin']} user={user}>
              <AdminStockAuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} requireSellerApproval user={user}>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/approval"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} user={user}>
              <SellerApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/store"
          element={
            <ProtectedRoute initialized={initialized} isAuthenticated={isAuthenticated} requiredRoles={['seller']} user={user}>
              <SellerStorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
        />
        <Route path="/setup/admin" element={<SetupAdminPage />} />
        <Route path="/signup/success" element={<SignupSuccessPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
