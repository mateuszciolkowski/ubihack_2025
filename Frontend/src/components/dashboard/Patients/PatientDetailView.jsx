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
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { axiosInstance } from '../../../context/AuthContext'
import BarChart from './BarChart'

const DROPDOWN_MAX_HEIGHT = 250

const PatientDetailView = ({ patientId, onBack }) => {
	const [patientData, setPatientData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [selectedVisitId, setSelectedVisitId] = useState('')

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
	}

	const selectedVisit =
		patientData?.visits.find(visit => visit.id === selectedVisitId) || null

	return (
		<Paper sx={{ p: 4, width: '100%', minHeight: '85vh' }}>
			{/* Nagłówek (bez zmian) */}
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
				<IconButton onClick={onBack} aria-label='Wróć do listy'>
					<ArrowBackIcon />
				</IconButton>
				<Typography variant='h5' component='h1' sx={{ ml: 1, fontWeight: 600 }}>
					Pełne Dane Pacjenta
				</Typography>
			</Box>

			{loading && <CircularProgress />}
			{error && <Typography color='error'>{error}</Typography>}

			{patientData && (
				<Grid container spacing={3}>
					{/* Lewa kolumna: Dane osobowe (bez zmian) */}
					<Grid item xs={12} md={5}>
						<Box>
							<Typography variant='h6' gutterBottom>
								Dane Osobowe
							</Typography>
							{/* ... (dane pacjenta bez zmian) ... */}
							<Typography>
								<strong>Imię:</strong> {patientData.first_name}
							</Typography>
							<Typography>
								<strong>Nazwisko:</strong> {patientData.last_name}
							</Typography>
							<Typography>
								<strong>Data urodzenia:</strong> {patientData.dob}
							</Typography>
							<Typography>
								<strong>PESEL:</strong> {patientData.pesel}
							</Typography>
							<Typography>
								<strong>Płeć:</strong> {patientData.gender}
							</Typography>
							<Typography>
								<strong>Notatki:</strong> {patientData.notes || 'Brak'}
							</Typography>
						</Box>
					</Grid>

					{/* Prawa kolumna: Historia wizyt */}
					<Grid item xs={12} md={7}>
						<Typography variant='h6' gutterBottom>
							Historia Wizyt
						</Typography>

						{patientData.visits && patientData.visits.length > 0 ? (
							<Box>
								<FormControl fullWidth sx={{ mb: 3 }}>
									<InputLabel id='visit-select-label'>Wybierz datę wizyty</InputLabel>
									<Select
										labelId='visit-select-label'
										id='visit-select'
										value={selectedVisitId}
										label='Wybierz datę wizyty'
										onChange={handleVisitChange}
										
										MenuProps={{
											anchorOrigin: {
												vertical: 'bottom',
												horizontal: 'left',
											},
											transformOrigin: {
												vertical: 'top',
												horizontal: 'left',
											},
											getContentAnchorEl: null,
											
											PaperProps: {
												style: {
													maxHeight: DROPDOWN_MAX_HEIGHT,
												},
											},
										}}
										// ---------------------------------
									>
										<MenuItem value=''>
											<em>Wybierz...</em>
										</MenuItem>

										{patientData.visits.map(visit => (
											<MenuItem key={visit.id} value={visit.id}>
												{new Date(visit.visit_date).toLocaleString('pl-PL')}
											</MenuItem>
										))}
									</Select>
								</FormControl>

								{/* Kontener na szczegóły wybranej wizyty (bez zmian) */}
								{selectedVisit && (
									<Paper variant='outlined' sx={{ p: 2 }}>
										<Typography>
											<strong>Notatki psychologa:</strong>{' '}
											{selectedVisit.psychologist_notes || 'Brak'}
										</Typography>
										<Typography sx={{ mt: 1 }}>
											<strong>Podsumowanie AI:</strong> {selectedVisit.ai_summary || 'Brak'}
										</Typography>

										<Divider sx={{ my: 2 }} />

										<Box>
											<Typography variant='subtitle1' fontWeight={600}>
												Historia stresu dla wybranej wizyty:
											</Typography>
											{selectedVisit.stress_history &&
											selectedVisit.stress_history.length > 0 ? (
												<BarChart data={selectedVisit.stress_history} />
											) : (
												<Typography>Brak historii stresu dla tej wizyty.</Typography>
											)}
										</Box>
									</Paper>
								)}
							</Box>
						) : (
							<Typography>Brak zarejestrowanych wizyt.</Typography>
						)}
					</Grid>
				</Grid>
			)}
		</Paper>
	)
}

export default PatientDetailView