import React, { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const API_URLS = {
	login: '/auth/login',
	register: '/auth/register',
	refresh: '/auth/token/refresh',
}

// Configure axios with base URL for development
// ========= ZMIANA TUTAJ: Dodano "export" =========
export const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || '',
	headers: {
		'Content-Type': 'application/json',
	},
})

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
	config => {
		const tokens = localStorage.getItem('authTokens')
		if (tokens) {
			try {
				const parsedTokens = JSON.parse(tokens)
				if (parsedTokens?.access) {
					config.headers.Authorization = `Bearer ${parsedTokens.access}`
				}
			} catch (error) {
				console.error('Error parsing tokens:', error)
			}
		}
		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
	response => response,
	async error => {
		const originalRequest = error.config

		// If 401 and not already retrying, try to refresh token
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true

			try {
				const tokens = localStorage.getItem('authTokens')
				if (tokens) {
					const parsedTokens = JSON.parse(tokens)
					if (parsedTokens?.refresh) {
						// Użyj nowej, czystej instancji axios TYLKO do odświeżenia tokena,
						// aby uniknąć pętli interceptora
						const refreshAxiosInstance = axios.create({
							baseURL: import.meta.env.DEV ? '' : '',
							headers: {
								'Content-Type': 'application/json',
							},
						})
						const response = await refreshAxiosInstance.post(API_URLS.refresh, {
							refresh: parsedTokens.refresh,
						})

						if (response.status === 200) {
							const newTokens = {
								access: response.data.access,
								refresh: parsedTokens.refresh,
							}
							localStorage.setItem('authTokens', JSON.stringify(newTokens))
							originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
							// Ponów oryginalne żądanie z nowym tokenem
							return axiosInstance(originalRequest)
						}
					}
				}
			} catch (refreshError) {
				// Refresh failed, logout user
				localStorage.removeItem('authTokens')
				window.location.href = '/'
				return Promise.reject(refreshError)
			}
		}

		return Promise.reject(error)
	}
)

const AuthContext = createContext()
export default AuthContext

export const AuthProvider = ({ children }) => {
	// ... (reszta pliku pozostaje bez zmian) ...
	// 2. Wczytaj tokeny z localStorage przy starcie aplikacji
	const [authTokens, setAuthTokens] = useState(() =>
		localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
	)

	// 3. Wczytaj użytkownika (zdekodowanego z tokena)
	const [user, setUser] = useState(() => {
		try {
			const tokens = localStorage.getItem('authTokens')
			if (tokens) {
				const parsedTokens = JSON.parse(tokens)
				if (parsedTokens?.access) {
					return jwtDecode(parsedTokens.access)
				}
			}
		} catch (error) {
			console.error('Error decoding token:', error)
			localStorage.removeItem('authTokens')
		}
		return null
	})

	const [loading, setLoading] = useState(true) // Do obsługi początkowego ładowania

	/**
	 * Funkcja logowania
	 */
	const loginUser = async (email, password) => {
		try {
			const response = await axiosInstance.post(API_URLS.login, {
				email, // Backend serializer accepts 'email' field
				password,
			})

			if (response.status === 200) {
				const data = response.data
				// Backend returns {access, refresh, user} structure
				const tokens = {
					access: data.access,
					refresh: data.refresh,
				}
				setAuthTokens(tokens)
				setUser(jwtDecode(data.access))
				localStorage.setItem('authTokens', JSON.stringify(tokens))
			}
		} catch (error) {
			// Handle error and re-throw for form to catch
			if (error.response) {
				// Server responded with error status
				const errorData = error.response.data
				// Check for field-specific errors first (email, password)
				if (errorData.email) {
					throw new Error(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email)
				} else if (errorData.password) {
					throw new Error(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password)
				} else if (errorData.detail) {
					throw new Error(Array.isArray(errorData.detail) ? errorData.detail[0] : errorData.detail)
				} else if (errorData.error) {
					throw new Error(Array.isArray(errorData.error) ? errorData.error[0] : errorData.error)
				} else {
					throw new Error('Nieprawidłowy email lub hasło.')
				}
			} else if (error.request) {
				// Request was made but no response received
				throw new Error('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.')
			} else {
				// Something else happened
				throw new Error('Wystąpił błąd podczas logowania.')
			}
		}
	}

	/**
	 * Funkcja rejestracji
	 */
	const registerUser = async (email, password, password2, first_name, last_name) => {
		try {
			const response = await axiosInstance.post(API_URLS.register, {
				email,
				password,
				password2,
				first_name,
				last_name,
			})

			if (response.status === 201) {
				const data = response.data
				// Backend returns {user, tokens: {access, refresh}, message}
				if (data.tokens) {
					const tokens = {
						access: data.tokens.access,
						refresh: data.tokens.refresh,
					}
					setAuthTokens(tokens)
					setUser(jwtDecode(data.tokens.access))
					localStorage.setItem('authTokens', JSON.stringify(tokens))
				}
			}
		} catch (error) {
			// Handle error and re-throw for form to catch
			if (error.response) {
				// Server responded with error status
				const errorData = error.response.data
				if (errorData.email) {
					throw new Error(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email)
				} else if (errorData.password) {
					throw new Error(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password)
				} else if (errorData.non_field_errors) {
					throw new Error(
						Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors
					)
				} else {
					throw new Error(errorData.detail || 'Wystąpił błąd podczas rejestracji.')
				}
			} else if (error.request) {
				throw new Error('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.')
			} else {
				throw new Error('Wystąpił błąd podczas rejestracji.')
			}
		}
	}

	/**
	 * Funkcja wylogowania
	 */
	const logoutUser = () => {
		setAuthTokens(null)
		setUser(null)
		localStorage.removeItem('authTokens')
	}

	/**
	 * Kontekst, który udostępnimy komponentom
	 */
	const contextData = {
		user: user,
		authTokens: authTokens,
		loginUser: loginUser,
		registerUser: registerUser,
		logoutUser: logoutUser,
	}

	/**
	 * Sprawdź czy token jest ważny (nie wygasł)
	 */
	const isTokenExpired = token => {
		try {
			const decoded = jwtDecode(token)
			const currentTime = Date.now() / 1000
			return decoded.exp < currentTime
		} catch (error) {
			return true
		}
	}

	/**
	 * Odświeżanie tokena (obsługa payloadu "refresh")
	 */
	useEffect(() => {
		// Sprawdź tokeny przy starcie
		if (!authTokens) {
			setLoading(false)
			return
		}

		// Sprawdź czy access token jest ważny
		if (!isTokenExpired(authTokens.access)) {
			setLoading(false)
			return
		}

		// Jeśli token wygasł, odśwież go
		const updateToken = async () => {
			try {
				const response = await axiosInstance.post(API_URLS.refresh, {
					refresh: authTokens.refresh,
				})

				if (response.status === 200) {
					const data = response.data
					// Backend returns {access} for refresh endpoint
					const tokens = {
						access: data.access,
						refresh: authTokens.refresh, // Keep the same refresh token (unless rotated)
					}
					setAuthTokens(tokens)
					setUser(jwtDecode(data.access))
					localStorage.setItem('authTokens', JSON.stringify(tokens))
				}
			} catch (error) {
				// Jeśli refresh token jest nieprawidłowy (np. wygasł), wyloguj
				console.error('Nie udało się odświeżyć tokena', error)
				setAuthTokens(null)
				setUser(null)
				localStorage.removeItem('authTokens')
			} finally {
				setLoading(false)
			}
		}

		updateToken()
	}, []) // Uruchom tylko raz przy montowaniu

	/**
	 * Automatyczne odświeżanie tokena co 4 minuty
	 */
	useEffect(() => {
		if (!authTokens) return

		const fourMinutes = 1000 * 60 * 4
		const interval = setInterval(async () => {
			// Sprawdź aktualne tokeny z localStorage
			const currentTokens = localStorage.getItem('authTokens')
			if (!currentTokens) return

			try {
				const parsedTokens = JSON.parse(currentTokens)
				if (parsedTokens?.access && isTokenExpired(parsedTokens.access)) {
					if (parsedTokens?.refresh) {
						try {
							const response = await axiosInstance.post(API_URLS.refresh, {
								refresh: parsedTokens.refresh,
							})

							if (response.status === 200) {
								const newTokens = {
									access: response.data.access,
									refresh: parsedTokens.refresh,
								}
								setAuthTokens(newTokens)
								setUser(jwtDecode(response.data.access))
								localStorage.setItem('authTokens', JSON.stringify(newTokens))
							}
						} catch (error) {
							console.error('Nie udało się odświeżyć tokena', error)
							setAuthTokens(null)
							setUser(null)
							localStorage.removeItem('authTokens')
						}
					}
				}
			} catch (error) {
				console.error('Error checking token:', error)
			}
		}, fourMinutes)

		return () => clearInterval(interval)
	}, [authTokens])

	return <AuthContext.Provider value={contextData}>{loading ? null : children}</AuthContext.Provider>
}
