import React, { useState, useEffect } from 'react'
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	MenuItem,
	CircularProgress,
	Alert,
	IconButton,
	InputAdornment,
} from '@mui/material'
import {
	ArrowBack as ArrowBackIcon,
	Person as PersonIcon,
	CalendarToday as CalendarIcon,
	Wc as GenderIcon,
	Badge as BadgeIcon,
	Notes as NotesIcon,
} from '@mui/icons-material'
import { axiosInstance } from '../../../../context/AuthContext'

function EditPatient({ patientId, onBack, onPatientUpdated }) {
	const [loading, setLoading] = useState(false)
	const [fetching, setFetching] = useState(true)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(false)
	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		dob: '',
		gender: '',
		pesel: '',
		notes: '',
	})

	useEffect(() => {
		const fetchPatient = async () => {
			try {
				setFetching(true)
				const response = await axiosInstance.get(`/api/patients/${patientId}/`)
				const patient = response.data
				setFormData({
					first_name: patient.first_name || '',
					last_name: patient.last_name || '',
					dob: patient.dob || '',
					gender: patient.gender || '',
					pesel: patient.pesel || '',
					notes: patient.notes || '',
				})
			} catch (err) {
				console.error('Error fetching patient:', err)
				setError('Nie udało się pobrać danych pacjenta.')
			} finally {
				setFetching(false)
			}
		}

		if (patientId) {
			fetchPatient()
		}
	}, [patientId])

	const handleChange = e => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
		setError(null)
		setSuccess(false)
	}

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(false)

		try {
			await axiosInstance.patch(`/api/patients/${patientId}/`, formData)

			setSuccess(true)
			if (onPatientUpdated) {
				onPatientUpdated()
			}
			// Automatycznie wróć po 1.5 sekundy
			setTimeout(() => {
				if (onBack) {
					onBack()
				}
			}, 1500)
		} catch (err) {
			console.error('Error updating patient:', err)
			if (err.response?.data) {
				const errorData = err.response.data
				if (typeof errorData === 'string') {
					setError(errorData)
				} else if (errorData.detail) {
					setError(errorData.detail)
				} else {
					const errorMessages = Object.values(errorData).flat().join(', ')
					setError(errorMessages || 'Nie udało się zaktualizować pacjenta.')
				}
			} else {
				setError('Nie udało się zaktualizować pacjenta. Spróbuj ponownie.')
			}
		} finally {
			setLoading(false)
		}
	}

	if (fetching) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
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
					{onBack && (
						<IconButton
							onClick={onBack}
							sx={{
								backgroundColor: '#4A90E2',
								color: 'white',
								'&:hover': {
									backgroundColor: '#3A7BC8',
									transform: 'scale(1.05)',
								},
								transition: 'all 0.2s ease',
								boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
								width: 44,
								height: 44,
							}}>
							<ArrowBackIcon />
						</IconButton>
					)}
					<Box sx={{ flex: 1 }}>
						<Typography
							variant='h4'
							component='h1'
							sx={{
								fontWeight: 700,
								color: '#4A90E2',
								mb: 0.5,
								background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}>
							Edytuj pacjenta
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
							Zaktualizuj dane pacjenta w systemie
						</Typography>
					</Box>
				</Box>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2, py: 0.5 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}
			{success && (
				<Alert severity="success" sx={{ mb: 3, borderRadius: 2, py: 0.5 }}>
					Pacjent został pomyślnie zaktualizowany!
				</Alert>
			)}

			<Card
				sx={{
					borderRadius: 2,
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
				}}>
				<CardContent sx={{ p: 4 }}>
					<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							fullWidth
							label='Imię'
							name='first_name'
							value={formData.first_name}
							onChange={handleChange}
							required
							disabled={loading}
							size="small"
							variant="outlined"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PersonIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}
						/>
						<TextField
							fullWidth
							label='Nazwisko'
							name='last_name'
							value={formData.last_name}
							onChange={handleChange}
							required
							disabled={loading}
							size="small"
							variant="outlined"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PersonIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}
						/>
						<TextField
							fullWidth
							label='Data urodzenia'
							name='dob'
							type='date'
							value={formData.dob}
							onChange={handleChange}
							required
							disabled={loading}
							size="small"
							variant="outlined"
							InputLabelProps={{
								shrink: true,
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<CalendarIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}
						/>
						<TextField
							fullWidth
							select
							label='Płeć'
							name='gender'
							value={formData.gender}
							onChange={handleChange}
							required
							disabled={loading}
							size="small"
							variant="outlined"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<GenderIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}>
							<MenuItem value="M">Mężczyzna</MenuItem>
							<MenuItem value="F">Kobieta</MenuItem>
						</TextField>
						<TextField
							fullWidth
							label='PESEL'
							name='pesel'
							value={formData.pesel}
							onChange={handleChange}
							required
							disabled={loading}
							size="small"
							variant="outlined"
							inputProps={{ maxLength: 11 }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<BadgeIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}
						/>
						<TextField
							fullWidth
							label='Notatki'
							name='notes'
							value={formData.notes}
							onChange={handleChange}
							multiline
							rows={4}
							disabled={loading}
							size="small"
							variant="outlined"
							helperText="Opcjonalne notatki dotyczące pacjenta"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1 }}>
										<NotesIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
									</InputAdornment>
								),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									'&:hover fieldset': {
										borderColor: '#4A90E2',
									},
									'&.Mui-focused fieldset': {
										borderColor: '#4A90E2',
									},
								},
							}}
						/>
						<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
							{onBack && (
								<Button
									variant='outlined'
									onClick={onBack}
									disabled={loading}
									sx={{
										borderRadius: 2,
										textTransform: 'none',
										fontSize: '0.9375rem',
										fontWeight: 600,
										px: 3,
										py: 1,
										borderWidth: 2,
										borderColor: '#4A90E2',
										color: '#4A90E2',
										'&:hover': {
											borderWidth: 2,
											backgroundColor: 'rgba(74, 144, 226, 0.08)',
										},
									}}>
									Anuluj
								</Button>
							)}
							<Button
								type='submit'
								variant='contained'
								disabled={loading}
								sx={{
									minWidth: 150,
									py: 1,
									borderRadius: 2,
									textTransform: 'none',
									fontSize: '0.9375rem',
									fontWeight: 600,
									backgroundColor: '#4A90E2',
									boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
									'&:hover': {
										backgroundColor: '#3A7BC8',
										boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
									},
								}}>
								{loading ? (
									<>
										<CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
										Zapisywanie...
									</>
								) : (
									'Zapisz zmiany'
								)}
							</Button>
						</Box>
					</Box>
				</CardContent>
			</Card>
		</Box>
	)
}

export default EditPatient

