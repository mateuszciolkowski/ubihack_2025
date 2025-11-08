import React, { useState, useContext } from 'react'
import {
	Box,
	TextField,
	Button,
	Alert,
	InputAdornment,
	CircularProgress,
	Grid,
	Typography,
	Link,
} from '@mui/material'
import {
	Email as EmailIcon,
	Lock as LockIcon,
	Person as PersonIcon,
} from '@mui/icons-material'
import AuthContext from '../../../context/AuthContext'

function RegistrationForm({ onSuccess, onSwitchToLogin }) {
	const [email, setEmail] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [password, setPassword] = useState('')
	const [password2, setPassword2] = useState('')
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	const { registerUser } = useContext(AuthContext)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError(null)
		setLoading(true)

		if (password !== password2) {
			setError('Hasła nie są identyczne!')
			setLoading(false)
			return
		}

		try {
			await registerUser(email, password, password2, firstName, lastName)
			onSuccess()
		} catch (err) {
			console.error('Registration error:', err)
			setError(err.message || 'Wystąpił błąd podczas rejestracji.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
			{error && (
				<Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>
					{error}
				</Alert>
			)}

			<TextField
				id="reg-email"
				label="Email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
				fullWidth
				size="small"
				variant="outlined"
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<EmailIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
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

			<Grid container spacing={1.5}>
				<Grid item xs={12} sm={6}>
					<TextField
						id="reg-firstname"
						label="Imię"
						type="text"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						required
						fullWidth
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
						id="reg-lastname"
						label="Nazwisko"
						type="text"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						required
						fullWidth
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
			</Grid>

			<TextField
				id="reg-password"
				label="Hasło"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
				fullWidth
				size="small"
				variant="outlined"
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<LockIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
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
				id="reg-confirm-password"
				label="Potwierdź hasło"
				type="password"
				value={password2}
				onChange={(e) => setPassword2(e.target.value)}
				required
				fullWidth
				size="small"
				variant="outlined"
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<LockIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
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

			<Button
				type="submit"
				variant="contained"
				size="medium"
				fullWidth
				disabled={loading}
				sx={{
					mt: 0.5,
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
				}}
			>
				{loading ? <CircularProgress size={20} color="inherit" /> : 'Zarejestruj się'}
			</Button>

			{onSwitchToLogin && (
				<Box sx={{ mt: 1.5, textAlign: 'center' }}>
					<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
						Masz już konto?{' '}
						<Link
							component="button"
							type="button"
							onClick={onSwitchToLogin}
							sx={{
								color: '#4A90E2',
								fontWeight: 600,
								textDecoration: 'none',
								cursor: 'pointer',
								fontSize: '0.875rem',
								'&:hover': {
									textDecoration: 'underline',
									color: '#3A7BC8',
								},
							}}
						>
							Zaloguj się
						</Link>
					</Typography>
				</Box>
			)}
		</Box>
	)
}

export default RegistrationForm

