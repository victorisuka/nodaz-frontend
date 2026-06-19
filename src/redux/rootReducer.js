import { combineReducers } from '@reduxjs/toolkit'

import adminReducer from './admin/adminReducer.js'
import authReducer from './auth/authReducer.js'
import cartReducer from './cart/cartReducer.js'
import ordersReducer from './orders/ordersReducer.js'
import productsReducer from './products/productsReducer.js'

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  admin: adminReducer,
})

export default rootReducer