// src/components/dashboard/Patients/BarChart.jsx
import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const BarChart = ({ data }) => {
	const svgRef = useRef()

	useEffect(() => {
		if (!data || data.length === 0) return

		const svg = d3.select(svgRef.current)
		svg.selectAll('*').remove() // Wyczyść poprzedni wykres

		// Ustawienia wykresu
		const width = 500
		const height = 250
		const margin = { top: 20, right: 30, bottom: 70, left: 40 }

		svg.attr('width', width).attr('height', height)

		// 1. Parsowanie danych
		const parsedData = data.map(d => ({
			timestamp: new Date(d.timestamp),
			stress_level: +d.stress_level,
		}))

		// 2. Skala X (skala czasu)
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(parsedData, d => d.timestamp))
			.range([margin.left, width - margin.right])

		// 3. Skala Y (skala liniowa dla poziomu stresu, od 0 do 10)
		const yScale = d3
			.scaleLinear()
			.domain([0, 10]) // Skala stresu jest od 0-10
			.range([height - margin.bottom, margin.top])

		// 4. Oś X
		const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%Y-%m-%d %H:%M'))

		svg
			.append('g')
			.attr('transform', `translate(0, ${height - margin.bottom})`)
			.call(xAxis)
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)')

		// 5. Oś Y
		const yAxis = d3.axisLeft(yScale).ticks(10)
		svg
			.append('g')
			.attr('transform', `translate(${margin.left}, 0)`)
			.call(yAxis)
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('dy', '-3.5em')
			.attr('text-anchor', 'end')
			.attr('fill', '#000')
			.text('Poziom stresu')

		// 6. Definicja generatora linii
		const lineGenerator = d3
			.line()
			.x(d => xScale(d.timestamp))
			.y(d => yScale(d.stress_level))
			// ========= ZMIANA TUTAJ: Usunięto wygładzanie =========
			.curve(d3.curveLinear) // Zmieniono z curveMonotoneX na curveLinear

		// Rysowanie linii
		svg
			.append('path')
			.datum(parsedData)
			.attr('fill', 'none')
			.attr('stroke', 'steelblue')
			.attr('stroke-width', 2)
			.attr('d', lineGenerator)

		// Rysowanie punktów na linii
		svg
			.selectAll('.dot')
			.data(parsedData)
			.enter()
			.append('circle')
			.attr('class', 'dot')
			.attr('cx', d => xScale(d.timestamp))
			.attr('cy', d => yScale(d.stress_level))
			.attr('r', 3)
			.attr('fill', 'steelblue')
	}, [data])

	return <svg ref={svgRef}></svg>
}

export default BarChart
