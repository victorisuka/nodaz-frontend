import { createAsyncThunk } from '@reduxjs/toolkit'

import { buyerApi } from '../../lib/api.js'

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => buyerApi.getCart())

export const addItemToCart = createAsyncThunk('cart/addItemToCart', async (payload) => {
	const normalizedPayload = typeof payload === 'object' && payload !== null
		? payload
		: { productId: payload, quantity: 1 }

	return buyerApi.addToCart(normalizedPayload.productId, normalizedPayload.quantity ?? 1)
})

export const removeItemFromCart = createAsyncThunk(
	'cart/removeItemFromCart',
	async (productId) => buyerApi.removeCartItem(productId),
)