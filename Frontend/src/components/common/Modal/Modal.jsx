import React from 'react'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Box,
	Typography,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

const Modal = ({ isOpen, onClose, title, children, actions }) => {
	return (
		<Dialog
			open={isOpen}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
					maxWidth: { xs: '90%', sm: '450px' },
				},
			}}
		>
			<DialogTitle
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					pb: 1.5,
					pt: 2,
					px: 2.5,
					borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
					{title}
				</Typography>
				<IconButton
					onClick={onClose}
					aria-label="Zamknij"
					size="small"
					sx={{
						color: 'rgba(0, 0, 0, 0.54)',
						'&:hover': {
							backgroundColor: 'rgba(0, 0, 0, 0.04)',
						},
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ px: 2.5, py: 2 }}>{children}</DialogContent>
			{actions && <DialogActions sx={{ px: 2.5, pb: 2 }}>{actions}</DialogActions>}
		</Dialog>
	)
}

export default Modal

