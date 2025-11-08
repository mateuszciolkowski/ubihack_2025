import React from 'react'
import { Card, CardContent, Box, Typography, Chip } from '@mui/material'

function StatCard({ title, value, change, icon, color }) {
	// Mapowanie kolorów do gradientów
	const colorGradients = {
		primary: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%)',
		success: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
		info: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
		warning: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
	}

	const iconColors = {
		primary: '#4A90E2',
		success: '#4CAF50',
		info: '#2196F3',
		warning: '#FF9800',
	}

	return (
		<Card
			sx={{
				height: '100%',
				borderRadius: 3,
				border: '1px solid',
				borderColor: 'rgba(74, 144, 226, 0.12)',
				background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
				boxShadow: '0 4px 20px rgba(74, 144, 226, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				position: 'relative',
				overflow: 'hidden',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: '4px',
					background: iconColors[color] || iconColors.primary,
				},
				'&:hover': {
					transform: 'translateY(-6px)',
					boxShadow: '0 8px 30px rgba(74, 144, 226, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
					borderColor: 'rgba(74, 144, 226, 0.25)',
				},
			}}
		>
			<CardContent sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
					<Box sx={{ flex: 1 }}>
						<Typography 
							color="text.secondary" 
							variant="body2" 
							gutterBottom
							sx={{
								fontSize: '0.8125rem',
								fontWeight: 600,
								textTransform: 'uppercase',
								letterSpacing: '0.5px',
								mb: 1.5,
							}}
						>
							{title}
						</Typography>
						<Typography 
							variant="h4" 
							component="div" 
							sx={{ 
								fontWeight: 800,
								background: `linear-gradient(135deg, ${iconColors[color] || iconColors.primary} 0%, ${iconColors[color] || iconColors.primary}dd 100%)`,
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								lineHeight: 1.2,
							}}
						>
							{value}
						</Typography>
					</Box>
					<Box
						sx={{
							p: 2,
							borderRadius: 2.5,
							background: colorGradients[color] || colorGradients.primary,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
							transition: 'all 0.3s ease',
							'&:hover': {
								transform: 'scale(1.1) rotate(5deg)',
							},
						}}
					>
						{React.cloneElement(icon, { 
							sx: { 
								fontSize: '2rem',
								color: iconColors[color] || iconColors.primary,
							} 
						})}
					</Box>
				</Box>
				{change && (
					<Chip
						label={change}
						size="small"
						color={change.startsWith('+') ? 'success' : change.startsWith('-') ? 'error' : 'default'}
						sx={{ 
							fontSize: '0.75rem',
							fontWeight: 600,
							mt: 1,
						}}
					/>
				)}
			</CardContent>
		</Card>
	)
}

export default StatCard

