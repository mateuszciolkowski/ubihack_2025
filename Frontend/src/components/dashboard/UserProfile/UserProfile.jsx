import React, { useState, useEffect } from 'react'
import {
	Box,
	Card,
	CardContent,
	Typography,
	CircularProgress,
	Alert,
	Divider,
	Avatar,
	Paper,
	Grid,
} from '@mui/material'
import { Person as PersonIcon, Email as EmailIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'
import PageHeader from '../PageHeader'
import axios from 'axios'

// Configure axios instance (można użyć tego z AuthContext, ale dla prostoty użyjemy bezpośrednio)
const axiosInstance = axios.create({
	baseURL: import.meta.env.DEV ? '' : '',
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

function UserProfile() {
	const [userData, setUserData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				setLoading(true)
				setError(null)
				const response = await axiosInstance.get('/auth/user/me/')
				setUserData(response.data)
			} catch (err) {
				console.error('Error fetching user data:', err)
				setError('Nie udało się pobrać danych użytkownika.')
			} finally {
				setLoading(false)
			}
		}

		fetchUserData()
	}, [])

	const formatDate = dateString => {
		if (!dateString) return 'Brak danych'
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('pl-PL', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		} catch (error) {
			return dateString
		}
	}

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
			</Box>
		)
	}

	if (error) {
		return (
			<Box>
				<PageHeader title="Profil użytkownika" subtitle="Informacje o koncie" />
				<Alert severity="error" sx={{ mt: 2 }}>
					{error}
				</Alert>
			</Box>
		)
	}

	return (
		<Box>
			<PageHeader title="Profil użytkownika" subtitle="Szczegółowe informacje o Twoim koncie" />

			<Grid container spacing={3}>
				<Grid item xs={12} md={4}>
					<Card sx={{ height: '100%' }}>
						<CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
							<Avatar
								sx={{
									width: 120,
									height: 120,
									bgcolor: 'primary.main',
									fontSize: '3rem',
									fontWeight: 600,
									mb: 2,
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								}}
							>
								{userData?.first_name?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || 'U'}
							</Avatar>
							<Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
								{userData?.first_name && userData?.last_name
									? `${userData.first_name} ${userData.last_name}`
									: userData?.first_name || userData?.email || 'Użytkownik'}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								ID: {userData?.id || 'N/A'}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={8}>
					<Card>
						<CardContent>
							<Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
								Informacje o koncie
							</Typography>

							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										bgcolor: 'rgba(0, 0, 0, 0.02)',
										borderRadius: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2,
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: 'primary.main',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<EmailIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
											Email
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{userData?.email || 'Brak danych'}
										</Typography>
									</Box>
								</Paper>

								<Paper
									elevation={0}
									sx={{
										p: 2,
										bgcolor: 'rgba(0, 0, 0, 0.02)',
										borderRadius: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2,
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: 'primary.main',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<PersonIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
											Imię i nazwisko
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{userData?.first_name && userData?.last_name
												? `${userData.first_name} ${userData.last_name}`
												: userData?.first_name || userData?.last_name || 'Brak danych'}
										</Typography>
									</Box>
								</Paper>

								<Paper
									elevation={0}
									sx={{
										p: 2,
										bgcolor: 'rgba(0, 0, 0, 0.02)',
										borderRadius: 2,
										display: 'flex',
										alignItems: 'center',
										gap: 2,
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: 'primary.main',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<CalendarIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
											Data dołączenia
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{formatDate(userData?.date_joined)}
										</Typography>
									</Box>
								</Paper>
							</Box>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	)
}

export default UserProfile

