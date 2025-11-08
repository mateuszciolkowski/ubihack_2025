import React, { useState, useEffect } from 'react'
import {
	Box,
	Typography,
	CircularProgress,
	Paper,
	IconButton,
	Divider,
	Grid,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Card,
	CardContent,
	Alert,
	Chip,
	Button,
	TextField,
} from '@mui/material'
import {
	ArrowBack as ArrowBackIcon,
	Person as PersonIcon,
	CalendarToday as CalendarIcon,
	Badge as BadgeIcon,
	Notes as NotesIcon,
	Psychology as PsychologyIcon,
	SmartToy as SmartToyIcon,
	Edit as EditIcon,
	Save as SaveIcon,
	Cancel as CancelIcon,
	Watch as WatchIcon,
	Audiotrack as AudioIcon,
} from '@mui/icons-material'
import { axiosInstance } from '../../../context/AuthContext'
import BarChart from './BarChart'
import AddVisit from './AddVisit'
import BraceletDataUpload from './BraceletDataUpload'
import AudioUpload from './AudioUpload'

const DROPDOWN_MAX_HEIGHT = 250

const PatientDetailView = ({ patientId, onBack }) => {
	const [patientData, setPatientData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [selectedVisitId, setSelectedVisitId] = useState('')
	const [showAddVisit, setShowAddVisit] = useState(false)
	const [editingNotes, setEditingNotes] = useState(false)
	const [notesValue, setNotesValue] = useState('')
	const [savingNotes, setSavingNotes] = useState(false)

	useEffect(() => {
		setLoading(true)
		setError(null)
		setPatientData(null)
		setSelectedVisitId('')

		const fetchPatientData = async () => {
			try {
				const response = await axiosInstance.get(`/api/patients/${patientId}/full/`)
				setPatientData(response.data)
			} catch (err) {
				console.error('Failed to fetch patient details:', err)
				setError('Nie udało się pobrać szczegółowych danych pacjenta.')
			} finally {
				setLoading(false)
			}
		}

		if (patientId) {
			fetchPatientData()
		}
	}, [patientId])

	const handleVisitChange = event => {
		setSelectedVisitId(event.target.value)
		setEditingNotes(false)
		setNotesValue('')
	}

	const selectedVisit =
		patientData?.visits.find(visit => visit.id === selectedVisitId) || null

	// Automatycznie wybierz pierwszą wizytę, jeśli dostępna
	useEffect(() => {
		if (patientData?.visits && patientData.visits.length > 0 && !selectedVisitId) {
			// Sortuj wizyty od najnowszej
			const sortedVisits = [...patientData.visits].sort(
				(a, b) => new Date(b.visit_date) - new Date(a.visit_date)
			)
			setSelectedVisitId(sortedVisits[0].id)
		}
	}, [patientData, selectedVisitId])

	const formatDate = dateString => {
		if (!dateString) return 'Brak'
		const date = new Date(dateString)
		return date.toLocaleDateString('pl-PL', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	const formatDateTime = dateString => {
		if (!dateString) return 'Brak'
		const date = new Date(dateString)
		return date.toLocaleString('pl-PL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const getStressLevelColor = level => {
		if (level <= 2) return 'success'
		if (level <= 5) return 'warning'
		return 'error'
	}

	const getStressLevelText = level => {
		if (level <= 2) return 'Niski'
		if (level <= 5) return 'Średni'
		return 'Wysoki'
	}

	const handleVisitAdded = () => {
		// Odśwież dane pacjenta po dodaniu wizyty
		const fetchPatientData = async () => {
			try {
				const response = await axiosInstance.get(`/api/patients/${patientId}/full/`)
				setPatientData(response.data)
				setShowAddVisit(false)
				// Automatycznie wybierz najnowszą wizytę
				if (response.data.visits && response.data.visits.length > 0) {
					const sortedVisits = [...response.data.visits].sort(
						(a, b) => new Date(b.visit_date) - new Date(a.visit_date)
					)
					setSelectedVisitId(sortedVisits[0].id)
				}
			} catch (err) {
				console.error('Failed to refresh patient data:', err)
			}
		}
		fetchPatientData()
	}

	const handleEditNotes = () => {
		if (selectedVisit) {
			setNotesValue(selectedVisit.psychologist_notes || '')
			setEditingNotes(true)
		}
	}

	const handleCancelEdit = () => {
		setEditingNotes(false)
		setNotesValue('')
	}

	const handleSaveNotes = async () => {
		if (!selectedVisit) return

		setSavingNotes(true)
		try {
			await axiosInstance.patch(`/api/visits/${selectedVisit.id}/`, {
				psychologist_notes: notesValue || null,
			})

			// Odśwież dane pacjenta
			const response = await axiosInstance.get(`/api/patients/${patientId}/full/`)
			setPatientData(response.data)
			setEditingNotes(false)
			setNotesValue('')
		} catch (err) {
			console.error('Failed to update notes:', err)
			alert('Nie udało się zapisać notatek. Spróbuj ponownie.')
		} finally {
			setSavingNotes(false)
		}
	}

	const handleBraceletDataUpload = async (data, visitId) => {
		// Mock upload - na razie tylko logowanie
		console.log('Mock upload danych z bransoletki:', { data, visitId })
		
		// Mock - symuluj generowanie stress_history po wgraniu danych
		// W rzeczywistości tutaj byłoby:
		// 1. Upload danych do backendu
		// 2. Wywołanie analizy stresu
		// 3. Zapisanie wyników jako stress_history
		
		// Symuluj opóźnienie przetwarzania
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// Mock stress_history - w rzeczywistości pochodziłoby z analizy
		const mockStressHistory = {
			summary: {
				overall_stress_value: 2.5,
				stress_percentage: 25.0,
				stress_segments_count: 8,
			},
			segments: Array.from({ length: 30 }, (_, i) => ({
				timestamp: new Date(Date.now() - (30 - i) * 10000).toISOString(),
				stress_level: Math.random() * 10,
			}))
		}

		try {
			// Mock - zapisz stress_history do wizyty
			await axiosInstance.patch(`/api/visits/${visitId}/`, {
				stress_history: mockStressHistory,
			})

			// Odśwież dane pacjenta
			const response = await axiosInstance.get(`/api/patients/${patientId}/full/`)
			setPatientData(response.data)
			
			// Automatycznie wybierz tę wizytę
			setSelectedVisitId(visitId)
		} catch (err) {
			console.error('Failed to save stress history:', err)
			alert('Nie udało się zapisać danych. Spróbuj ponownie.')
		}
	}

	const handleAudioUpload = async (file, visitId) => {
		// Mock upload - na razie tylko logowanie
		console.log('Mock upload nagrania audio:', { file, visitId })
		// W przyszłości tutaj będzie prawdziwy upload:
		// const formData = new FormData()
		// formData.append('audio_file', file)
		// await axiosInstance.post(`/api/visits/${visitId}/upload-audio/`, formData, {
		//   headers: { 'Content-Type': 'multipart/form-data' }
		// })
	}

	const handleAudioAnalyze = async (analysisResults, visitId) => {
		// Mock analiza nagrania - generuj stress_history na podstawie analizy
		console.log('Mock analiza nagrania:', { analysisResults, visitId })

		// Generuj mock stress_history na podstawie wyników analizy
		const numSegments = Math.floor(analysisResults.duration / 10) // Segment co 10 sekund
		const mockStressHistory = {
			summary: {
				overall_stress_value: analysisResults.stressLevel,
				stress_percentage: analysisResults.stressPercentage,
				stress_segments_count: Math.floor(numSegments * (analysisResults.stressPercentage / 100)),
			},
			segments: Array.from({ length: numSegments }, (_, i) => {
				const segmentTime = i * 10
				// Sprawdź czy to kluczowy moment
				const keyMoment = analysisResults.keyMoments?.find(
					km => Math.abs(km.time - segmentTime) < 5
				)
				return {
					timestamp: new Date(Date.now() - (numSegments - i) * 10000).toISOString(),
					stress_level: keyMoment 
						? (keyMoment.description.includes('stresu') ? 7 + Math.random() * 3 : 2 + Math.random() * 3)
						: analysisResults.stressLevel + (Math.random() - 0.5) * 2,
				}
			}),
		}

		try {
			// Zapisz stress_history do wizyty
			await axiosInstance.patch(`/api/visits/${visitId}/`, {
				stress_history: mockStressHistory,
			})

			// Odśwież dane pacjenta
			const response = await axiosInstance.get(`/api/patients/${patientId}/full/`)
			setPatientData(response.data)
			
			// Automatycznie wybierz tę wizytę
			setSelectedVisitId(visitId)
		} catch (err) {
			console.error('Failed to save stress history from audio analysis:', err)
			alert('Nie udało się zapisać wyników analizy. Spróbuj ponownie.')
		}
	}

	// Jeśli pokazujemy formularz dodawania wizyty
	if (showAddVisit) {
		return (
			<AddVisit
				patientId={patientId}
				patientName={patientData ? `${patientData.first_name} ${patientData.last_name}` : ''}
				onBack={() => setShowAddVisit(false)}
				onVisitAdded={handleVisitAdded}
			/>
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
							{patientData
								? `${patientData.first_name} ${patientData.last_name}`
								: 'Pełne Dane Pacjenta'}
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
							Szczegółowe informacje o pacjencie i historia wizyt
						</Typography>
					</Box>
				</Box>
			</Box>

			{loading && (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			)}
			{error && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
					{error}
				</Alert>
			)}

			{patientData && (
				<Grid container spacing={3}>
					{/* Lewa kolumna: Dane osobowe */}
					<Grid item xs={12} md={5}>
						<Card
							sx={{
								borderRadius: 2,
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
								height: '100%',
							}}>
							<CardContent sx={{ p: 3 }}>
								<Typography
									variant='h6'
									gutterBottom
									sx={{
										fontWeight: 700,
										color: '#4A90E2',
										mb: 3,
										display: 'flex',
										alignItems: 'center',
										gap: 1,
									}}>
									<PersonIcon />
									Dane Osobowe
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
									<Box>
										<Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
											Imię i Nazwisko
										</Typography>
										<Typography variant='body1' sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
											{patientData.first_name} {patientData.last_name}
										</Typography>
									</Box>
									<Divider />
									<Box>
										<Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
											Data urodzenia
										</Typography>
										<Typography variant='body1' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<CalendarIcon sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.54)' }} />
											{formatDate(patientData.dob)}
										</Typography>
									</Box>
									<Divider />
									<Box>
										<Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
											PESEL
										</Typography>
										<Typography variant='body1' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<BadgeIcon sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.54)' }} />
											{patientData.pesel}
										</Typography>
									</Box>
									<Divider />
									<Box>
										<Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
											Płeć
										</Typography>
										<Typography variant='body1'>
											{patientData.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}
										</Typography>
									</Box>
									{patientData.notes && (
										<>
											<Divider />
											<Box>
												<Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, fontSize: '0.875rem' }}>
													Notatki
												</Typography>
												<Typography variant='body1' sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
													<NotesIcon sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.54)', mt: 0.5 }} />
													{patientData.notes}
												</Typography>
											</Box>
										</>
									)}
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* Prawa kolumna: Historia wizyt */}
					<Grid item xs={12} md={7}>
						<Card
							sx={{
								borderRadius: 2,
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
							}}>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
									<Typography
										variant='h6'
										sx={{
											fontWeight: 700,
											color: '#4A90E2',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}>
										<CalendarIcon />
										Historia Wizyt
									</Typography>
									<Button
										variant='contained'
										onClick={() => setShowAddVisit(true)}
										sx={{
											borderRadius: 2,
											textTransform: 'none',
											fontSize: '0.9375rem',
											fontWeight: 600,
											px: 3,
											py: 1,
											backgroundColor: '#4A90E2',
											boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
											'&:hover': {
												backgroundColor: '#3A7BC8',
												boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
											},
										}}>
										+ Dodaj wizytę
									</Button>
								</Box>

								{patientData.visits && patientData.visits.length > 0 ? (
									<Box>
										<FormControl
											fullWidth
											sx={{
												mb: 3,
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
											<InputLabel id='visit-select-label'>Wybierz datę wizyty</InputLabel>
											<Select
												labelId='visit-select-label'
												id='visit-select'
												value={selectedVisitId}
												label='Wybierz datę wizyty'
												onChange={handleVisitChange}
												size="small"
												MenuProps={{
													PaperProps: {
														style: {
															maxHeight: DROPDOWN_MAX_HEIGHT,
															borderRadius: 8,
														},
													},
												}}>
												{patientData.visits
													.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
													.map(visit => (
														<MenuItem key={visit.id} value={visit.id}>
															{formatDateTime(visit.visit_date)}
														</MenuItem>
													))}
											</Select>
										</FormControl>

										{/* Szczegóły wybranej wizyty */}
										{selectedVisit && (
											<Box>
												{/* Podsumowanie stresu */}
												{selectedVisit.stress_history?.summary && (
													<Box sx={{ mb: 3 }}>
														<Grid container spacing={2}>
															<Grid item xs={12} sm={4}>
																<Paper
																	variant='outlined'
																	sx={{
																		p: 2,
																		textAlign: 'center',
																		borderRadius: 2,
																		borderColor: 'rgba(74, 144, 226, 0.3)',
																	}}>
																	<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
																		Poziom stresu
																	</Typography>
																	<Chip
																		label={getStressLevelText(selectedVisit.stress_history.summary.overall_stress_value || 0)}
																		color={getStressLevelColor(selectedVisit.stress_history.summary.overall_stress_value || 0)}
																		sx={{ fontWeight: 600 }}
																	/>
																</Paper>
															</Grid>
															<Grid item xs={12} sm={4}>
																<Paper
																	variant='outlined'
																	sx={{
																		p: 2,
																		textAlign: 'center',
																		borderRadius: 2,
																		borderColor: 'rgba(74, 144, 226, 0.3)',
																	}}>
																	<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
																		Procent stresu
																	</Typography>
																	<Typography variant='h6' sx={{ fontWeight: 700, color: '#4A90E2' }}>
																		{selectedVisit.stress_history.summary.stress_percentage?.toFixed(1) || 0}%
																	</Typography>
																</Paper>
															</Grid>
															<Grid item xs={12} sm={4}>
																<Paper
																	variant='outlined'
																	sx={{
																		p: 2,
																		textAlign: 'center',
																		borderRadius: 2,
																		borderColor: 'rgba(74, 144, 226, 0.3)',
																	}}>
																	<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
																		Segmenty stresu
																	</Typography>
																	<Typography variant='h6' sx={{ fontWeight: 700, color: '#4A90E2' }}>
																		{selectedVisit.stress_history.summary.stress_segments_count || 0}
																	</Typography>
																</Paper>
															</Grid>
														</Grid>
													</Box>
												)}

												{/* Notatki psychologa */}
												<Box sx={{ mb: 3 }}>
													<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
														<Typography
															variant='subtitle1'
															sx={{
																fontWeight: 600,
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																color: '#4A90E2',
															}}>
															<PsychologyIcon />
															Notatki psychologa
														</Typography>
														{!editingNotes && (
															<IconButton
																onClick={handleEditNotes}
																size="small"
																sx={{
																	color: '#4A90E2',
																	'&:hover': {
																		backgroundColor: 'rgba(74, 144, 226, 0.08)',
																	},
																}}>
																<EditIcon />
															</IconButton>
														)}
													</Box>
													{editingNotes ? (
														<Box>
															<TextField
																fullWidth
																multiline
																rows={6}
																value={notesValue}
																onChange={(e) => setNotesValue(e.target.value)}
																disabled={savingNotes}
																size="small"
																variant="outlined"
																sx={{
																	mb: 2,
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
															<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
																<Button
																	variant='outlined'
																	onClick={handleCancelEdit}
																	disabled={savingNotes}
																	startIcon={<CancelIcon />}
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
																<Button
																	variant='contained'
																	onClick={handleSaveNotes}
																	disabled={savingNotes}
																	startIcon={savingNotes ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
																	sx={{
																		borderRadius: 2,
																		textTransform: 'none',
																		fontSize: '0.9375rem',
																		fontWeight: 600,
																		px: 3,
																		py: 1,
																		backgroundColor: '#4A90E2',
																		boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
																		'&:hover': {
																			backgroundColor: '#3A7BC8',
																			boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
																		},
																	}}>
																	{savingNotes ? 'Zapisywanie...' : 'Zapisz'}
																</Button>
															</Box>
														</Box>
													) : (
														<Paper
															variant='outlined'
															sx={{
																p: 2.5,
																borderRadius: 2,
																borderColor: 'rgba(74, 144, 226, 0.3)',
																backgroundColor: selectedVisit.psychologist_notes 
																	? 'rgba(74, 144, 226, 0.02)' 
																	: 'transparent',
															}}>
															<Typography variant='body1' sx={{ lineHeight: 1.8 }}>
																{selectedVisit.psychologist_notes || 'Brak notatek. Kliknij ikonę edycji, aby dodać notatki.'}
															</Typography>
														</Paper>
													)}
												</Box>

												{/* Podsumowanie AI */}
												{selectedVisit.ai_summary && (
													<Box sx={{ mb: 3 }}>
														<Typography
															variant='subtitle1'
															sx={{
																fontWeight: 600,
																mb: 1.5,
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																color: '#4A90E2',
															}}>
															<SmartToyIcon />
															Podsumowanie AI
														</Typography>
														<Paper
															variant='outlined'
															sx={{
																p: 2.5,
																borderRadius: 2,
																borderColor: 'rgba(74, 144, 226, 0.3)',
																backgroundColor: 'rgba(74, 144, 226, 0.02)',
															}}>
															<Typography variant='body1' sx={{ lineHeight: 1.8 }}>
																{selectedVisit.ai_summary}
															</Typography>
														</Paper>
													</Box>
												)}

												{/* Wykres historii stresu lub wgrywanie danych z bransoletki */}
												{selectedVisit.stress_history ? (
													<Box sx={{ mb: 3 }}>
														<Typography
															variant='subtitle1'
															sx={{
																fontWeight: 600,
																mb: 2,
																color: '#4A90E2',
															}}>
															Historia stresu dla wybranej wizyty
														</Typography>
														<Paper
															variant='outlined'
															sx={{
																p: 2,
																borderRadius: 2,
																borderColor: 'rgba(74, 144, 226, 0.3)',
																display: 'flex',
																justifyContent: 'center',
																overflow: 'auto',
															}}>
															<BarChart data={selectedVisit.stress_history} />
														</Paper>
													</Box>
												) : (
													<Box sx={{ mb: 3 }}>
														<Typography
															variant='subtitle1'
															sx={{
																fontWeight: 600,
																mb: 1.5,
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																color: '#4A90E2',
															}}>
															<WatchIcon />
															Dane z bransoletki
														</Typography>
														<Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
															Brak danych o historii stresu dla tej wizyty. Wgraj dane z bransoletki, aby wygenerować analizę stresu.
														</Alert>
														<BraceletDataUpload
															visitId={selectedVisit.id}
															onUpload={handleBraceletDataUpload}
														/>
													</Box>
												)}

												{/* Nagranie audio - zawsze dostępne */}
												<Box sx={{ mb: 3 }}>
													<Typography
														variant='subtitle1'
														sx={{
															fontWeight: 600,
															mb: 1.5,
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															color: '#4A90E2',
														}}>
														<AudioIcon />
														Nagranie wizyty
													</Typography>
													<AudioUpload
														visitId={selectedVisit.id}
														onUpload={handleAudioUpload}
														onAnalyze={handleAudioAnalyze}
													/>
												</Box>
											</Box>
										)}
									</Box>
								) : (
									<Alert severity="info" sx={{ borderRadius: 2 }}>
										Brak zarejestrowanych wizyt dla tego pacjenta.
									</Alert>
								)}
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}
		</Box>
	)
}

export default PatientDetailView