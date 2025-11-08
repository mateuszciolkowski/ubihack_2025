// src/components/dashboard/Patients/Patients.jsx
import React, { useState, useEffect } from 'react'
import {
	Typography,
	Box,
	CircularProgress,
	Grid, // Import komponentu Grid
} from '@mui/material'
import Patient from './Patient/Patient' // To jest teraz nasz nowy "kafelek"
import PatientDetailView from './PatientDetailView'
import { axiosInstance } from '../../../context/AuthContext'

function PatientsView() {
	const [patients, setPatients] = useState([])
	const [listLoading, setListLoading] = useState(true)
	const [selectedPatientId, setSelectedPatientId] = useState(null)

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				const response = await axiosInstance.get('/api/patients/')
				setPatients(response.data || [])
			} catch (error) {
				console.error('There was an error fetching the patients!', error)
			} finally {
				setListLoading(false)
			}
		}
		fetchPatients()
	}, [])

	// ZMODYFIKOWANA funkcja renderowania listy
	const renderListView = () => (
		<Box>
			<Typography variant='h4' component='h1' gutterBottom sx={{ fontWeight: 600 }}>
				Lista Pacjentów
			</Typography>

			{listLoading ? (
				<CircularProgress />
			) : patients.length > 0 ? (
				// --- ZMIANA: Używamy Grid container ---
				// 'spacing={3}' dodaje odstępy między kafelkami
				<Grid container spacing={3}>
					{patients.map(patient => (
						// Każdy kafelek jest elementem siatki
						// Ustawiamy responsywność:
						// lg={3} = 4 kolumny na dużych ekranach
						// md={4} = 3 kolumny na średnich
						// sm={6} = 2 kolumny na małych
						// xs={12} = 1 kolumna na mobilnych
						<Grid item key={patient.id} xs={12} sm={8} md={6} lg={4}>
							<Patient
								firstName={patient.first_name}
								lastName={patient.last_name}
								dob={patient.dob}
								gender={patient.gender}
								onClick={() => setSelectedPatientId(patient.id)}
							/>
						</Grid>
					))}
				</Grid>
			) : (
				<Typography variant='body1' color='text.secondary'>
					Nie znaleziono pacjentów.
				</Typography>
			)}
		</Box>
	)

	// Widok szczegółowy (bez zmian)
	const renderDetailView = () => (
		<PatientDetailView patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
	)

	// Logika przełączania widoków (bez zmian)
	return <Box sx={{ width: '100%' }}>{selectedPatientId === null ? renderListView() : renderDetailView()}</Box>
}

export default PatientsView
