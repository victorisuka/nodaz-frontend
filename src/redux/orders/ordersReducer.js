import { createSlice } from '@reduxjs/toolkit'

import { logoutUser } from '../auth/authActions.js'
import { cancelOrder, confirmOrderDelivery, createOrder, fetchOrders, requestOrderReturn } from './ordersActions.js'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

function upsertOrder(state, order) {
	if (!order) {
		return
	}

	const existingIndex = state.items.findIndex((item) => item.id === order.id)

	if (existingIndex >= 0) {
		state.items[existingIndex] = order
		return
	}

	state.items.unshift(order)
}

const ordersSlice = createSlice({
	name: 'orders',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchOrders.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchOrders.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload.orders
			})
			.addCase(fetchOrders.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(createOrder.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(createOrder.fulfilled, (state, action) => {
				state.status = 'succeeded'
				if (action.payload.order) {
					upsertOrder(state, action.payload.order)
				} else {
					state.items = action.payload.orders ?? state.items
				}
			})
			.addCase(createOrder.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(cancelOrder.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(cancelOrder.fulfilled, (state, action) => {
				state.status = 'succeeded'
				upsertOrder(state, action.payload.order)
			})
			.addCase(cancelOrder.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(confirmOrderDelivery.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(confirmOrderDelivery.fulfilled, (state, action) => {
				state.status = 'succeeded'
				upsertOrder(state, action.payload.order)
			})
			.addCase(confirmOrderDelivery.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(requestOrderReturn.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(requestOrderReturn.fulfilled, (state, action) => {
				state.status = 'succeeded'
				upsertOrder(state, action.payload.order)
			})
			.addCase(requestOrderReturn.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(logoutUser.fulfilled, () => initialState)
	},
})

export default ordersSlice.reducer