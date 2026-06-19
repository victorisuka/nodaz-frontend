import { createAsyncThunk } from '@reduxjs/toolkit'

import { adminApi, sellerApi } from '../../lib/api.js'

function selectProductApi(getState) {
	const user = getState().auth.user
	return user?.role === 'admin' ? adminApi : sellerApi
}

export const fetchAdminProducts = createAsyncThunk(
	'admin/fetchAdminProducts',
	async (_, { getState }) => selectProductApi(getState).getAdminProducts ? selectProductApi(getState).getAdminProducts() : selectProductApi(getState).getSellerProducts(),
)

export const fetchAdminStockMovements = createAsyncThunk(
	'admin/fetchAdminStockMovements',
	async (params = {}, { getState }) => {
		const api = selectProductApi(getState)
		return api.getAdminStockMovements ? api.getAdminStockMovements(params) : api.getSellerStockMovements(params)
	},
)

export const saveAdminProduct = createAsyncThunk(
	'admin/saveAdminProduct',
	async ({ productId, payload }, { getState }) => {
		const api = selectProductApi(getState)
		if (productId) {
			return api.updateAdminProduct ? api.updateAdminProduct(productId, payload) : api.updateSellerProduct(productId, payload)
		}

		return api.createSellerProduct(payload)
	},
)

export const deleteAdminProduct = createAsyncThunk(
	'admin/deleteAdminProduct',
	async (productId, { getState }) => {
		const api = selectProductApi(getState)
		if (api.deleteAdminProduct) {
			await api.deleteAdminProduct(productId)
		} else {
			await api.deleteSellerProduct(productId)
		}
		return productId
	},
)

export const reviewAdminProduct = createAsyncThunk(
	'admin/reviewAdminProduct',
	async ({ productId, payload }, { getState }) => {
		const api = selectProductApi(getState)
		return api.updateAdminProductModeration(productId, payload)
	},
)

export const toggleAdminProductActivation = createAsyncThunk(
	'admin/toggleAdminProductActivation',
	async ({ productId, isActive }, { getState }) => {
		const api = selectProductApi(getState)
		return api.updateAdminProductActivation ? api.updateAdminProductActivation(productId, { isActive }) : api.updateSellerProductActivation(productId, { isActive })
	},
)

export const updateAdminProductStock = createAsyncThunk(
	'admin/updateAdminProductStock',
	async ({ productId, stock }, { getState }) => {
		const api = selectProductApi(getState)
		return api.updateAdminProductStock ? api.updateAdminProductStock(productId, { stock }) : api.updateSellerProductStock(productId, { stock })
	},
)

export const importAdminStockRows = createAsyncThunk(
	'admin/importAdminStockRows',
	async ({ rows }, { getState }) => {
		const api = selectProductApi(getState)
		return api.importAdminStockRows ? api.importAdminStockRows({ rows }) : api.importSellerStockRows({ rows })
	},
)