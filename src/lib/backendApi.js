import { API_BASE_URL, getHttpErrorMessage, http } from './http.js'

export function getBackendRealtimeUrl() {
  return API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws')
}

async function request(config) {
  try {
    const response = await http.request(config)
    return response.data ?? null
  } catch (error) {
    throw new Error(getHttpErrorMessage(error))
  }
}

export const backendAuthApi = {
  getSession: () => request({ url: '/auth/session' }),
  getAdminBootstrapStatus: () => request({ url: '/auth/admin-bootstrap-status' }),
  createInitialAdmin: (payload) => request({ url: '/auth/admin-bootstrap', method: 'POST', data: payload }),
  login: (payload) => request({ url: '/auth/login', method: 'POST', data: payload }),
  signup: (payload) => request({ url: '/auth/signup', method: 'POST', data: payload }),
  logout: () => request({ url: '/auth/logout', method: 'POST' }),
}

export const backendPublicApi = {
  getBanners: () => request({ url: '/banners' }),
  getCategories: () => request({ url: '/categories' }),
  getProducts: () => request({ url: '/products' }),
  getProduct: (productId) => request({ url: `/products/${productId}` }),
}

export const backendBuyerApi = {
  createProductReview: (productId, payload) =>
    request({ url: `/products/${productId}/reviews`, method: 'POST', data: payload }),
  createSellerReview: (sellerProfileId, payload) =>
    request({ url: `/seller-profiles/${sellerProfileId}/reviews`, method: 'POST', data: payload }),
  getCart: () => request({ url: '/cart' }),
  addToCart: (productId, quantity = 1) => request({ url: '/cart', method: 'POST', data: { productId, quantity } }),
  removeCartItem: (productId) => request({ url: `/cart/items/${productId}`, method: 'DELETE' }),
  getOrders: () => request({ url: '/orders' }),
  createOrder: (payload) => request({ url: '/orders', method: 'POST', data: payload }),
  cancelOrder: (orderId) => request({ url: `/orders/${orderId}/cancel`, method: 'POST' }),
  confirmOrderDelivery: (orderId) => request({ url: `/orders/${orderId}/confirm-delivery`, method: 'POST' }),
  requestOrderReturn: (orderId, payload) => request({ url: `/orders/${orderId}/return-request`, method: 'POST', data: payload }),
}

export const backendSellerApi = {
  getSellerProfileOptions: () => request({ url: '/seller/options' }),
  getSellerProfile: () => request({ url: '/seller/profile' }),
  updateSellerProfile: (payload) => request({ url: '/seller/profile', method: 'PUT', data: payload }),
  getSellerOrders: () => request({ url: '/seller/orders' }),
  updateSellerOrderStatus: (orderId, payload) => request({ url: `/seller/orders/${orderId}/status`, method: 'PATCH', data: payload }),
  getSellerProducts: () => request({ url: '/seller/products' }),
  getSellerStockMovements: (params) => request({ url: '/seller/stock-movements', params }),
  createSellerProduct: (payload) => request({ url: '/seller/products', method: 'POST', data: payload }),
  importSellerStockRows: (payload) => request({ url: '/seller/products/stock-import', method: 'POST', data: payload }),
  updateSellerProduct: (productId, payload) => request({ url: `/seller/products/${productId}`, method: 'PUT', data: payload }),
  updateSellerProductActivation: (productId, payload) => request({ url: `/seller/products/${productId}/activation`, method: 'PATCH', data: payload }),
  updateSellerProductStock: (productId, payload) => request({ url: `/seller/products/${productId}/stock`, method: 'PATCH', data: payload }),
  deleteSellerProduct: (productId) => request({ url: `/seller/products/${productId}`, method: 'DELETE' }),
}

export const backendUserApi = {
  ...backendAuthApi,
  ...backendPublicApi,
  ...backendBuyerApi,
  ...backendSellerApi,
}

export const backendAdminApi = {
  getAdminOverview: () => request({ url: '/admin/overview' }),
  getAdminOrders: () => request({ url: '/admin/orders' }),
  createAdminUser: (payload) => request({ url: '/admin/admins', method: 'POST', data: payload }),
  getAdminBanners: () => request({ url: '/admin/banners' }),
  createAdminBanner: (payload) => request({ url: '/admin/banners', method: 'POST', data: payload }),
  updateAdminBanner: (bannerId, payload) => request({ url: `/admin/banners/${bannerId}`, method: 'PATCH', data: payload }),
  deleteAdminBanner: (bannerId) => request({ url: `/admin/banners/${bannerId}`, method: 'DELETE' }),
  getAdminProducts: () => request({ url: '/admin/products' }),
  getAdminProduct: (productId) => request({ url: `/admin/products/${productId}` }),
  updateAdminProduct: (productId, payload) => request({ url: `/admin/products/${productId}`, method: 'PUT', data: payload }),
  importAdminStockRows: (payload) => request({ url: '/admin/products/stock-import', method: 'POST', data: payload }),
  updateAdminProductModeration: (productId, payload) => request({ url: `/admin/products/${productId}/moderation`, method: 'PATCH', data: payload }),
  updateAdminProductActivation: (productId, payload) => request({ url: `/admin/products/${productId}/activation`, method: 'PATCH', data: payload }),
  updateAdminProductStock: (productId, payload) => request({ url: `/admin/products/${productId}/stock`, method: 'PATCH', data: payload }),
  deleteAdminProduct: (productId) => request({ url: `/admin/products/${productId}`, method: 'DELETE' }),
  getAdminUsers: () => request({ url: '/admin/users' }),
  getAdminUser: (userId) => request({ url: `/admin/users/${userId}` }),
  updateAdminUser: (userId, payload) => request({ url: `/admin/users/${userId}`, method: 'PATCH', data: payload }),
  updateAdminUserPassword: (userId, payload) => request({ url: `/admin/admins/${userId}/password`, method: 'PATCH', data: payload }),
  getAdminCategories: () => request({ url: '/admin/categories' }),
  createAdminCategory: (payload) => request({ url: '/admin/categories', method: 'POST', data: payload }),
  updateAdminCategory: (categoryId, payload) => request({ url: `/admin/categories/${categoryId}`, method: 'PATCH', data: payload }),
  deleteAdminCategory: (categoryId) => request({ url: `/admin/categories/${categoryId}`, method: 'DELETE' }),
  getAdminStockMovements: (params) => request({ url: '/admin/stock-movements', params }),
}

export const backendApi = {
  ...backendUserApi,
  ...backendAdminApi,
}