import React from 'react'
import { Box, Grid } from '@mui/material'
import DashboardStats from '../DashboardStats/DashboardStats'
import UserInfoCard from '../UserInfoCard/UserInfoCard'
import StressTrendChart from '../StressTrendChart'
import StressClassDistribution from '../StressClassDistribution'
import StressAlerts from '../StressAlerts'

function DashboardHome({ onViewChange }) {
	return (
		<Box sx={{ pb: 3 }}>
			{/* Statystyki */}
			<DashboardStats />

			{/* Wykresy */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} md={8}>
					<StressTrendChart />
				</Grid>
				<Grid item xs={12} md={4}>
					<StressClassDistribution />
				</Grid>
			</Grid>

			{/* Alerty i informacje */}
			<Grid container spacing={3}>
				<Grid item xs={12} md={8}>
					<StressAlerts />
				</Grid>
				<Grid item xs={12} md={4}>
					<UserInfoCard onViewChange={onViewChange} />
				</Grid>
			</Grid>
		</Box>
	)
}

export default DashboardHome
