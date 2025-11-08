// src/components/dashboard/Patients/BarChart.jsx
import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const BarChart = ({ data }) => {
	const svgRef = useRef()

	useEffect(() => {
		if (!data) return

		const svg = d3.select(svgRef.current)
		svg.selectAll('*').remove() // Wyczyść poprzedni wykres

		// 1. Parsowanie danych - obsługa różnych struktur
		let parsedData = []
		if (Array.isArray(data) && data.length > 0) {
			// Jeśli to tablica segmentów
			parsedData = data.map(d => ({
				timestamp: new Date(d.timestamp || d.timestamp_start || d.time_seconds),
				stress_level: +d.stress_level || 0,
			}))
		} else if (data && data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
			// Jeśli to obiekt z segments
			parsedData = data.segments.map(d => ({
				timestamp: new Date(d.timestamp || d.timestamp_start),
				stress_level: +d.stress_level || 0,
			}))
		} else {
			return // Nieprawidłowa struktura danych lub brak danych
		}

		if (parsedData.length === 0) return

		// Sortuj dane po czasie
		parsedData.sort((a, b) => a.timestamp - b.timestamp)

		// Oblicz długość sesji (w sekundach)
		const sessionStart = parsedData[0].timestamp
		const sessionEnd = parsedData[parsedData.length - 1].timestamp
		const sessionDuration = (sessionEnd - sessionStart) / 1000 // w sekundach

		// Algorytm do inteligentnego obliczania szerokości wykresu
		// Minimum 500px, maksimum 1200px, zależne od liczby punktów i długości sesji
		const baseWidth = 500
		const minWidth = 500
		const maxWidth = 1200
		const pointsPerPixel = 0.8 // Gęstość: 0.8 punktów na piksel
		const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, parsedData.length / pointsPerPixel))
		// Dodatkowo uwzględnij długość sesji (dłuższe sesje = szerszy wykres)
		const durationFactor = Math.min(1.5, 1 + (sessionDuration / 3600)) // Maksymalnie 1.5x dla długich sesji
		const width = Math.round(calculatedWidth * durationFactor)

		const height = 250
		const margin = { top: 20, right: 30, bottom: 70, left: 50 }

		svg.attr('width', width).attr('height', height)

		// 2. Skala X (skala czasu) - odzwierciedla długość sesji
		const xScale = d3
			.scaleTime()
			.domain([sessionStart, sessionEnd])
			.range([margin.left, width - margin.right])

		// 3. Skala Y (dynamiczna skala bazująca na zakresie danych)
		const minStress = d3.min(parsedData, d => d.stress_level) || 0
		const maxStress = d3.max(parsedData, d => d.stress_level) || 10
		
		// Algorytm do ładnego zakresu wartości
		// Zawsze zaczynamy od 0, ale kończymy z paddingiem powyżej maksimum
		const stressRange = maxStress - minStress
		const padding = stressRange > 0 ? stressRange * 0.15 : 1 // 15% padding lub minimum 1
		const yDomainMin = Math.max(0, minStress - padding * 0.5) // Nie schodzimy poniżej 0
		const yDomainMax = Math.min(10, maxStress + padding) // Nie przekraczamy 10
		
		// Zaokrąglij do ładnych wartości
		const niceYDomain = d3.scaleLinear()
			.domain([yDomainMin, yDomainMax])
			.nice()
			.domain()
		
		const yScale = d3
			.scaleLinear()
			.domain(niceYDomain)
			.range([height - margin.bottom, margin.top])

		// 4. Oś X z liniami siatki - inteligentne formatowanie czasu
		// Algorytm do ładnego rozmieszczenia etykiet czasu
		const timeRange = sessionEnd - sessionStart
		const hours = timeRange / (1000 * 60 * 60)
		const minutes = timeRange / (1000 * 60)
		
		let tickFormat, tickCount
		if (hours >= 24) {
			// Dla sesji dłuższych niż 24h - pokazuj datę i godzinę
			tickFormat = d3.timeFormat('%d.%m %H:%M')
			tickCount = Math.min(8, Math.max(4, Math.floor(width / 120)))
		} else if (hours >= 1) {
			// Dla sesji dłuższych niż 1h - pokazuj godzinę i minutę
			tickFormat = d3.timeFormat('%H:%M')
			tickCount = Math.min(10, Math.max(4, Math.floor(width / 100)))
		} else {
			// Dla krótszych sesji - pokazuj minutę i sekundę
			tickFormat = d3.timeFormat('%M:%S')
			tickCount = Math.min(12, Math.max(4, Math.floor(width / 80)))
		}

		const xAxis = d3.axisBottom(xScale)
			.ticks(tickCount)
			.tickFormat(tickFormat)
			.tickSize(-(height - margin.top - margin.bottom))
			.tickPadding(10)

		const xAxisGroup = svg
			.append('g')
			.attr('transform', `translate(0, ${height - margin.bottom})`)
			.call(xAxis)

		xAxisGroup.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)')
			.style('font-size', '10px')
			.style('fill', '#666')
			.style('font-weight', '500')

		xAxisGroup.selectAll('line')
			.attr('stroke', '#e0e0e0')
			.attr('stroke-dasharray', '2,2')
			.attr('opacity', 0.5)

		// 5. Oś Y z liniami siatki - inteligentne rozmieszczenie
		const yRange = niceYDomain[1] - niceYDomain[0]
		// Algorytm do ładnego rozmieszczenia: więcej ticków dla większych zakresów
		const yTickCount = yRange <= 2 ? 5 : yRange <= 5 ? 6 : yRange <= 8 ? 8 : 10
		
		const yAxis = d3.axisLeft(yScale)
			.ticks(yTickCount)
			.tickFormat(d => d.toFixed(1))
			.tickSize(-(width - margin.left - margin.right))
			.tickPadding(10)

		const yAxisGroup = svg
			.append('g')
			.attr('transform', `translate(${margin.left}, 0)`)
			.call(yAxis)

		yAxisGroup.selectAll('text')
			.style('font-size', '10px')
			.style('fill', '#666')
			.style('font-weight', '500')

		yAxisGroup.selectAll('line')
			.attr('stroke', '#e0e0e0')
			.attr('stroke-dasharray', '2,2')
			.attr('opacity', 0.5)

		// Etykieta osi Y
		yAxisGroup
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('dy', '-3.5em')
			.attr('text-anchor', 'end')
			.style('font-size', '12px')
			.style('font-weight', '500')
			.attr('fill', '#666')
			.text('Poziom stresu')

		// 6. Oblicz linię trendu (regresja liniowa)
		const n = parsedData.length
		const sumX = parsedData.reduce((sum, d, i) => sum + i, 0)
		const sumY = parsedData.reduce((sum, d) => sum + d.stress_level, 0)
		const sumXY = parsedData.reduce((sum, d, i) => sum + i * d.stress_level, 0)
		const sumX2 = parsedData.reduce((sum, d, i) => sum + i * i, 0)
		
		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
		const intercept = (sumY - slope * sumX) / n
		
		const trendLine = parsedData.map((d, i) => ({
			timestamp: d.timestamp,
			stress_level: Math.max(0, Math.min(10, intercept + slope * i)),
		}))

		// Definicje gradientów
		const defs = svg.append('defs')
		
		// Gradient dla linii danych
		const lineGradient = defs.append('linearGradient')
			.attr('id', 'barLineGradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%')
		lineGradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', '#6BA3F5')
		lineGradient.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', '#4A90E2')

		// Gradient dla obszaru pod linią
		const areaGradient = defs.append('linearGradient')
			.attr('id', 'barAreaGradient')
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

		// 7. Definicja generatora linii danych
		const lineGenerator = d3
			.line()
			.x(d => xScale(d.timestamp))
			.y(d => yScale(d.stress_level))
			.curve(d3.curveMonotoneX)

		// Obszar pod linią
		const areaGenerator = d3
			.area()
			.x(d => xScale(d.timestamp))
			.y0(height - margin.bottom)
			.y1(d => yScale(d.stress_level))
			.curve(d3.curveMonotoneX)

		// Linia trendu
		const trendLineGenerator = d3
			.line()
			.x(d => xScale(d.timestamp))
			.y(d => yScale(d.stress_level))

		// Rysowanie obszaru pod linią (z gradientem)
		svg
			.append('path')
			.datum(parsedData)
			.attr('fill', 'url(#barAreaGradient)')
			.attr('d', areaGenerator)
			.attr('opacity', 0)
			.transition()
			.duration(1000)
			.attr('opacity', 1)

		// Rysowanie linii danych (z gradientem i animacją)
		const path = svg
			.append('path')
			.datum(parsedData)
			.attr('fill', 'none')
			.attr('stroke', 'url(#barLineGradient)')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
			.attr('stroke-linejoin', 'round')
			.attr('d', lineGenerator)
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

		// Rysowanie linii trendu (przerywanej z animacją)
		const trendPath = svg
			.append('path')
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

		// Rysowanie punktów na linii z animacją
		// Algorytm do gęstszego rozmieszczenia punktów
		// Dla gęstych danych, pokazuj tylko co n-ty punkt, aby uniknąć przepełnienia
		const pointDensity = parsedData.length / (width - margin.left - margin.right)
		const pointStep = pointDensity > 2 ? Math.ceil(pointDensity / 2) : 1 // Co drugi punkt jeśli zbyt gęste
		const visiblePoints = parsedData.filter((d, i) => i % pointStep === 0 || i === parsedData.length - 1)
		
		const dots = svg
			.selectAll('.dot')
			.data(visiblePoints)
			.enter()
			.append('circle')
			.attr('class', 'dot')
			.attr('cx', d => xScale(d.timestamp))
			.attr('cy', d => yScale(d.stress_level))
			.attr('r', 0)
			.attr('fill', '#4A90E2')
			.attr('stroke', '#ffffff')
			.attr('stroke-width', pointDensity > 3 ? 1.5 : 2) // Cieńsze obramowanie dla gęstych danych
			.style('filter', 'drop-shadow(0 2px 4px rgba(74, 144, 226, 0.4))')
			.style('cursor', 'pointer')

		// Rozmiar punktów zależny od gęstości
		const pointRadius = pointDensity > 3 ? 3 : pointDensity > 2 ? 4 : 5

		// Animacja pojawiania się punktów
		dots.transition()
			.duration(400)
			.delay((d, i) => i * (pointStep * 30) + 1000)
			.attr('r', pointRadius)

		// Efekt hover dla punktów
		dots.on('mouseenter', function() {
			d3.select(this)
				.transition()
				.duration(200)
				.attr('r', pointRadius + 2)
				.attr('fill', '#6BA3F5')
		})
		.on('mouseleave', function() {
			d3.select(this)
				.transition()
				.duration(200)
				.attr('r', pointRadius)
				.attr('fill', '#4A90E2')
		})

		// Legenda z lepszym stylem
		const legend = svg
			.append('g')
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
			.attr('stroke', 'url(#barLineGradient)')
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round')
		legendData
			.append('text')
			.attr('x', 25)
			.attr('y', 4)
			.style('font-size', '11px')
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
			.style('font-size', '11px')
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
			.style('font-size', '12px')
			.style('font-weight', '500')
			.style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
			.style('pointer-events', 'none')
			.style('z-index', '1000')

		dots.on('mouseover', function (event, d) {
			// Formatuj czas względny od początku sesji
			const timeFromStart = (d.timestamp - sessionStart) / 1000 // w sekundach
			const minutes = Math.floor(timeFromStart / 60)
			const seconds = Math.floor(timeFromStart % 60)
			const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
			
			// Formatuj również pełną datę
			const dateStr = d3.timeFormat('%H:%M:%S')(d.timestamp)
			
			tooltip.transition()
				.duration(200)
				.style('opacity', 1)
			tooltip
				.html(`<strong>Czas: ${timeStr}</strong><br/>${dateStr}<br/>Poziom stresu: <strong>${d.stress_level.toFixed(1)}</strong>`)
				.style('left', (event.pageX + 15) + 'px')
				.style('top', (event.pageY - 50) + 'px')
		})
		.on('mouseout', function () {
			tooltip.transition()
				.duration(200)
				.style('opacity', 0)
		})
	}, [data])

	return <svg ref={svgRef}></svg>
}

export default BarChart
