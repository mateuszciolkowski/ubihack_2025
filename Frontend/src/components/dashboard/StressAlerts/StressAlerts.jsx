import React, { useState, useEffect } from 'react'
import {
	Card,
	CardHeader,
	CardContent,
	Box,
	CircularProgress,
	Typography,
	Alert,
	AlertTitle,
	List,
	ListItem,
	ListItemText,
	Chip,
} from '@mui/material'
import { Warning as WarningIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material'
import axios from 'axios'

// Configure axios instance
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

function StressAlerts() {
	const [highStressPatients, setHighStressPatients] = useState([])
	const [recentStressMoments, setRecentStressMoments] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchAlerts = async () => {
			try {
				setLoading(true)

				// Pobierz pacjentów
				const patientsResponse = await axiosInstance.get('/api/patients/')
				const patients = patientsResponse.data.results || patientsResponse.data || []
				const patientsMap = new Map(patients.map(p => [p.id, p]))

				// Pobierz wizyty
				const visitsResponse = await axiosInstance.get('/api/visits/')
				const visits = visitsResponse.data.results || visitsResponse.data || []

				// Znajdź pacjentów z wysokim poziomem stresu (>50%)
				const highStressList = []
				const stressMomentsList = []

				visits.forEach(visit => {
					if (visit.stress_history && visit.stress_history.summary) {
						const stressPercentage = visit.stress_history.summary.stress_percentage || 0
						
						if (stressPercentage > 50) {
							const patient = patientsMap.get(visit.patient)
							if (patient) {
								highStressList.push({
									patientId: visit.patient,
									patientName: `${patient.first_name} ${patient.last_name}`,
									stressLevel: stressPercentage,
									visitDate: visit.visit_date,
									visitId: visit.id,
								})
							}
						}

						// Pobierz ostatnie momenty stresu
						if (visit.stress_history.stress_moments && visit.stress_history.stress_moments.length > 0) {
							const patient = patientsMap.get(visit.patient)
							visit.stress_history.stress_moments.forEach(moment => {
								stressMomentsList.push({
									patientId: visit.patient,
									patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Nieznany',
									timestamp: moment.timestamp,
									duration: moment.duration_seconds,
									confidence: moment.confidence,
									visitId: visit.id,
								})
							})
						}
					}
				})

				// Sortuj: najnowsze pierwsze
				highStressList.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
				stressMomentsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

				setHighStressPatients(highStressList.slice(0, 5)) // Top 5
				setRecentStressMoments(stressMomentsList.slice(0, 5)) // Top 5
			} catch (error) {
				console.error('Error fetching alerts:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchAlerts()
	}, [])

	const formatDate = dateString => {
		const date = new Date(dateString)
		return date.toLocaleDateString('pl-PL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	if (loading) {
		return (
			<Card>
				<CardHeader title="Alerty i powiadomienia" />
				<CardContent>
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress />
					</Box>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card
			sx={{
				borderRadius: 3,
				border: '1px solid',
				borderColor: 'rgba(74, 144, 226, 0.12)',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
				boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
			}}
		>
			<CardHeader 
				title="Alerty i powiadomienia"
				sx={{
					'& .MuiCardHeader-title': {
						fontWeight: 700,
						fontSize: '1.25rem',
						background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
					},
				}}
			/>
			<CardContent>
				{/* Pacjenci z wysokim poziomem stresu */}
				<Box 
					sx={{ 
						mb: 4,
						p: 2.5,
						borderRadius: 2.5,
						background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.02) 100%)',
						border: '1px solid',
						borderColor: 'rgba(255, 152, 0, 0.15)',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
						<Box
							sx={{
								p: 1,
								borderRadius: 1.5,
								background: 'rgba(255, 152, 0, 0.15)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<WarningIcon sx={{ color: '#FF9800', fontSize: '1.5rem' }} />
						</Box>
						<Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800' }}>
							Pacjenci wymagający uwagi
						</Typography>
					</Box>
					{highStressPatients.length === 0 ? (
						<Alert 
							severity="success"
							sx={{
								borderRadius: 2,
								background: 'rgba(76, 175, 80, 0.05)',
								border: '1px solid',
								borderColor: 'rgba(76, 175, 80, 0.2)',
							}}
						>
							<AlertTitle sx={{ fontWeight: 600 }}>Brak alertów</AlertTitle>
							Wszyscy pacjenci mają poziom stresu w normie.
						</Alert>
					) : (
						<List sx={{ p: 0 }}>
							{highStressPatients.map((item, index) => (
								<ListItem
									key={index}
									sx={{
										border: '2px solid',
										borderColor: 'rgba(255, 152, 0, 0.3)',
										borderRadius: 2,
										mb: 1.5,
										background: 'rgba(255, 255, 255, 0.8)',
										boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)',
										transition: 'all 0.2s ease',
										'&:hover': {
											transform: 'translateX(4px)',
											boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
											borderColor: 'rgba(255, 152, 0, 0.5)',
										},
									}}
								>
									<ListItemText
										primary={
											<Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
												{item.patientName}
											</Typography>
										}
										secondary={
											<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
													{formatDate(item.visitDate)}
												</Typography>
												<Chip
													label={`${item.stressLevel.toFixed(1)}% stresu`}
													size="small"
													sx={{
														backgroundColor: '#FF9800',
														color: 'white',
														fontWeight: 700,
														fontSize: '0.75rem',
													}}
												/>
											</Box>
										}
									/>
								</ListItem>
							))}
						</List>
					)}
				</Box>

				{/* Ostatnie wykrycia stresu */}
				<Box
					sx={{
						p: 2.5,
						borderRadius: 2.5,
						background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)',
						border: '1px solid',
						borderColor: 'rgba(33, 150, 243, 0.15)',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
						<Box
							sx={{
								p: 1,
								borderRadius: 1.5,
								background: 'rgba(33, 150, 243, 0.15)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<AccessTimeIcon sx={{ color: '#2196F3', fontSize: '1.5rem' }} />
						</Box>
						<Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>
							Ostatnie wykrycia stresu
						</Typography>
					</Box>
					{recentStressMoments.length === 0 ? (
						<Alert 
							severity="info"
							sx={{
								borderRadius: 2,
								background: 'rgba(33, 150, 243, 0.05)',
								border: '1px solid',
								borderColor: 'rgba(33, 150, 243, 0.2)',
							}}
						>
							<AlertTitle sx={{ fontWeight: 600 }}>Brak wykryć</AlertTitle>
							Nie znaleziono ostatnich momentów wykrytego stresu.
						</Alert>
					) : (
						<List sx={{ p: 0 }}>
							{recentStressMoments.map((moment, index) => (
								<ListItem
									key={index}
									sx={{
										border: '2px solid',
										borderColor: 'rgba(33, 150, 243, 0.3)',
										borderRadius: 2,
										mb: 1.5,
										background: 'rgba(255, 255, 255, 0.8)',
										boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)',
										transition: 'all 0.2s ease',
										'&:hover': {
											transform: 'translateX(4px)',
											boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
											borderColor: 'rgba(33, 150, 243, 0.5)',
										},
									}}
								>
									<ListItemText
										primary={
											<Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
												{moment.patientName}
											</Typography>
										}
										secondary={
											<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
												<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
													{formatDate(moment.timestamp)}
												</Typography>
												<Chip
													label={`Czas trwania: ${moment.duration}s`}
													size="small"
													variant="outlined"
													sx={{
														borderColor: '#2196F3',
														color: '#2196F3',
														fontWeight: 600,
													}}
												/>
												<Chip
													label={`Pewność: ${(moment.confidence * 100).toFixed(0)}%`}
													size="small"
													sx={{
														backgroundColor: '#2196F3',
														color: 'white',
														fontWeight: 700,
													}}
												/>
											</Box>
										}
									/>
								</ListItem>
							))}
						</List>
					)}
				</Box>
			</CardContent>
		</Card>
	)
}

export default StressAlerts

