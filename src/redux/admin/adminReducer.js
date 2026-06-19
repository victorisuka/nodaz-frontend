import { createSlice } from '@reduxjs/toolkit'

import { logoutUser } from '../auth/authActions.js'
import { deleteAdminProduct, fetchAdminProducts, fetchAdminStockMovements, importAdminStockRows, reviewAdminProduct, saveAdminProduct, toggleAdminProductActivation, updateAdminProductStock } from './adminActions.js'

const initialState = {
	items: [],
	stockMovements: [],
	status: 'idle',
	stockMovementStatus: 'idle',
	saveStatus: 'idle',
	importStatus: 'idle',
	importReport: null,
	error: null,
}

const adminSlice = createSlice({
	name: 'admin',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAdminProducts.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchAdminProducts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload.products
			})
			.addCase(fetchAdminProducts.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(fetchAdminStockMovements.pending, (state) => {
				state.stockMovementStatus = 'loading'
				state.error = null
			})
			.addCase(fetchAdminStockMovements.fulfilled, (state, action) => {
				state.stockMovementStatus = 'succeeded'
				state.stockMovements = action.payload.movements ?? []
			})
			.addCase(fetchAdminStockMovements.rejected, (state, action) => {
				state.stockMovementStatus = 'failed'
				state.error = action.error.message
			})
			.addCase(saveAdminProduct.pending, (state) => {
				state.saveStatus = 'loading'
				state.error = null
			})
			.addCase(saveAdminProduct.fulfilled, (state, action) => {
				state.saveStatus = 'succeeded'

				if (!action.payload.product) {
					return
				}

				const index = state.items.findIndex((item) => item.id === action.payload.product.id)

				if (index >= 0) {
					state.items[index] = action.payload.product
				} else {
					state.items.unshift(action.payload.product)
				}

				if (action.payload.movement) {
					state.stockMovements.unshift(action.payload.movement)
				}
			})
			.addCase(saveAdminProduct.rejected, (state, action) => {
				state.saveStatus = 'failed'
				state.error = action.error.message
			})
			.addCase(deleteAdminProduct.fulfilled, (state, action) => {
				state.items = state.items.filter((item) => item.id !== action.payload)
			})
			.addCase(deleteAdminProduct.rejected, (state, action) => {
				state.error = action.error.message
			})
			.addCase(toggleAdminProductActivation.fulfilled, (state, action) => {
				if (!action.payload.product) {
					return
				}

				const index = state.items.findIndex((item) => item.id === action.payload.product.id)

				if (index >= 0) {
					state.items[index] = action.payload.product
				}
			})
			.addCase(toggleAdminProductActivation.rejected, (state, action) => {
				state.error = action.error.message
			})
			.addCase(reviewAdminProduct.fulfilled, (state, action) => {
				if (!action.payload.product) {
					return
				}

				const index = state.items.findIndex((item) => item.id === action.payload.product.id)

				if (index >= 0) {
					state.items[index] = action.payload.product
				}
			})
			.addCase(reviewAdminProduct.rejected, (state, action) => {
				state.error = action.error.message
			})
			.addCase(updateAdminProductStock.pending, (state) => {
				state.saveStatus = 'loading'
				state.error = null
			})
			.addCase(updateAdminProductStock.fulfilled, (state, action) => {
				state.saveStatus = 'succeeded'

				if (!action.payload.product) {
					return
				}

				const index = state.items.findIndex((item) => item.id === action.payload.product.id)

				if (index >= 0) {
					state.items[index] = action.payload.product
				}

				if (action.payload.movement) {
					state.stockMovements.unshift(action.payload.movement)
				}
			})
			.addCase(updateAdminProductStock.rejected, (state, action) => {
				state.saveStatus = 'failed'
				state.error = action.error.message
			})
			.addCase(importAdminStockRows.pending, (state) => {
				state.importStatus = 'loading'
				state.error = null
				state.importReport = null
			})
			.addCase(importAdminStockRows.fulfilled, (state, action) => {
				state.importStatus = 'succeeded'
				state.importReport = action.payload

				const updatedProducts = (action.payload.results ?? [])
					.filter((result) => result.product)
					.map((result) => result.product)

				updatedProducts.forEach((product) => {
					const index = state.items.findIndex((item) => item.id === product.id)

					if (index >= 0) {
						state.items[index] = product
					}
				})

				if (Array.isArray(action.payload.movements) && action.payload.movements.length) {
					state.stockMovements = [...action.payload.movements, ...state.stockMovements]
				}
			})
			.addCase(importAdminStockRows.rejected, (state, action) => {
				state.importStatus = 'failed'
				state.error = action.error.message
			})
			.addCase(logoutUser.fulfilled, () => initialState)
	},
})

export default adminSlice.reducer