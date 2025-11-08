// src/components/dashboard/Patients/Patient/Patient.jsx
import { Card, CardContent, Box, Typography, Avatar, IconButton, Menu, MenuItem } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState } from 'react'

const Patient = ({ id, firstName, lastName, dob, gender, onClick, onEdit, onDelete }) => {
	const [anchorEl, setAnchorEl] = useState(null)
	const open = Boolean(anchorEl)

	const handleMenuClick = (event) => {
		event.stopPropagation() // Zapobiega wywołaniu onClick kafelka
		setAnchorEl(event.currentTarget)
	}

	const handleMenuClose = () => {
		setAnchorEl(null)
	}

	const handleEdit = (event) => {
		event.stopPropagation()
		handleMenuClose()
		if (onEdit) {
			onEdit(id)
		}
	}

	const handleDelete = (event) => {
		event.stopPropagation()
		handleMenuClose()
		if (onDelete) {
			onDelete(id)
		}
	}

	// Formatowanie płci dla czytelności
	const genderText = gender === 'M' ? 'Mężczyzna' : 'Kobieta'

	return (
		// Używamy Card jako "kafelka"
		<Card
			onClick={onClick}
			sx={{
				height: '100%',
				borderRadius: 3,
				border: '1px solid',
				borderColor: 'rgba(74, 144, 226, 0.12)',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
				boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				position: 'relative',
				cursor: 'pointer',
				overflow: 'hidden',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: '4px',
					background: '#4A90E2',
				},
				'&:hover': {
					transform: 'translateY(-6px)',
					boxShadow: '0 8px 30px rgba(74, 144, 226, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
					borderColor: 'rgba(74, 144, 226, 0.25)',
				},
				width: '100%',
				minHeight: { xs: '140px', sm: '160px' },
			}}>
			<CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', alignItems: 'center', position: 'relative' }}>
				{/* Menu kontekstowe */}
				<IconButton
					onClick={handleMenuClick}
					sx={{
						position: 'absolute',
						top: 8,
						right: 8,
						color: '#4A90E2',
						'&:hover': {
							backgroundColor: 'rgba(74, 144, 226, 0.08)',
						},
					}}>
					<MoreVertIcon />
				</IconButton>
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleMenuClose}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'right',
					}}
					PaperProps={{
						sx: {
							borderRadius: 2,
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						},
					}}>
					<MenuItem onClick={handleEdit} sx={{ borderRadius: 1 }}>
						<EditIcon sx={{ mr: 1, fontSize: '1.2rem', color: '#4A90E2' }} />
						Edytuj
					</MenuItem>
					<MenuItem onClick={handleDelete} sx={{ color: '#E24A4A', borderRadius: 1 }}>
						<DeleteIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
						Usuń
					</MenuItem>
				</Menu>
				{/* 1. Placeholder zdjęcia (Avatar) */}
				<Box
					sx={{
						p: 2,
						borderRadius: 2.5,
						background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
						mr: { xs: 2, sm: 2.5 },
						flexShrink: 0,
					}}>
					<Avatar
						sx={{
							width: { xs: 60, sm: 70 },
							height: { xs: 60, sm: 70 },
							bgcolor: '#4A90E2',
						}}>
						<PersonIcon sx={{ fontSize: { xs: '2.5rem', sm: '3rem' }, color: 'white' }} />
					</Avatar>
				</Box>

				{/* 2. Informacje o pacjencie */}
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography
						variant='h6'
						component='div'
						sx={{
							fontSize: { xs: '1.125rem', sm: '1.375rem' },
							fontWeight: 700,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							mb: 1,
							background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
							backgroundClip: 'text',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}>
						{firstName} {lastName}
					</Typography>
					<Typography 
						variant='body2' 
						color='text.secondary'
						sx={{
							fontSize: { xs: '0.875rem', sm: '0.9375rem' },
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							fontWeight: 500,
							mb: 0.5,
						}}>
						Data ur.: {dob}
					</Typography>
					<Typography 
						variant='body2' 
						color='text.secondary'
						sx={{
							fontSize: { xs: '0.875rem', sm: '0.9375rem' },
							fontWeight: 500,
						}}>
						Płeć: {genderText}
					</Typography>
				</Box>
			</CardContent>
		</Card>
	)
}

export default Patient
