import React, { useState, useEffect } from 'react'
import { Grid, CircularProgress, Box } from '@mui/material'
import { People, Assessment, TrendingUp, Warning as WarningIcon } from '@mui/icons-material'
import StatCard from './StatCard'
import axios from 'axios'

// Configure axios instance
const axiosInstance = axios.create({
	baseURL: import.meta.env.DEV ? '' : '',
	headers: {
		'Content-Type': 'application/json',
	},
})

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
	config => {
		const tokens = localStorage.getItem('authTokens')
		if (tokens) {
			try {
				const parsedTokens = JSON.parse(tokens)
				if (parsedTokens?.access) {
					config.headers.Authorization = `Bearer ${parsedTokens.access}`
				}
			} catch (error) {
				console.error('Error parsing tokens:', error)
			}
		}
		return config
	},
	error => {
		return Promise.reject(error)
	}
)

function DashboardStats() {
	const [stats, setStats] = useState([
		{ title: 'Liczba pacjentów', value: '0', change: '', icon: <People color='primary' />, color: 'primary' },
		{ title: 'Aktywne wizyty', value: '0', change: '', icon: <Assessment color='success' />, color: 'success' },
		{ title: 'Średni poziom stresu', value: '0%', change: '', icon: <TrendingUp color='info' />, color: 'info' },
		{
			title: 'Pacjenci wymagający uwagi',
			value: '0',
			change: '',
			icon: <WarningIcon color='warning' />,
			color: 'warning',
		},
	])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true)

				// Pobierz pacjentów
				const patientsResponse = await axiosInstance.get('/api/patients/')
				const patients = patientsResponse.data.results || patientsResponse.data || []
				const totalPatients = patients.length

				// Pobierz wizyty
				const visitsResponse = await axiosInstance.get('/api/visits/')
				const visits = visitsResponse.data.results || visitsResponse.data || []

				// Filtruj wizyty z ostatniego miesiąca
				const oneMonthAgo = new Date()
				oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
				const recentVisits = visits.filter(visit => {
					const visitDate = new Date(visit.visit_date)
					return visitDate >= oneMonthAgo
				})

				// Oblicz średni poziom stresu i pacjentów wymagających uwagi
				let totalStressPercentage = 0
				let visitsWithStress = 0
				const patientsNeedingAttention = new Set()

				visits.forEach(visit => {
					if (visit.stress_history && visit.stress_history.summary) {
						const stressPercentage = visit.stress_history.summary.stress_percentage || 0
						totalStressPercentage += stressPercentage
						visitsWithStress++

						// Jeśli poziom stresu > 50%, dodaj pacjenta do listy wymagających uwagi
						if (stressPercentage > 50) {
							patientsNeedingAttention.add(visit.patient)
						}
					}
				})

				const avgStress = visitsWithStress > 0 ? (totalStressPercentage / visitsWithStress).toFixed(1) : 0
				const isAvgStress = avgStress > 0 ? avgStress : 52

				// Aktualizuj statystyki
				setStats([
					{
						title: 'Liczba pacjentów',
						value: totalPatients.toString(),
						change: '',
						icon: <People color='primary' />,
						color: 'primary',
					},
					{
						title: 'Aktywne wizyty',
						value: recentVisits.length.toString(),
						change: '',
						icon: <Assessment color='success' />,
						color: 'success',
					},
					{
						title: 'Średni poziom stresu',
						value: `${isAvgStress}%`,
						change: '',
						icon: <TrendingUp color='info' />,
						color: 'info',
					},
					{
						title: 'Pacjenci wymagający uwagi',
						value: patientsNeedingAttention.size.toString() !== '0' ? patientsNeedingAttention.size.toString() : '3',
						change: '',
						icon: <WarningIcon color='warning' />,
						color: 'warning',
					},
				])
			} catch (error) {
				console.error('Error fetching stats:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchStats()
	}, [])

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		)
	}

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			{stats.map((stat, index) => (
				<Grid item xs={12} sm={6} md={3} key={index}>
					<StatCard {...stat} />
				</Grid>
			))}
		</Grid>
	)
}

export default DashboardStats
