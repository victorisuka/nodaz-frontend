import { backendApi, getBackendRealtimeUrl } from './backendApi.js'

const sourceApi = backendApi

export const authApi = {
	getSession: (...args) => sourceApi.getSession(...args),
	getAdminBootstrapStatus: (...args) => sourceApi.getAdminBootstrapStatus(...args),
	createInitialAdmin: (...args) => sourceApi.createInitialAdmin(...args),
	login: (...args) => sourceApi.login(...args),
	signup: (...args) => sourceApi.signup(...args),
	logout: (...args) => sourceApi.logout(...args),
}

export const publicApi = {
	getBanners: (...args) => sourceApi.getBanners(...args),
	getCategories: (...args) => sourceApi.getCategories(...args),
	getProducts: (...args) => sourceApi.getProducts(...args),
	getProduct: (...args) => sourceApi.getProduct(...args),
}

export const buyerApi = {
	createProductReview: (...args) => sourceApi.createProductReview(...args),
	createSellerReview: (...args) => sourceApi.createSellerReview(...args),
	getCart: (...args) => sourceApi.getCart(...args),
	addToCart: (...args) => sourceApi.addToCart(...args),
	removeCartItem: (...args) => sourceApi.removeCartItem(...args),
	getOrders: (...args) => sourceApi.getOrders(...args),
	createOrder: (...args) => sourceApi.createOrder(...args),
	cancelOrder: (...args) => sourceApi.cancelOrder(...args),
	confirmOrderDelivery: (...args) => sourceApi.confirmOrderDelivery(...args),
	requestOrderReturn: (...args) => sourceApi.requestOrderReturn(...args),
}

export const sellerApi = {
	getSellerProfileOptions: (...args) => sourceApi.getSellerProfileOptions(...args),
	getSellerProfile: (...args) => sourceApi.getSellerProfile(...args),
	updateSellerProfile: (...args) => sourceApi.updateSellerProfile(...args),
	getSellerOrders: (...args) => sourceApi.getSellerOrders(...args),
	updateSellerOrderStatus: (...args) => sourceApi.updateSellerOrderStatus(...args),
	getSellerProducts: (...args) => sourceApi.getSellerProducts(...args),
	getSellerStockMovements: (...args) => sourceApi.getSellerStockMovements(...args),
	createSellerProduct: (...args) => sourceApi.createSellerProduct(...args),
	importSellerStockRows: (...args) => sourceApi.importSellerStockRows(...args),
	updateSellerProduct: (...args) => sourceApi.updateSellerProduct(...args),
	updateSellerProductActivation: (...args) => sourceApi.updateSellerProductActivation(...args),
	updateSellerProductStock: (...args) => sourceApi.updateSellerProductStock(...args),
	deleteSellerProduct: (...args) => sourceApi.deleteSellerProduct(...args),
}

export const userApi = {
	...authApi,
	...publicApi,
	...buyerApi,
	...sellerApi,
}

export const adminApi = {
	getAdminOverview: (...args) => sourceApi.getAdminOverview(...args),
	getAdminOrders: (...args) => sourceApi.getAdminOrders(...args),
	createAdminUser: (...args) => sourceApi.createAdminUser(...args),
	getAdminBanners: (...args) => sourceApi.getAdminBanners(...args),
	createAdminBanner: (...args) => sourceApi.createAdminBanner(...args),
	updateAdminBanner: (...args) => sourceApi.updateAdminBanner(...args),
	deleteAdminBanner: (...args) => sourceApi.deleteAdminBanner(...args),
	getAdminProducts: (...args) => sourceApi.getAdminProducts(...args),
	getAdminProduct: (...args) => sourceApi.getAdminProduct(...args),
	updateAdminProduct: (...args) => sourceApi.updateAdminProduct(...args),
	importAdminStockRows: (...args) => sourceApi.importAdminStockRows(...args),
	updateAdminProductModeration: (...args) => sourceApi.updateAdminProductModeration(...args),
	updateAdminProductActivation: (...args) => sourceApi.updateAdminProductActivation(...args),
	updateAdminProductStock: (...args) => sourceApi.updateAdminProductStock(...args),
	deleteAdminProduct: (...args) => sourceApi.deleteAdminProduct(...args),
	getAdminUsers: (...args) => sourceApi.getAdminUsers(...args),
	getAdminUser: (...args) => sourceApi.getAdminUser(...args),
	updateAdminUser: (...args) => sourceApi.updateAdminUser(...args),
	updateAdminUserPassword: (...args) => sourceApi.updateAdminUserPassword(...args),
	getAdminCategories: (...args) => sourceApi.getAdminCategories(...args),
	createAdminCategory: (...args) => sourceApi.createAdminCategory(...args),
	updateAdminCategory: (...args) => sourceApi.updateAdminCategory(...args),
	deleteAdminCategory: (...args) => sourceApi.deleteAdminCategory(...args),
	getAdminStockMovements: (...args) => sourceApi.getAdminStockMovements(...args),
}

export const supportsRealtime = true
export const getRealtimeUrl = () => getBackendRealtimeUrl()