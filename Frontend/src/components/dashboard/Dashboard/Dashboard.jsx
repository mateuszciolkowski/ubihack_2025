import React, { useState } from 'react'
import { Box, Container, useTheme } from '@mui/material'
import DashboardHeader from '../DashboardHeader/DashboardHeader'
import DashboardSidebar, { drawerWidth } from '../DashboardSidebar/DashboardSidebar'

// Importuj nowe komponenty stron
import DashboardHome from '../DashboardHome/DashboardHome'
import Patients from '../Patients/PatientsView'
import Calendar from '../Calendar/Calendar'
import UserProfile from '../UserProfile/UserProfile'

function Dashboard() {
	const theme = useTheme()
	const [mobileOpen, setMobileOpen] = useState(false)

	// === KROK 1: Dodaj stan do śledzenia aktywnego widoku ===
	const [currentView, setCurrentView] = useState('dashboard') // Domyślny widok

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen)
	}

	// === KROK 2: Funkcja do renderowania odpowiedniego widoku ===
	const renderView = () => {
		switch (currentView) {
			case 'dashboard':
				return <DashboardHome />
			case 'patients':
				return <Patients />
			case 'calendar':
				return <Calendar />
			case 'profile':
				return <UserProfile />
			default:
				return <DashboardHome />
		}
	}

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh' }}>
			<DashboardHeader onMenuClick={handleDrawerToggle} onViewChange={setCurrentView} />

			{/* === KROK 3: Przekaż stan i funkcję do Sidebar === */}
			<DashboardSidebar
				mobileOpen={mobileOpen}
				onMobileClose={handleDrawerToggle}
				currentView={currentView} // Przekaż aktualny widok
				onViewChange={setCurrentView} // Przekaż funkcję do zmiany widoku
			/>

			<Box
				component='main'
				sx={{
					flexGrow: 1,
					p: 3,
					width: { md: `calc(100% - ${drawerWidth}px)` },
					mt: 8,
					backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
					minHeight: '100vh',
				}}>
				<Container maxWidth='xl'>
					{/* === KROK 4: Renderuj widok dynamicznie === */}
					{renderView()}
				</Container>
			</Box>
		</Box>
	)
}

export default Dashboard
