import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, Box, CircularProgress, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import * as d3 from 'd3'

const COLORS = {
	Baseline: '#4A90E2',
	Stress: '#E24A4A',
	Amusement: '#4AE2A0',
	Meditation: '#9B4AE2',
}

const POLISH_NAMES = {
	Baseline: 'Bazowy',
	Stress: 'Stres',
	Amusement: 'Rozrywka',
	Meditation: 'Medytacja',
}

function StressClassDistribution() {
	const svgRef = useRef(null)
	const [chartData, setChartData] = useState([])
	const [loading, setLoading] = useState(true)
	const [infoDialogOpen, setInfoDialogOpen] = useState(false)

	useEffect(() => {
		const generateMockData = () => {
			setLoading(true)
			
			// Generuj mock rozkład klas stresu
			// Realistyczny rozkład: więcej Baseline, umiarkowanie Stress, mniej Amusement i Meditation
			const classCounts = {
				Baseline: Math.floor(120 + Math.random() * 40), // 120-160
				Stress: Math.floor(45 + Math.random() * 25),    // 45-70
				Amusement: Math.floor(25 + Math.random() * 15),  // 25-40
				Meditation: Math.floor(15 + Math.random() * 15), // 15-30
			}

			// Konwertuj na format dla wykresu
			const chartDataArray = Object.entries(classCounts)
				.map(([className, count]) => ({
					name: POLISH_NAMES[className] || className,
					value: count,
					originalName: className,
				}))
				.filter(item => item.value > 0) // Tylko klasy z danymi

			setChartData(chartDataArray)
			setLoading(false)
		}

		generateMockData()
	}, [])

	useEffect(() => {
		if (loading || chartData.length === 0 || !svgRef.current) return

		// Wyczyść poprzedni wykres
		d3.select(svgRef.current).selectAll('*').remove()

		const pieWidth = 250 // Szerokość dla koła
		const legendWidth = 140 // Szerokość dla legendy (zmniejszona)
		const width = pieWidth + legendWidth + 15 // Całkowita szerokość z odstępem (zmniejszony)
		const height = 300
		const radius = Math.min(pieWidth, height) / 2 - 20

		const svg = d3
			.select(svgRef.current)
			.attr('width', width)
			.attr('height', height)

		// Definicje gradientów
		const defs = svg.append('defs')
		
		// Tworzenie gradientów dla każdego koloru
		chartData.forEach((item, i) => {
			const gradient = defs.append('linearGradient')
				.attr('id', `gradient-${item.originalName}`)
				.attr('x1', '0%')
				.attr('y1', '0%')
				.attr('x2', '100%')
				.attr('y2', '100%')
			
			const baseColor = COLORS[item.originalName] || '#8884d8'
			gradient.append('stop')
				.attr('offset', '0%')
				.attr('stop-color', d3.rgb(baseColor).brighter(0.3))
			gradient.append('stop')
				.attr('offset', '100%')
				.attr('stop-color', d3.rgb(baseColor).darker(0.3))
		})

		// Koło wyśrodkowane w lewej części
		const g = svg.append('g').attr('transform', `translate(${pieWidth / 2},${height / 2})`)

		// Utwórz pie chart
		const pie = d3.pie()
			.value(d => d.value)
			.padAngle(0.02) // Dodaj odstępy między segmentami

		// Utwórz arc generator
		const arc = d3.arc()
			.innerRadius(0)
			.outerRadius(radius)
			.cornerRadius(4) // Zaokrąglone rogi

		// Rysuj segmenty z animacją
		const arcs = g.selectAll('.arc')
			.data(pie(chartData))
			.enter()
			.append('g')
			.attr('class', 'arc')

		const paths = arcs
			.append('path')
			.attr('d', arc)
			.attr('fill', d => `url(#gradient-${d.data.originalName})`)
			.attr('stroke', '#fff')
			.attr('stroke-width', 3)
			.style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))')
			.style('cursor', 'pointer')
			.attr('opacity', 0)

		// Animacja pojawiania się segmentów
		paths.transition()
			.duration(800)
			.delay((d, i) => i * 150)
			.attrTween('d', function(d) {
				const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
				return function(t) {
					return arc(interpolate(t))
				}
			})
			.attr('opacity', 1)

		// Efekt hover - powiększenie segmentu
		paths.on('mouseenter', function(event, d) {
			const hoverArc = d3.arc()
				.innerRadius(0)
				.outerRadius(radius + 10)
				.cornerRadius(4)
			
			d3.select(this)
				.transition()
				.duration(200)
				.attr('d', hoverArc)
				.attr('stroke-width', 4)
				.style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))')
		})
		.on('mouseleave', function(event, d) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr('d', arc)
				.attr('stroke-width', 3)
				.style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))')
		})

		// Dodaj etykiety - większy arc dla lepszego wyświetlania
		const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 1.1)
		
		const labels = arcs
			.append('text')
			.attr('transform', d => {
				const pos = labelArc.centroid(d)
				const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2
				// Jeśli segment jest po lewej stronie, przesuń tekst bardziej na zewnątrz
				if (midAngle > Math.PI) {
					pos[0] = pos[0] * 1.3
				}
				return `translate(${pos})`
			})
			.attr('text-anchor', d => {
				const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2
				return midAngle > Math.PI ? 'end' : 'start'
			})
			.style('font-size', '14px')
			.style('font-weight', '700')
			.style('fill', '#fff')
			.style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.3)')
			.attr('opacity', 0)
			.text(d => {
				const percent = ((d.data.value / d3.sum(chartData, d => d.value)) * 100).toFixed(0)
				return percent > 3 ? `${percent}%` : ''
			})

		// Animacja pojawiania się etykiet
		labels.transition()
			.duration(600)
			.delay((d, i) => i * 150 + 400)
			.attr('opacity', 1)

		// Legenda - poza wykresem po prawej stronie (zmniejszona)
		const legend = svg
			.append('g')
			.attr('transform', `translate(${pieWidth + 15}, 20)`)

		// Tytuł legendy (mniejszy)
		legend
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.style('font-size', '11px')
			.style('font-weight', '600')
			.style('fill', '#333')
			.text('Klasy stresu')

		chartData.forEach((item, i) => {
			const legendRow = legend.append('g')
				.attr('transform', `translate(0, ${i * 18 + 18})`)
				.attr('opacity', 0)
				.style('cursor', 'pointer')

			legendRow
				.append('rect')
				.attr('width', 12)
				.attr('height', 12)
				.attr('rx', 2)
				.attr('fill', `url(#gradient-${item.originalName})`)
				.attr('stroke', '#fff')
				.attr('stroke-width', 1.5)
				.style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))')

			const total = d3.sum(chartData, d => d.value)
			const percent = ((item.value / total) * 100).toFixed(1)

			legendRow
				.append('text')
				.attr('x', 16)
				.attr('y', 9)
				.style('font-size', '10px')
				.style('font-weight', '500')
				.style('fill', '#666')
				.text(`${item.name}: ${percent}%`)

			// Animacja pojawiania się legendy
			legendRow.transition()
				.duration(400)
				.delay(i * 100 + 600)
				.attr('opacity', 1)

			// Efekt hover dla legendy (mniejszy)
			legendRow.on('mouseenter', function() {
				d3.select(this).select('rect')
					.transition()
					.duration(200)
					.attr('width', 14)
					.attr('height', 14)
			})
			.on('mouseleave', function() {
				d3.select(this).select('rect')
					.transition()
					.duration(200)
					.attr('width', 12)
					.attr('height', 12)
			})
		})

		// Tooltip z lepszym stylem
		const tooltip = d3.select('body')
			.append('div')
			.style('opacity', 0)
			.style('position', 'absolute')
			.style('background', 'linear-gradient(135deg, rgba(74, 144, 226, 0.95) 0%, rgba(58, 123, 200, 0.95) 100%)')
			.style('color', 'white')
			.style('padding', '12px 16px')
			.style('border-radius', '8px')
			.style('font-size', '13px')
			.style('font-weight', '500')
			.style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
			.style('pointer-events', 'none')
			.style('z-index', '1000')

		paths.on('mouseover', function (event, d) {
			const percent = ((d.data.value / d3.sum(chartData, d => d.value)) * 100).toFixed(1)
			tooltip.transition()
				.duration(200)
				.style('opacity', 1)
			tooltip
				.html(`<strong>${d.data.name}</strong><br/>Liczba: <strong>${d.data.value}</strong><br/>Procent: <strong>${percent}%</strong>`)
				.style('left', (event.pageX + 15) + 'px')
				.style('top', (event.pageY - 50) + 'px')
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
				title="Rozkład klas stresu"
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
					Rozkład klas stresu
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ lineHeight: 1.8, color: '#666' }}>
						<strong>Opis wykresu:</strong>
						<br />
						<br />
						Wykres kołowy przedstawia rozkład różnych klas stresu wśród wszystkich pacjentów. Każdy segment reprezentuje jedną z czterech kategorii:
						<br />
						<br />
						<strong>Klasy stresu:</strong>
						<br />
						• <strong style={{ color: '#4A90E2' }}>Bazowy</strong> - normalny, spokojny stan
						<br />
						• <strong style={{ color: '#E24A4A' }}>Stres</strong> - podwyższony poziom stresu
						<br />
						• <strong style={{ color: '#4AE2A0' }}>Rozrywka</strong> - pozytywne emocje, relaks
						<br />
						• <strong style={{ color: '#9B4AE2' }}>Medytacja</strong> - stan głębokiego relaksu
						<br />
						<br />
						<strong>Jak czytać wykres:</strong>
						<br />
						• Większy segment oznacza większą liczbę wystąpień danej klasy
						<br />
						• Procenty na wykresie pokazują udział każdej klasy w całkowitym rozkładzie
						<br />
						• Najedź kursorem na segment, aby zobaczyć szczegółowe informacje
						<br />
						• Kliknij na element legendy, aby lepiej zobaczyć odpowiedni segment
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

export default StressClassDistribution

