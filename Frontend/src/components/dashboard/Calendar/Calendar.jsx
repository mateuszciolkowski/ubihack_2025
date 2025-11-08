// src/components/dashboard/UsersPage.jsx
import React from 'react'
import { Typography, Box, Card, CardContent } from '@mui/material'
import { CalendarToday as CalendarIcon } from '@mui/icons-material'

function Calendar() {
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
							Kalendarz
						</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
							Tutaj będziesz zarządzać wizytami
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Placeholder Card */}
			<Card
				sx={{
					borderRadius: 3,
					border: '1px solid',
					borderColor: 'rgba(74, 144, 226, 0.12)',
					background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
					boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
				}}>
				<CardContent sx={{ p: 4, textAlign: 'center' }}>
					<CalendarIcon sx={{ fontSize: 64, color: '#4A90E2', mb: 2, opacity: 0.5 }} />
					<Typography variant='h6' sx={{ fontWeight: 600, color: '#4A90E2', mb: 1 }}>
						Kalendarz wizyt
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						Funkcjonalność kalendarza będzie dostępna wkrótce
					</Typography>
				</CardContent>
			</Card>
		</Box>
	)
}

export default Calendar
