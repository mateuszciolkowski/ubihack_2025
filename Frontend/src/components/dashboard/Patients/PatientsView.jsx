// src/components/dashboard/Patients/Patients.jsx
import React, { useState, useEffect } from 'react'
import {
	Typography,
	Box,
	CircularProgress,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
} from '@mui/material'
import Patient from './Patient/Patient'
import AddPatientCard from './AddPatientCard'
import PatientDetailView from './PatientDetailView'
import EditPatient from './EditPatient'
import { axiosInstance } from '../../../context/AuthContext'

function PatientsView({ onViewChange }) {
	const [patients, setPatients] = useState([])
	const [listLoading, setListLoading] = useState(true)
	const [selectedPatientId, setSelectedPatientId] = useState(null)
	const [editingPatientId, setEditingPatientId] = useState(null)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [patientToDelete, setPatientToDelete] = useState(null)
	const [deleting, setDeleting] = useState(false)

	const fetchPatients = async () => {
		try {
			setListLoading(true)
			const response = await axiosInstance.get('/api/patients/')
			setPatients(response.data.results || response.data || [])
		} catch (error) {
			console.error('There was an error fetching the patients!', error)
		} finally {
			setListLoading(false)
		}
	}

	useEffect(() => {
		fetchPatients()
	}, [])

	const handleEdit = (patientId) => {
		setEditingPatientId(patientId)
		setSelectedPatientId(null)
	}

	const handleDeleteClick = (patientId) => {
		const patient = patients.find(p => p.id === patientId)
		setPatientToDelete({ id: patientId, name: patient ? `${patient.first_name} ${patient.last_name}` : '' })
		setDeleteDialogOpen(true)
	}

	const handleDeleteConfirm = async () => {
		if (!patientToDelete) return

		try {
			setDeleting(true)
			await axiosInstance.delete(`/api/patients/${patientToDelete.id}/`)
			await fetchPatients() // Odśwież listę
			setDeleteDialogOpen(false)
			setPatientToDelete(null)
		} catch (error) {
			console.error('Error deleting patient:', error)
			alert('Nie udało się usunąć pacjenta. Spróbuj ponownie.')
		} finally {
			setDeleting(false)
		}
	}

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false)
		setPatientToDelete(null)
	}

	const handlePatientUpdated = () => {
		fetchPatients() // Odśwież listę po edycji
		setEditingPatientId(null)
	}

	// ZMODYFIKOWANA funkcja renderowania listy
	const renderListView = () => (
		<Box>
			<Typography variant='h4' component='h1' gutterBottom sx={{ fontWeight: 600 }}>
				Lista Pacjentów
			</Typography>

			{listLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={{ xs: 2, sm: 3 }}>
					{/* Kafelek dodawania pacjenta - zawsze pierwszy */}
					{onViewChange && (
						<Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
							<AddPatientCard onClick={() => onViewChange('add-patient')} />
						</Grid>
					)}
					{/* Lista pacjentów */}
					{patients.map(patient => (
						<Grid item key={patient.id} xs={12} sm={6} md={4} lg={3} xl={2}>
							<Patient
								id={patient.id}
								firstName={patient.first_name}
								lastName={patient.last_name}
								dob={patient.dob}
								gender={patient.gender}
								onClick={() => setSelectedPatientId(patient.id)}
								onEdit={handleEdit}
								onDelete={handleDeleteClick}
							/>
						</Grid>
					))}
				</Grid>
			)}
		</Box>
	)

	// Widok szczegółowy
	const renderDetailView = () => (
		<PatientDetailView patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
	)

	// Widok edycji
	const renderEditView = () => (
		<EditPatient
			patientId={editingPatientId}
			onBack={() => setEditingPatientId(null)}
			onPatientUpdated={handlePatientUpdated}
		/>
	)

	// Logika przełączania widoków
	if (editingPatientId) {
		return <Box sx={{ width: '100%' }}>{renderEditView()}</Box>
	}

	return (
		<Box sx={{ width: '100%' }}>
			{selectedPatientId === null ? renderListView() : renderDetailView()}
			
			{/* Dialog potwierdzenia usunięcia */}
			<Dialog
				open={deleteDialogOpen}
				onClose={handleDeleteCancel}
				PaperProps={{
					sx: {
						borderRadius: 2,
					},
				}}>
				<DialogTitle sx={{ fontWeight: 600, color: '#E24A4A' }}>
					Potwierdź usunięcie
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Czy na pewno chcesz usunąć pacjenta <strong>{patientToDelete?.name}</strong>?
						<br />
						<br />
						Ta operacja jest nieodwracalna i usunie również wszystkie powiązane wizyty.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleDeleteCancel}
						disabled={deleting}
						sx={{
							borderRadius: 2,
							textTransform: 'none',
							fontWeight: 600,
						}}>
						Anuluj
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						disabled={deleting}
						variant="contained"
						color="error"
						sx={{
							borderRadius: 2,
							textTransform: 'none',
							fontWeight: 600,
							backgroundColor: '#E24A4A',
							'&:hover': {
								backgroundColor: '#C62828',
							},
						}}>
						{deleting ? 'Usuwanie...' : 'Usuń'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default PatientsView
