import { createSlice } from '@reduxjs/toolkit'

import { fetchProductById, fetchProducts } from './productsActions.js'

const initialState = {
	items: [],
	selectedProduct: null,
	status: 'idle',
	error: null,
}

const productsSlice = createSlice({
	name: 'products',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload.products
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(fetchProductById.pending, (state) => {
				state.status = 'loading'
				state.error = null
				state.selectedProduct = null
			})
			.addCase(fetchProductById.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.selectedProduct = action.payload.product
			})
			.addCase(fetchProductById.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
	},
})

export default productsSlice.reducer