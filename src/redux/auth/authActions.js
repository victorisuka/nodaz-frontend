import { createAsyncThunk } from '@reduxjs/toolkit'

import { authApi } from '../../lib/api.js'

export const hydrateSession = createAsyncThunk('auth/hydrateSession', async () => authApi.getSession())

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => authApi.login(payload))

export const signupUser = createAsyncThunk('auth/signupUser', async (payload) => authApi.signup(payload))

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => authApi.logout())