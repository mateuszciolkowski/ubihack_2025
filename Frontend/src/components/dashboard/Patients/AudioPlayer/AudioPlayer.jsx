import React, { useState, useRef, useEffect } from 'react'
import {
	Box,
	Typography,
	Slider,
	IconButton,
	Paper,
	Button,
	CircularProgress,
} from '@mui/material'
import {
	PlayArrow as PlayIcon,
	Pause as PauseIcon,
	VolumeUp as VolumeIcon,
	Analytics as AnalyticsIcon,
} from '@mui/icons-material'

function AudioPlayer({ audioUrl, fileName, onAnalyze, visitId }) {
	const audioRef = useRef(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState(1)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisComplete, setAnalysisComplete] = useState(false)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const updateTime = () => setCurrentTime(audio.currentTime)
		const updateDuration = () => setDuration(audio.duration)
		const handleEnded = () => {
			setIsPlaying(false)
			setCurrentTime(0)
		}

		audio.addEventListener('timeupdate', updateTime)
		audio.addEventListener('loadedmetadata', updateDuration)
		audio.addEventListener('ended', handleEnded)

		return () => {
			audio.removeEventListener('timeupdate', updateTime)
			audio.removeEventListener('loadedmetadata', updateDuration)
			audio.removeEventListener('ended', handleEnded)
		}
	}, [audioUrl])

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume
		}
	}, [volume])

	const togglePlayPause = () => {
		const audio = audioRef.current
		if (!audio) return

		if (isPlaying) {
			audio.pause()
		} else {
			audio.play()
		}
		setIsPlaying(!isPlaying)
	}

	const handleSeek = (event, newValue) => {
		const audio = audioRef.current
		if (!audio) return

		audio.currentTime = newValue
		setCurrentTime(newValue)
	}

	const handleVolumeChange = (event, newValue) => {
		setVolume(newValue)
	}

	const formatTime = (seconds) => {
		if (!seconds || isNaN(seconds)) return '0:00'
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const handleAnalyze = async () => {
		if (!audioUrl || !visitId) return

		setIsAnalyzing(true)
		setAnalysisComplete(false)

		try {
			// Mock analiza - symuluj przetwarzanie nagrania
			await new Promise(resolve => setTimeout(resolve, 2000))

			// Mock wyniki analizy
			const mockAnalysisResults = {
				duration: duration,
				stressLevel: Math.random() * 10,
				stressPercentage: Math.random() * 100,
				keyMoments: [
					{ time: duration * 0.2, description: 'Wzrost poziomu stresu' },
					{ time: duration * 0.5, description: 'Moment relaksacji' },
					{ time: duration * 0.8, description: 'Ponowny wzrost stresu' },
				],
			}

			if (onAnalyze) {
				onAnalyze(mockAnalysisResults, visitId)
			}

			setAnalysisComplete(true)
		} catch (error) {
			console.error('Error analyzing audio:', error)
		} finally {
			setIsAnalyzing(false)
		}
	}

	if (!audioUrl) {
		return null
	}

	return (
		<Paper
			variant='outlined'
			sx={{
				p: 2.5,
				borderRadius: 2,
				borderColor: 'rgba(74, 144, 226, 0.3)',
				backgroundColor: 'rgba(74, 144, 226, 0.02)',
			}}>
			{fileName && (
				<Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
					{fileName}
				</Typography>
			)}
			
			{/* Audio element (hidden) */}
			<audio ref={audioRef} src={audioUrl} preload="metadata" />

			{/* Controls */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
				<IconButton
					onClick={togglePlayPause}
					sx={{
						backgroundColor: '#4A90E2',
						color: 'white',
						width: 48,
						height: 48,
						'&:hover': {
							backgroundColor: '#3A7BC8',
						},
					}}>
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</IconButton>

				<Box sx={{ flex: 1 }}>
					<Slider
						value={currentTime}
						max={duration || 100}
						onChange={handleSeek}
						size="medium"
						sx={{
							color: '#4A90E2',
							height: 6,
							'& .MuiSlider-thumb': {
								width: 16,
								height: 16,
								backgroundColor: '#4A90E2',
								border: '2px solid #ffffff',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
								'&:hover': {
									boxShadow: '0 0 0 8px rgba(74, 144, 226, 0.16)',
								},
								'&:active': {
									boxShadow: '0 0 0 12px rgba(74, 144, 226, 0.24)',
								},
							},
							'& .MuiSlider-track': {
								height: 6,
								borderRadius: 3,
							},
							'& .MuiSlider-rail': {
								height: 6,
								borderRadius: 3,
								opacity: 0.3,
							},
						}}
					/>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
						<Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
							{formatTime(currentTime)}
						</Typography>
						<Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
							{formatTime(duration)}
						</Typography>
					</Box>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
					<VolumeIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', fontSize: '1.2rem' }} />
					<Slider
						value={volume}
						min={0}
						max={1}
						step={0.01}
						onChange={handleVolumeChange}
						sx={{
							color: '#4A90E2',
							width: 80,
						}}
					/>
				</Box>
			</Box>

			{/* Przycisk analizy */}
			{visitId && (
				<Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
					<Button
						variant='contained'
						fullWidth
						onClick={handleAnalyze}
						disabled={isAnalyzing || analysisComplete}
						startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
						sx={{
							borderRadius: 2,
							textTransform: 'none',
							fontSize: '0.9375rem',
							fontWeight: 600,
							py: 1.5,
							backgroundColor: analysisComplete ? '#4caf50' : '#4A90E2',
							boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
							'&:hover': {
								backgroundColor: analysisComplete ? '#45a049' : '#3A7BC8',
								boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
							},
							'&:disabled': {
								backgroundColor: analysisComplete ? '#4caf50' : '#4A90E2',
								opacity: isAnalyzing ? 0.7 : 1,
							},
						}}>
						{isAnalyzing
							? 'Analizowanie nagrania...'
							: analysisComplete
							? 'Analiza zakończona'
							: 'Przeanalizuj nagranie'}
					</Button>
				</Box>
			)}
		</Paper>
	)
}

export default AudioPlayer

