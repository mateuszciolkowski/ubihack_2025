import React, { useState, useEffect } from 'react'
import {
	Box,
	Typography,
	Card,
	CardContent,
	CircularProgress,
	Alert,
	Paper,
	Chip,
	Divider,
	IconButton,
	Tabs,
	Tab,
} from '@mui/material'
import {
	Assessment as ReportIcon,
	Psychology as PsychologyIcon,
	ArrowBack as ArrowBackIcon,
	TrendingUp as TrendingUpIcon,
	Person as PersonIcon,
} from '@mui/icons-material'
import { axiosInstance } from '../../../context/AuthContext'

function TabPanel({ children, value, index }) {
	return (
		<div role="tabpanel" hidden={value !== index}>
			{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
		</div>
	)
}

function ReportView({ onBack }) {
	const [patients, setPatients] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [selectedTab, setSelectedTab] = useState(0)

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				setLoading(true)
				setError(null)

				const response = await axiosInstance.get('/api/patients/')
				const patientsData = response.data.results || response.data || []
				
				// Filtruj tylko pacjentów z long_term_summary
				const patientsWithSummary = patientsData.filter(
					patient => patient.long_term_summary && patient.long_term_summary.trim() !== ''
				)

				setPatients(patientsWithSummary)
			} catch (err) {
				console.error('Error fetching patients:', err)
				setError('Nie udało się pobrać danych pacjentów.')
			} finally {
				setLoading(false)
			}
		}

		fetchPatients()
	}, [])

	const handleTabChange = (event, newValue) => {
		setSelectedTab(newValue)
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
				{onBack && (
					<IconButton
						onClick={onBack}
						sx={{
							mb: 2,
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
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
					{error}
				</Alert>
			</Box>
		)
	}

	if (patients.length === 0) {
		return (
			<Box>
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
									mb: 0.5,
									background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
									backgroundClip: 'text',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
								}}>
								Raport główny
							</Typography>
							<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
								Analiza długoterminowa postępów pacjentów
							</Typography>
						</Box>
					</Box>
				</Box>
				<Alert severity="info" sx={{ borderRadius: 2 }}>
					Brak dostępnych raportów. Raporty AI są generowane automatycznie po dodaniu wizyt z danymi biometrycznymi.
				</Alert>
			</Box>
		)
	}

	// Podsumowanie ogólne - połącz wszystkie raporty
	const allSummaries = patients.map(p => p.long_term_summary).join('\n\n')

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
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
						<Box>
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
								Raport główny
							</Typography>
							<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
								Analiza długoterminowa postępów pacjentów
							</Typography>
						</Box>
					</Box>
					<Chip
						icon={<ReportIcon />}
						label={`${patients.length} ${patients.length === 1 ? 'raport' : 'raportów'}`}
						color="primary"
						sx={{ fontWeight: 600 }}
					/>
				</Box>

				{/* Tabs */}
				<Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
					<Tab label="Podsumowanie ogólne" icon={<TrendingUpIcon />} iconPosition="start" />
					<Tab label="Raporty indywidualne" icon={<PersonIcon />} iconPosition="start" />
				</Tabs>
			</Box>

			{/* Tab Panel: Podsumowanie ogólne */}
			<TabPanel value={selectedTab} index={0}>
				<Card
					sx={{
						borderRadius: 3,
						border: '1px solid',
						borderColor: 'rgba(74, 144, 226, 0.12)',
						background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
						boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
					}}>
					<CardContent sx={{ p: 4 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
							<PsychologyIcon sx={{ fontSize: 32, color: '#4A90E2' }} />
							<Typography variant='h5' sx={{ fontWeight: 600, color: '#4A90E2' }}>
								Analiza ogólna
							</Typography>
						</Box>
						<Divider sx={{ mb: 3 }} />
						<Paper
							variant='outlined'
							sx={{
								p: 3,
								borderRadius: 2,
								backgroundColor: 'rgba(74, 144, 226, 0.02)',
								borderColor: 'rgba(74, 144, 226, 0.2)',
							}}>
							<Typography
								variant='body1'
								sx={{
									whiteSpace: 'pre-wrap',
									lineHeight: 1.8,
									color: '#333',
									fontSize: '1rem',
								}}>
								{allSummaries || 'Brak dostępnych analiz.'}
							</Typography>
						</Paper>
					</CardContent>
				</Card>
			</TabPanel>

			{/* Tab Panel: Raporty indywidualne */}
			<TabPanel value={selectedTab} index={1}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					{patients.map((patient, index) => (
						<Card
							key={patient.id}
							sx={{
								borderRadius: 3,
								border: '1px solid',
								borderColor: 'rgba(74, 144, 226, 0.12)',
								background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
								boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: '0 8px 30px rgba(74, 144, 226, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
									borderColor: 'rgba(74, 144, 226, 0.25)',
								},
							}}>
							<CardContent sx={{ p: 4 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
									<PersonIcon sx={{ fontSize: 28, color: '#4A90E2' }} />
									<Box sx={{ flex: 1 }}>
										<Typography variant='h6' sx={{ fontWeight: 600, color: '#4A90E2' }}>
											{patient.first_name} {patient.last_name}
										</Typography>
										<Typography variant='body2' color='text.secondary'>
											PESEL: {patient.pesel}
										</Typography>
									</Box>
									<Chip
										label={`Raport #${index + 1}`}
										size="small"
										color="primary"
										variant="outlined"
									/>
								</Box>
								<Divider sx={{ mb: 3 }} />
								<Paper
									variant='outlined'
									sx={{
										p: 3,
										borderRadius: 2,
										backgroundColor: 'rgba(74, 144, 226, 0.02)',
										borderColor: 'rgba(74, 144, 226, 0.2)',
									}}>
									<Typography
										variant='body1'
										sx={{
											whiteSpace: 'pre-wrap',
											lineHeight: 1.8,
											color: '#333',
											fontSize: '1rem',
										}}>
										{patient.long_term_summary}
									</Typography>
								</Paper>
							</CardContent>
						</Card>
					))}
				</Box>
			</TabPanel>
		</Box>
	)
}

export default ReportView

