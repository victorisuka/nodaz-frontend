import { createAsyncThunk } from '@reduxjs/toolkit'

import { buyerApi } from '../../lib/api.js'

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => buyerApi.getOrders())

export const createOrder = createAsyncThunk('orders/createOrder', async (payload) => buyerApi.createOrder(payload))

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (orderId) => buyerApi.cancelOrder(orderId))

export const confirmOrderDelivery = createAsyncThunk('orders/confirmOrderDelivery', async (orderId) =>
	buyerApi.confirmOrderDelivery(orderId),
)

export const requestOrderReturn = createAsyncThunk('orders/requestOrderReturn', async ({ orderId, reason }) =>
	buyerApi.requestOrderReturn(orderId, { reason }),
)