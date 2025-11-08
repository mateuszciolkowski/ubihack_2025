// src/components/dashboard/Patients/Patient/Patient.jsx
import { Paper, Box, Typography, Avatar } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person' // Import ikony-placeholdera

const Patient = ({ firstName, lastName, dob, gender, onClick }) => {
	// Formatowanie płci dla czytelności
	const genderText = gender === 'M' ? 'Mężczyzna' : 'Kobieta'

	return (
		// Używamy Paper jako "kafelka"
		<Paper
			onClick={onClick}
			elevation={3} // Domyślny cień dający "przestrzenność"
			sx={{
				p: 2.5, // Wewnętrzny padding, aby kafelek był większy
				display: 'flex',
				alignItems: 'center',
				cursor: 'pointer',
				transition: 'box-shadow 0.3s ease, transform 0.2s ease',
				'&:hover': {
					transform: 'translateY(-4px)', // Efekt lekkiego uniesienia
					boxShadow: 8, // Mocniejszy cień po najechaniu
				},
				borderRadius: 2, // Łagodniejsze rogi
				width: '100%', // Kafelek wypełni swoją kolumnę w siatce
			}}>
			{/* 1. Placeholder zdjęcia (Avatar) */}
			<Avatar
				sx={{
					width: 60, // Większe zdjęcie
					height: 60,
					mr: 2, // Margines z prawej
					bgcolor: 'primary.light', // Tło avatara
				}}>
				<PersonIcon sx={{ fontSize: '2.5rem', color: 'primary.dark' }} />
			</Avatar>

			{/* 2. Informacje o pacjencie */}
			<Box>
				<Typography
					variant='h6'
					component='div'
					fontWeight={600}
					noWrap // Zapobiega łamaniu linii
				>
					{firstName} {lastName}
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Data ur.: {dob}
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Płeć: {genderText}
				</Typography>
			</Box>
		</Paper>
	)
}

export default Patient
