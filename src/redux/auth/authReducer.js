import { createSlice } from '@reduxjs/toolkit'

import { hydrateSession, loginUser, logoutUser, signupUser } from './authActions.js'

const initialState = {
	user: null,
	isAuthenticated: false,
	initialized: false,
	status: 'idle',
	error: null,
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(hydrateSession.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(hydrateSession.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.initialized = true
				state.isAuthenticated = action.payload.isAuthenticated
				state.user = action.payload.user
			})
			.addCase(hydrateSession.rejected, (state, action) => {
				state.status = 'failed'
				state.initialized = true
				state.isAuthenticated = false
				state.user = null
				state.error = action.error.message
			})
			.addCase(loginUser.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.isAuthenticated = true
				state.user = action.payload.user
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(signupUser.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(signupUser.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.isAuthenticated = true
				state.user = action.payload.user
			})
			.addCase(signupUser.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(logoutUser.fulfilled, (state) => {
				state.status = 'idle'
				state.isAuthenticated = false
				state.user = null
				state.error = null
				state.initialized = true
			})
	},
})

export default authSlice.reducer