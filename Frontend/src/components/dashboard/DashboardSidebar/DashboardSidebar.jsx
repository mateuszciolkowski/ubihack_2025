// Plik: Frontend/src/components/dashboard/DashboardSidebar/DashboardSidebar.jsx
import React from 'react'
import {
	Box,
	Drawer,
	Toolbar,
	Typography,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Divider,
} from '@mui/material'
// Importuj ikony, których potrzebujesz
import { Dashboard as DashboardIcon, People, CalendarToday, PersonAdd as PersonAddIcon, Assessment as ReportIcon } from '@mui/icons-material'

const drawerWidth = 240

// 1. Komponent przyjmuje propsy `currentView` i `onViewChange` od rodzica (Dashboard.jsx)
function DashboardSidebar({ mobileOpen, onMobileClose, currentView, onViewChange }) {
	// === ZAKTUALIZOWANA LISTA MENU ===
	// Upewnij się, że wartości 'view' pasują do tych w Dashboard.jsx
	const menuItems = [
		{
			text: 'Dashboard',
			icon: <DashboardIcon />,
			view: 'dashboard',
		},
		{
			text: 'Pacjenci',
			icon: <People />,
			view: 'patients',
		},
		{
			text: 'Dodaj pacjenta',
			icon: <PersonAddIcon />,
			view: 'add-patient',
		},
		{
			text: 'Kalendarz',
			icon: <CalendarToday />,
			view: 'calendar',
		},
		{
			text: 'Raporty',
			icon: <ReportIcon />,
			view: 'report',
		},
	]

	const drawer = (
		<Box>
			<Toolbar
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					px: [2],
					py: [1],
				}}>
				<Typography variant='h6' noWrap component='div' sx={{ fontWeight: 600 }}>
					Dashboard
				</Typography>
			</Toolbar>
			<Divider />

			<List>
				{menuItems.map(item => (
					<ListItem key={item.text} disablePadding>
						<ListItemButton
							// 2. Podświetl aktywny element
							selected={currentView === item.view}
							// 3. Po kliknięciu, wywołaj funkcję od rodzica z nową wartością 'view'
							onClick={() => onViewChange(item.view)}>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Box>
	)

	return (
		<Box component='nav' sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label='navigation'>
			<Drawer
				variant='temporary'
				open={mobileOpen}
				onClose={onMobileClose}
				ModalProps={{
					keepMounted: true,
				}}
				sx={{
					display: { xs: 'block', md: 'none' },
					'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
				}}>
				{drawer}
			</Drawer>
			<Drawer
				variant='permanent'
				sx={{
					display: { xs: 'none', md: 'block' },
					'& .MuiDrawer-paper': {
						boxSizing: 'border-box',
						width: drawerWidth,
						zIndex: 1200,
					},
				}}
				open>
				{drawer}
			</Drawer>
		</Box>
	)
}

export { drawerWidth }
export default DashboardSidebar
