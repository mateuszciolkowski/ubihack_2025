import React, { useState } from 'react'
import {
	Box,
	Typography,
	TextField,
	Button,
	Grid,
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
import { axiosInstance } from '../../../context/AuthContext'

function AddPatient({ onBack, onPatientAdded }) {
	const [loading, setLoading] = useState(false)
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
			const response = await axiosInstance.post('/api/patients/', formData)
			if (response.status === 201) {
				setSuccess(true)
				// Reset formularza
				setFormData({
					first_name: '',
					last_name: '',
					dob: '',
					gender: '',
					pesel: '',
					notes: '',
				})
				// Jeśli jest callback, wywołaj go
				if (onPatientAdded) {
					onPatientAdded()
				}
				// Ukryj komunikat sukcesu po 3 sekundach
				setTimeout(() => {
					setSuccess(false)
				}, 3000)
			}
		} catch (error) {
			console.error('Error adding patient:', error)
			if (error.response?.data) {
				// Wyświetl szczegóły błędu z backendu
				const errorMessage = typeof error.response.data === 'string' 
					? error.response.data 
					: Object.values(error.response.data).flat().join(', ')
				setError(errorMessage)
			} else {
				setError('Błąd podczas dodawania pacjenta. Sprawdź dane i spróbuj ponownie.')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<Box>
			{/* Header z przyciskiem powrotu - pełna szerokość */}
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
							Dodaj nowego pacjenta
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
							Wypełnij formularz, aby dodać nowego pacjenta do systemu
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Komunikaty */}
			{error && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2, py: 0.5 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}
			{success && (
				<Alert severity="success" sx={{ mb: 3, borderRadius: 2, py: 0.5 }}>
					Pacjent został pomyślnie dodany!
				</Alert>
			)}

			{/* Formularz */}
			<Card
				sx={{
					borderRadius: 3,
					border: '1px solid',
					borderColor: 'rgba(74, 144, 226, 0.12)',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
					boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
				}}>
				<CardContent sx={{ p: 4 }}>
					<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
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
							</Grid>
							<Grid item xs={12} sm={6}>
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
							</Grid>
							<Grid item xs={12} sm={6}>
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
									inputProps={{
										max: new Date().toISOString().split('T')[0],
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
							</Grid>
							<Grid item xs={12} sm={6}>
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
									<MenuItem value='M'>Mężczyzna</MenuItem>
									<MenuItem value='F'>Kobieta</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={12} sm={6}>
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
									inputProps={{ maxLength: 11, pattern: '[0-9]*' }}
									helperText="11 cyfr"
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
							</Grid>
							<Grid item xs={12}>
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
							</Grid>
							<Grid item xs={12}>
								<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
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
												Dodawanie...
											</>
										) : (
											'Dodaj pacjenta'
										)}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</Box>
				</CardContent>
			</Card>
		</Box>
	)
}

export default AddPatient

