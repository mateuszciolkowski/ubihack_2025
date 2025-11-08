import React, { useContext } from 'react'
import { Card, CardHeader, CardContent, Box, Typography, Divider, IconButton, Button } from '@mui/material'
import { MoreVert, Assessment as ReportIcon, Email, Person, Badge } from '@mui/icons-material'
import AuthContext from '../../../context/AuthContext'

function UserInfoCard({ onViewChange }) {
	const { user } = useContext(AuthContext)

	return (
		<Card
			sx={{
				borderRadius: 3,
				border: '1px solid',
				borderColor: 'rgba(74, 144, 226, 0.12)',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
				boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
			}}
		>
			<CardHeader
				title="Informacje o koncie"
				action={
					<IconButton
						sx={{
							color: '#4A90E2',
							'&:hover': {
								backgroundColor: 'rgba(74, 144, 226, 0.08)',
							},
						}}
					>
						<MoreVert />
					</IconButton>
				}
				sx={{
					'& .MuiCardHeader-title': {
						fontWeight: 700,
						fontSize: '1.25rem',
						background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
					},
				}}
			/>
			<CardContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					<Box
						sx={{
							p: 2,
							borderRadius: 2,
							mb: 1.5,
							background: 'rgba(74, 144, 226, 0.03)',
							border: '1px solid',
							borderColor: 'rgba(74, 144, 226, 0.1)',
							transition: 'all 0.2s ease',
							'&:hover': {
								background: 'rgba(74, 144, 226, 0.05)',
								borderColor: 'rgba(74, 144, 226, 0.2)',
							},
						}}
					>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
							Email
						</Typography>
						<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
							<Email sx={{ fontSize: '1.2rem', color: '#4A90E2' }} />
							{user?.email || 'Brak danych'}
						</Typography>
					</Box>
					<Box
						sx={{
							p: 2,
							borderRadius: 2,
							mb: 1.5,
							background: 'rgba(74, 144, 226, 0.03)',
							border: '1px solid',
							borderColor: 'rgba(74, 144, 226, 0.1)',
							transition: 'all 0.2s ease',
							'&:hover': {
								background: 'rgba(74, 144, 226, 0.05)',
								borderColor: 'rgba(74, 144, 226, 0.2)',
							},
						}}
					>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
							Imię i nazwisko
						</Typography>
						<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
							<Person sx={{ fontSize: '1.2rem', color: '#4A90E2' }} />
							{user?.first_name && user?.last_name
								? `${user.first_name} ${user.last_name}`
								: 'Brak danych'}
						</Typography>
					</Box>
					<Box
						sx={{
							p: 2,
							borderRadius: 2,
							mb: 1.5,
							background: 'rgba(74, 144, 226, 0.03)',
							border: '1px solid',
							borderColor: 'rgba(74, 144, 226, 0.1)',
							transition: 'all 0.2s ease',
							'&:hover': {
								background: 'rgba(74, 144, 226, 0.05)',
								borderColor: 'rgba(74, 144, 226, 0.2)',
							},
						}}
					>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
							ID użytkownika
						</Typography>
						<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
							<Badge sx={{ fontSize: '1.2rem', color: '#4A90E2' }} />
							{user?.id || 'Brak danych'}
						</Typography>
					</Box>
					<Button
						variant="contained"
						fullWidth
						startIcon={<ReportIcon />}
						onClick={() => onViewChange && onViewChange('report')}
						sx={{
							mt: 2,
							borderRadius: 2.5,
							textTransform: 'none',
							fontSize: '0.9375rem',
							fontWeight: 700,
							py: 1.5,
							backgroundColor: '#4A90E2',
							boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
							background: 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)',
							'&:hover': {
								backgroundColor: '#3A7BC8',
								boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
								transform: 'translateY(-2px)',
							},
							transition: 'all 0.3s ease',
						}}>
						Zobacz mój raport
					</Button>
				</Box>
			</CardContent>
		</Card>
	)
}

export default UserInfoCard

