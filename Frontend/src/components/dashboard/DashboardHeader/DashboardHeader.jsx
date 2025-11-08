import React, { useState, useContext } from 'react'
import {
	AppBar,
	Toolbar,
	Typography,
	IconButton,
	Avatar,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Box,
	Divider,
} from '@mui/material'
import { Menu as MenuIcon, Logout as LogoutIcon, AccountCircle, Settings as SettingsIcon, Notifications as NotificationsIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import AuthContext from '../../../context/AuthContext'

const drawerWidth = 240

function DashboardHeader({ onMenuClick, onViewChange }) {
	const theme = useTheme()
	const { user, logoutUser } = useContext(AuthContext)
	const [anchorEl, setAnchorEl] = useState(null)

	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget)
	}

	const handleMenuClose = () => {
		setAnchorEl(null)
	}

	const handleLogout = () => {
		handleMenuClose()
		logoutUser()
	}

	const handleProfileClick = () => {
		handleMenuClose()
		if (onViewChange) {
			onViewChange('profile')
		}
	}

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				width: '100%',
				left: 0,
				right: 0,
				zIndex: theme.zIndex.drawer - 1,
				backgroundColor: '#ffffff',
				borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
			}}
		>
			<Toolbar
				sx={{
					minHeight: '80px !important',
					px: { xs: 2, sm: 3 },
					py: 2,
					maxWidth: { md: `calc(100% - ${drawerWidth}px)` },
					marginLeft: { md: `${drawerWidth}px` },
					marginRight: { md: 0 },
				}}
			>
				<IconButton
					aria-label="open drawer"
					edge="start"
					onClick={onMenuClick}
					sx={{ 
						mr: 2, 
						display: { md: 'none' },
						color: 'rgba(0, 0, 0, 0.7)',
						'&:hover': {
							backgroundColor: 'rgba(0, 0, 0, 0.04)',
						},
					}}
				>
					<MenuIcon />
				</IconButton>
				<Typography 
					variant="h6" 
					noWrap 
					component="div" 
					sx={{ 
						flexGrow: 1,
						color: 'rgba(0, 0, 0, 0.87)',
						fontWeight: 600,
						fontSize: '1.125rem',
					}}
				>
					Witaj, {user?.first_name || user?.email || 'Użytkowniku'}!
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<IconButton 
						sx={{
							color: 'rgba(0, 0, 0, 0.7)',
							'&:hover': {
								backgroundColor: 'rgba(0, 0, 0, 0.04)',
							},
						}}
					>
						<NotificationsIcon />
					</IconButton>
					<IconButton 
						onClick={handleMenuOpen}
						sx={{
							p: 0.5,
							'&:hover': {
								backgroundColor: 'transparent',
							},
						}}
					>
						<Avatar 
							sx={{ 
								width: 36, 
								height: 36, 
								bgcolor: 'primary.main',
								fontWeight: 600,
								fontSize: '0.875rem',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							}}
						>
							{user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
						</Avatar>
					</IconButton>
					<Menu
						anchorEl={anchorEl}
						open={Boolean(anchorEl)}
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
							elevation: 8,
							sx: {
								mt: 1.5,
								minWidth: 200,
								borderRadius: 2,
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								'& .MuiMenuItem-root': {
									px: 2,
									py: 1.5,
									'&:hover': {
										backgroundColor: 'rgba(0, 0, 0, 0.04)',
									},
								},
							},
						}}
					>
						<MenuItem onClick={handleProfileClick}>
							<ListItemIcon>
								<AccountCircle fontSize="small" />
							</ListItemIcon>
							<ListItemText>Profil</ListItemText>
						</MenuItem>
						<MenuItem onClick={handleMenuClose}>
							<ListItemIcon>
								<SettingsIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Ustawienia</ListItemText>
						</MenuItem>
						<Divider />
						<MenuItem onClick={handleLogout}>
							<ListItemIcon>
								<LogoutIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Wyloguj</ListItemText>
						</MenuItem>
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	)
}

export default DashboardHeader

