import { createAsyncThunk } from '@reduxjs/toolkit'

import { publicApi } from '../../lib/api.js'

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => publicApi.getProducts())

export const fetchProductById = createAsyncThunk(
	'products/fetchProductById',
	async (productId) => publicApi.getProduct(productId),
)