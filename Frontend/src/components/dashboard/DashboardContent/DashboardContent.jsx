import React from 'react'
import { Container, Grid } from '@mui/material'
import PageHeader from '../PageHeader'
import DashboardStats from '../DashboardStats'
import UserInfoCard from '../UserInfoCard'
import QuickActionsCard from '../QuickActionsCard'

function DashboardContent() {
	return (
		<Container maxWidth="xl">

			<DashboardStats />

			<Grid container spacing={3}>
				<Grid item xs={12} md={8}>
					<UserInfoCard />
				</Grid>
				<Grid item xs={12} md={4}>
					<QuickActionsCard />
				</Grid>
			</Grid>
		</Container>
	)
}

export default DashboardContent

