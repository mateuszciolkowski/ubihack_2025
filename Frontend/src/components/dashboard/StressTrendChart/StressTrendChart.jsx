import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, Box, CircularProgress, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import * as d3 from 'd3'

function StressTrendChart() {
	const svgRef = useRef(null)
	const [chartData, setChartData] = useState([])
	const [loading, setLoading] = useState(true)
	const [infoDialogOpen, setInfoDialogOpen] = useState(false)

	useEffect(() => {
		const generateMockData = () => {
			setLoading(true)
			
			// Generuj mock dane dla ostatnich 8 tygodni
			const chartDataArray = []
			const today = new Date()
			
			for (let i = 7; i >= 0; i--) {
				const weekStart = new Date(today)
				weekStart.setDate(today.getDate() - (i * 7))
				weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Początek tygodnia (niedziela)
				weekStart.setHours(0, 0, 0, 0)
				
				// Generuj realistyczny poziom stresu z trendem (lekki spadek w czasie)
				// Bazowy poziom: 45-65%, z lekkim trendem spadkowym
				const baseStress = 55 - (i * 1.5) // Trend spadkowy
				const variation = (Math.random() - 0.5) * 15 // Wariacja ±7.5%
				const stressLevel = Math.max(20, Math.min(80, baseStress + variation))
				
				chartDataArray.push({
					date: new Date(weekStart),
					dateLabel: weekStart.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
					stressLevel: parseFloat(stressLevel.toFixed(1)),
				})
			}
			
			setChartData(chartDataArray)
			setLoading(false)
		}

		generateMockData()
	}, [])

	useEffect(() => {
		if (loading || chartData.length === 0 || !svgRef.current) return

		// Wyczyść poprzedni wykres
		d3.select(svgRef.current).selectAll('*').remove()

		const margin = { top: 20, right: 30, bottom: 40, left: 50 }
		const width = 600 - margin.left - margin.right
		const height = 300 - margin.top - margin.bottom

		const svg = d3
			.select(svgRef.current)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)

		const g = svg
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)

		// Skale
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(chartData, d => d.date))
			.range([0, width])

		const maxStress = d3.max(chartData, d => d.stressLevel) || 100
		const minStress = d3.min(chartData, d => d.stressLevel) || 0
		const yScale = d3
			.scaleLinear()
			.domain([Math.max(0, minStress - 10), Math.min(100, maxStress + 10)])
			.nice()
			.range([height, 0])

		// Oblicz linię trendu (regresja liniowa)
		const n = chartData.length
		const sumX = chartData.reduce((sum, d, i) => sum + i, 0)
		const sumY = chartData.reduce((sum, d) => sum + d.stressLevel, 0)
		const sumXY = chartData.reduce((sum, d, i) => sum + i * d.stressLevel, 0)
		const sumX2 = chartData.reduce((sum, d, i) => sum + i * i, 0)
		
		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
		const intercept = (sumY - slope * sumX) / n
		
		const trendLine = chartData.map((d, i) => ({
			date: d.date,
			stressLevel: intercept + slope * i,
		}))

		// Definicje gradientów
		const defs = svg.append('defs')
		
		// Gradient dla linii danych
		const lineGradient = defs.append('linearGradient')
			.attr('id', 'lineGradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%')
		lineGradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', '#6BA3F5')
			.attr('stop-opacity', 1)
		lineGradient.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', '#4A90E2')
			.attr('stop-opacity', 1)

		// Gradient dla obszaru pod linią
		const areaGradient = defs.append('linearGradient')
			.attr('id', 'areaGradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%')
		areaGradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', '#4A90E2')
			.attr('stop-opacity', 0.3)
		areaGradient.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', '#4A90E2')
			.attr('stop-opacity', 0.05)

		// Linia danych
		const line = d3
			.line()
			.x(d => xScale(d.date))
			.y(d => yScale(d.stressLevel))
			.curve(d3.curveMonotoneX)

		// Obszar pod linią
		const area = d3
			.area()
			.x(d => xScale(d.date))
			.y0(height)
			.y1(d => yScale(d.stressLevel))
			.curve(d3.curveMonotoneX)

		// Linia trendu
		const trendLineGenerator = d3
			.line()
			.x(d => xScale(d.date))
			.y(d => yScale(d.stressLevel))

		// Rysuj obszar pod linią (z gradientem)
		g.append('path')
			.datum(chartData)
			.attr('fill', 'url(#areaGradient)')
			.attr('d', area)
			.attr('opacity', 0)
			.transition()
			.duration(1000)
			.attr('opacity', 1)

		// Rysuj linię danych (z gradientem i animacją)
		const path = g.append('path')
			.datum(chartData)
			.attr('fill', 'none')
			.attr('stroke', 'url(#lineGradient)')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
			.attr('stroke-linejoin', 'round')
			.attr('d', line)
			.attr('opacity', 0)

		// Animacja rysowania linii
		const totalLength = path.node().getTotalLength()
		path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
			.attr('stroke-dashoffset', totalLength)
			.transition()
			.duration(1500)
			.ease(d3.easeCubicInOut)
			.attr('stroke-dashoffset', 0)
			.attr('opacity', 1)

		// Rysuj linię trendu (przerywaną z animacją)
		const trendPath = g.append('path')
			.datum(trendLine)
			.attr('fill', 'none')
			.attr('stroke', '#E24A4A')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0)
			.attr('d', trendLineGenerator)

		trendPath.transition()
			.duration(1500)
			.delay(800)
			.attr('opacity', 0.9)

		// Punkty z animacją i efektem hover
		const dots = g.selectAll('.dot')
			.data(chartData)
			.enter()
			.append('circle')
			.attr('class', 'dot')
			.attr('cx', d => xScale(d.date))
			.attr('cy', d => yScale(d.stressLevel))
			.attr('r', 0)
			.attr('fill', '#4A90E2')
			.attr('stroke', '#ffffff')
			.attr('stroke-width', 2)
			.style('filter', 'drop-shadow(0 2px 4px rgba(74, 144, 226, 0.4))')
			.style('cursor', 'pointer')

		// Animacja pojawiania się punktów
		dots.transition()
			.duration(500)
			.delay((d, i) => i * 100)
			.attr('r', 5)

		// Efekt hover dla punktów
		dots.on('mouseenter', function() {
			d3.select(this)
				.transition()
				.duration(200)
				.attr('r', 7)
				.attr('fill', '#6BA3F5')
		})
		.on('mouseleave', function() {
			d3.select(this)
				.transition()
				.duration(200)
				.attr('r', 5)
				.attr('fill', '#4A90E2')
		})

		// Osie z lepszym stylem
		const xAxis = d3.axisBottom(xScale)
			.tickFormat(d3.timeFormat('%d %b'))
			.tickSize(-height)
			.tickPadding(10)

		const yAxis = d3.axisLeft(yScale)
			.tickSize(-width)
			.tickPadding(10)

		// Oś X z liniami siatki
		const xAxisGroup = g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(xAxis)
		
		xAxisGroup.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)')
			.style('font-size', '11px')
			.style('fill', '#666')
			.style('font-weight', '500')

		xAxisGroup.selectAll('line')
			.attr('stroke', '#e0e0e0')
			.attr('stroke-dasharray', '2,2')
			.attr('opacity', 0.5)

		// Oś Y z liniami siatki
		const yAxisGroup = g.append('g')
			.call(yAxis)
		
		yAxisGroup.selectAll('text')
			.style('font-size', '11px')
			.style('fill', '#666')
			.style('font-weight', '500')

		yAxisGroup.selectAll('line')
			.attr('stroke', '#e0e0e0')
			.attr('stroke-dasharray', '2,2')
			.attr('opacity', 0.5)

		// Etykiety osi
		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin.left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.style('font-weight', '500')
			.style('fill', '#666')
			.text('Poziom stresu (%)')

		// Legenda z lepszym stylem
		const legend = g.append('g')
			.attr('transform', `translate(${width - 130}, 20)`)
			.attr('opacity', 0)

		// Tło legendy
		legend.append('rect')
			.attr('x', -10)
			.attr('y', -8)
			.attr('width', 120)
			.attr('height', 50)
			.attr('fill', 'rgba(255, 255, 255, 0.95)')
			.attr('rx', 8)
			.style('filter', 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))')

		// Legenda dla linii danych
		const legendData = legend.append('g').attr('transform', 'translate(0, 5)')
		legendData
			.append('line')
			.attr('x1', 0)
			.attr('x2', 20)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke', 'url(#lineGradient)')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
		legendData
			.append('text')
			.attr('x', 25)
			.attr('y', 4)
			.style('font-size', '12px')
			.style('font-weight', '600')
			.style('fill', '#333')
			.text('Poziom stresu')

		// Legenda dla linii trendu
		const legendTrend = legend.append('g').attr('transform', 'translate(0, 25)')
		legendTrend
			.append('line')
			.attr('x1', 0)
			.attr('x2', 20)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke', '#E24A4A')
			.attr('stroke-width', 2.5)
			.attr('stroke-dasharray', '8,4')
			.attr('opacity', 0.9)
		legendTrend
			.append('text')
			.attr('x', 25)
			.attr('y', 4)
			.style('font-size', '12px')
			.style('font-weight', '600')
			.style('fill', '#333')
			.text('Trend')

		// Animacja pojawienia się legendy
		legend.transition()
			.duration(800)
			.delay(1000)
			.attr('opacity', 1)

		// Tooltip z lepszym stylem
		const tooltip = d3.select('body')
			.append('div')
			.style('opacity', 0)
			.style('position', 'absolute')
			.style('background', 'linear-gradient(135deg, #4A90E2 0%, #3A7BC8 100%)')
			.style('color', 'white')
			.style('padding', '12px 16px')
			.style('border-radius', '8px')
			.style('font-size', '13px')
			.style('font-weight', '500')
			.style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
			.style('pointer-events', 'none')
			.style('z-index', '1000')

		dots.on('mouseover', function (event, d) {
			tooltip.transition()
				.duration(200)
				.style('opacity', 1)
			tooltip
				.html(`<strong>${d.dateLabel}</strong><br/>Poziom stresu: <strong>${d.stressLevel}%</strong>`)
				.style('left', (event.pageX + 15) + 'px')
				.style('top', (event.pageY - 40) + 'px')
		})
		.on('mouseout', function () {
			tooltip.transition()
				.duration(200)
				.style('opacity', 0)
		})
	}, [chartData, loading])

	return (
		<Card>
			<CardHeader 
				title="Trend poziomu stresu w czasie"
				action={
					<IconButton
						onClick={() => setInfoDialogOpen(true)}
						size="small"
						sx={{
							color: '#4A90E2',
							'&:hover': {
								backgroundColor: 'rgba(74, 144, 226, 0.08)',
							},
						}}>
						<InfoIcon />
					</IconButton>
				}
			/>
			<CardContent>
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress />
					</Box>
				) : chartData.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<Typography color="text.secondary">Brak danych do wyświetlenia</Typography>
					</Box>
				) : (
					<Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
						<svg ref={svgRef}></svg>
					</Box>
				)}
			</CardContent>

			{/* Modal z informacjami */}
			<Dialog
				open={infoDialogOpen}
				onClose={() => setInfoDialogOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 2,
					},
				}}>
				<DialogTitle sx={{ fontWeight: 600, color: '#4A90E2', display: 'flex', alignItems: 'center', gap: 1 }}>
					<InfoIcon />
					Trend poziomu stresu w czasie
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ lineHeight: 1.8, color: '#666' }}>
						<strong>Opis wykresu:</strong>
						<br />
						<br />
						Wykres przedstawia trend poziomu stresu w czasie dla wszystkich pacjentów. Niebieska linia pokazuje średni poziom stresu w poszczególnych tygodniach, 
						a czerwona przerywana linia reprezentuje ogólny trend zmian.
						<br />
						<br />
						<strong>Jak czytać wykres:</strong>
						<br />
						• <strong>Niebieska linia</strong> - aktualny poziom stresu w danym tygodniu
						<br />
						• <strong>Czerwona przerywana linia</strong> - trend długoterminowy (spadkowy oznacza poprawę, wzrostowy pogorszenie)
						<br />
						• <strong>Obszar pod linią</strong> - wizualizacja zakresu wartości
						<br />
						• <strong>Punkty na linii</strong> - konkretne wartości dla każdego tygodnia
						<br />
						<br />
						Najedź kursorem na punkty, aby zobaczyć szczegółowe wartości.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setInfoDialogOpen(false)}
						sx={{
							borderRadius: 2,
							textTransform: 'none',
							fontWeight: 600,
							color: '#4A90E2',
						}}>
						Zamknij
					</Button>
				</DialogActions>
			</Dialog>
		</Card>
	)
}

export default StressTrendChart

