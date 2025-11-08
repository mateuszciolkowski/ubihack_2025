import React, { useContext } from 'react'
import { Card, CardHeader, CardContent, Box, Typography, Divider, IconButton, Button } from '@mui/material'
import { MoreVert, Assessment as ReportIcon } from '@mui/icons-material'
import AuthContext from '../../../context/AuthContext'

function UserInfoCard({ onViewChange }) {
	const { user } = useContext(AuthContext)

	return (
		<Card>
			<CardHeader
				title="Informacje o koncie"
				action={
					<IconButton>
						<MoreVert />
					</IconButton>
				}
			/>
			<CardContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

					<Box>
						<Typography variant="body2" color="text.secondary">
							Email
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500 }}>
							{user?.email || 'Brak danych'}
						</Typography>
					</Box>
					<Divider />
					<Box>
						<Typography variant="body2" color="text.secondary">
							Imię i nazwisko
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500 }}>
							{user?.first_name && user?.last_name
								? `${user.first_name} ${user.last_name}`
								: 'Brak danych'}
						</Typography>
					</Box>
					<Divider />
					<Box>
						<Typography variant="body2" color="text.secondary">
							ID użytkownika
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500 }}>
							{user?.id || 'Brak danych'}
						</Typography>
					</Box>
					<Divider />
					<Button
						variant="contained"
						fullWidth
						startIcon={<ReportIcon />}
						onClick={() => onViewChange && onViewChange('report')}
						sx={{
							mt: 1,
							borderRadius: 2,
							textTransform: 'none',
							fontSize: '0.9375rem',
							fontWeight: 600,
							backgroundColor: '#4A90E2',
							boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
							'&:hover': {
								backgroundColor: '#3A7BC8',
								boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
							},
						}}>
						Zobacz mój raport
					</Button>
				</Box>
			</CardContent>
		</Card>
	)
}

export default UserInfoCard

