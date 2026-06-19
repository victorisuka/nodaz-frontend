import { createSlice } from '@reduxjs/toolkit'

import { logoutUser } from '../auth/authActions.js'
import { createOrder } from '../orders/ordersActions.js'
import { addItemToCart, fetchCart, removeItemFromCart } from './cartActions.js'

const initialState = {
	items: [],
	total: 0,
	status: 'idle',
	error: null,
}

const assignCartState = (state, payload) => {
	state.items = payload.products ?? payload.items ?? []
	state.total = payload.total ?? 0
}

const cartSlice = createSlice({
	name: 'cart',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCart.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchCart.fulfilled, (state, action) => {
				state.status = 'succeeded'
				assignCartState(state, action.payload)
			})
			.addCase(fetchCart.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(addItemToCart.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(addItemToCart.fulfilled, (state, action) => {
				state.status = 'succeeded'
				assignCartState(state, action.payload)
			})
			.addCase(addItemToCart.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(removeItemFromCart.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(removeItemFromCart.fulfilled, (state, action) => {
				state.status = 'succeeded'
				assignCartState(state, action.payload)
			})
			.addCase(removeItemFromCart.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(createOrder.fulfilled, (state) => {
				state.items = []
				state.total = 0
				state.status = 'succeeded'
			})
			.addCase(logoutUser.fulfilled, () => initialState)
	},
})

export default cartSlice.reducer