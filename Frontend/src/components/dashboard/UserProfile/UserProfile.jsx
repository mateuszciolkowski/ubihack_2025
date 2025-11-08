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
	IconButton,
} from '@mui/material'
import { Person as PersonIcon, Email as EmailIcon, CalendarToday as CalendarIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { axiosInstance } from '../../../context/AuthContext'


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
				{/* Header */}
				<Box
					sx={{
						mb: 4,
						pb: 3,
						borderBottom: '2px solid',
						borderColor: 'rgba(74, 144, 226, 0.2)',
						position: 'relative',
						left: { xs: -24, sm: -24, md: -24 },
						right: { xs: -24, sm: -24, md: -24 },
						px: { xs: 3, sm: 3, md: 3 },
						width: { xs: 'calc(100% + 48px)', sm: 'calc(100% + 48px)', md: 'calc(100% + 48px)' },
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
						<Box sx={{ flex: 1 }}>
							<Typography
								variant='h4'
								component='h1'
								sx={{
									fontWeight: 700,
									mb: 0.5,
									background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
									backgroundClip: 'text',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
								}}>
								Profil użytkownika
							</Typography>
							<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
								Informacje o koncie
							</Typography>
						</Box>
					</Box>
				</Box>
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2, py: 0.5 }}>
					{error}
				</Alert>
			</Box>
		)
	}

	return (
		<Box>
			{/* Header */}
			<Box
				sx={{
					mb: 4,
					pb: 3,
					borderBottom: '2px solid',
					borderColor: 'rgba(74, 144, 226, 0.2)',
					position: 'relative',
					left: { xs: -24, sm: -24, md: -24 },
					right: { xs: -24, sm: -24, md: -24 },
					px: { xs: 3, sm: 3, md: 3 },
					width: { xs: 'calc(100% + 48px)', sm: 'calc(100% + 48px)', md: 'calc(100% + 48px)' },
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant='h4'
							component='h1'
							sx={{
								fontWeight: 700,
								mb: 0.5,
								background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}>
							Profil użytkownika
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
							Szczegółowe informacje o Twoim koncie
						</Typography>
					</Box>
				</Box>
			</Box>

			<Grid container spacing={3}>
				<Grid item xs={12} md={4}>
					<Card
						sx={{
							height: '100%',
							borderRadius: 3,
							border: '1px solid',
							borderColor: 'rgba(74, 144, 226, 0.12)',
							background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
							boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
						}}>
						<CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
							<Avatar
								sx={{
									width: 120,
									height: 120,
									bgcolor: '#4A90E2',
									fontSize: '3rem',
									fontWeight: 600,
									mb: 2,
									boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
								}}
							>
								{userData?.first_name?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || 'U'}
							</Avatar>
							<Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#4A90E2' }}>
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
					<Card
						sx={{
							borderRadius: 3,
							border: '1px solid',
							borderColor: 'rgba(74, 144, 226, 0.12)',
							background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
							boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
						}}>
						<CardContent sx={{ p: 3 }}>
							<Typography
								variant="h6"
								sx={{
									fontWeight: 700,
									mb: 3,
									background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
									backgroundClip: 'text',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
								}}>
								Informacje o koncie
							</Typography>

							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										background: 'rgba(74, 144, 226, 0.03)',
										border: '1px solid',
										borderColor: 'rgba(74, 144, 226, 0.1)',
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										transition: 'all 0.2s ease',
										'&:hover': {
											background: 'rgba(74, 144, 226, 0.05)',
											borderColor: 'rgba(74, 144, 226, 0.2)',
										},
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: '#4A90E2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<EmailIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
											Email
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>
											{userData?.email || 'Brak danych'}
										</Typography>
									</Box>
								</Paper>

								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										background: 'rgba(74, 144, 226, 0.03)',
										border: '1px solid',
										borderColor: 'rgba(74, 144, 226, 0.1)',
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										transition: 'all 0.2s ease',
										'&:hover': {
											background: 'rgba(74, 144, 226, 0.05)',
											borderColor: 'rgba(74, 144, 226, 0.2)',
										},
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: '#4A90E2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<PersonIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
											Imię i nazwisko
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>
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
										borderRadius: 2,
										background: 'rgba(74, 144, 226, 0.03)',
										border: '1px solid',
										borderColor: 'rgba(74, 144, 226, 0.1)',
										display: 'flex',
										alignItems: 'center',
										gap: 2,
										transition: 'all 0.2s ease',
										'&:hover': {
											background: 'rgba(74, 144, 226, 0.05)',
											borderColor: 'rgba(74, 144, 226, 0.2)',
										},
									}}
								>
									<Box
										sx={{
											width: 48,
											height: 48,
											borderRadius: 2,
											bgcolor: '#4A90E2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
										}}
									>
										<CalendarIcon />
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
											Data dołączenia
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>
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

