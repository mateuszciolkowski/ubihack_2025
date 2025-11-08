// src/components/dashboard/Patients/Patient/Patient.jsx
import { Paper, Box, Typography, Avatar, IconButton, Menu, MenuItem } from '@mui/material'
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
		// Używamy Paper jako "kafelka"
		<Paper
			onClick={onClick}
			elevation={3}
			sx={{
				p: { xs: 2, sm: 2.5 },
				display: 'flex',
				alignItems: 'center',
				cursor: 'pointer',
				position: 'relative',
				transition: 'box-shadow 0.3s ease, transform 0.2s ease',
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: 8,
				},
				borderRadius: 2,
				width: '100%',
				minHeight: { xs: '120px', sm: '140px' },
			}}>
			{/* Menu kontekstowe */}
			<IconButton
				onClick={handleMenuClick}
				sx={{
					position: 'absolute',
					top: 8,
					right: 8,
					'&:hover': {
						backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
				}}>
				<MenuItem onClick={handleEdit}>
					<EditIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
					Edytuj
				</MenuItem>
				<MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
					<DeleteIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
					Usuń
				</MenuItem>
			</Menu>
			{/* 1. Placeholder zdjęcia (Avatar) */}
			<Avatar
				sx={{
					width: { xs: 50, sm: 60 },
					height: { xs: 50, sm: 60 },
					mr: { xs: 1.5, sm: 2 },
					bgcolor: 'primary.light',
					flexShrink: 0,
				}}>
				<PersonIcon sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, color: 'primary.dark' }} />
			</Avatar>

			{/* 2. Informacje o pacjencie */}
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography
					variant='h6'
					component='div'
					fontWeight={600}
					sx={{
						fontSize: { xs: '1rem', sm: '1.25rem' },
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}>
					{firstName} {lastName}
				</Typography>
				<Typography 
					variant='body2' 
					color='text.secondary'
					sx={{
						fontSize: { xs: '0.75rem', sm: '0.875rem' },
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}>
					Data ur.: {dob}
				</Typography>
				<Typography 
					variant='body2' 
					color='text.secondary'
					sx={{
						fontSize: { xs: '0.75rem', sm: '0.875rem' },
					}}>
					Płeć: {genderText}
				</Typography>
			</Box>
		</Paper>
	)
}

export default Patient
