import React from 'react'
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

function AddPatientCard({ onClick }) {
	return (
		<Card
			onClick={onClick}
			sx={{
				height: '100%',
				borderRadius: 3,
				border: '2px dashed',
				borderColor: 'rgba(74, 144, 226, 0.3)',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
				boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				cursor: 'pointer',
				position: 'relative',
				overflow: 'hidden',
				'&:hover': {
					transform: 'translateY(-6px)',
					boxShadow: '0 8px 30px rgba(74, 144, 226, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
					borderColor: 'rgba(74, 144, 226, 0.5)',
					background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
				},
				width: '100%',
				minHeight: { xs: '140px', sm: '160px' },
			}}>
			<CardContent
				sx={{
					p: { xs: 2.5, sm: 3 },
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
				}}>
				<Box
					sx={{
						p: 2,
						borderRadius: 2.5,
						background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
						mb: { xs: 1, sm: 1.5 },
						transition: 'all 0.3s ease',
						'&:hover': {
							transform: 'scale(1.1) rotate(5deg)',
						},
					}}>
					<Avatar
						sx={{
							width: { xs: 60, sm: 70 },
							height: { xs: 60, sm: 70 },
							bgcolor: '#4A90E2',
						}}>
						<AddIcon sx={{ fontSize: { xs: '2.5rem', sm: '3rem' }, color: 'white' }} />
					</Avatar>
				</Box>
				<Typography 
					variant='h6' 
					component='div' 
					sx={{
						fontSize: { xs: '1.125rem', sm: '1.375rem' },
						fontWeight: 700,
						textAlign: 'center',
						background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
					}}>
					Dodaj pacjenta
				</Typography>
			</CardContent>
		</Card>
	)
}

export default AddPatientCard

