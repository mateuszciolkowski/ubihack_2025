import React, { useState, useRef } from 'react'
import {
	Box,
	Button,
	Typography,
	Paper,
	IconButton,
} from '@mui/material'
import {
	CloudUpload as UploadIcon,
	Delete as DeleteIcon,
	Audiotrack as AudioIcon,
} from '@mui/icons-material'
import AudioPlayer from '../AudioPlayer'

function AudioUpload({ visitId, onUpload, onAnalyze }) {
	const [audioFile, setAudioFile] = useState(null)
	const [audioUrl, setAudioUrl] = useState(null)
	const fileInputRef = useRef(null)

	const handleFileSelect = (event) => {
		const file = event.target.files[0]
		if (!file) return

		// Sprawdź czy to plik audio
		if (!file.type.startsWith('audio/')) {
			alert('Proszę wybrać plik audio')
			return
		}

		setAudioFile(file)
		
		// Utwórz URL do odtwarzania (mock - na razie tylko lokalnie)
		const url = URL.createObjectURL(file)
		setAudioUrl(url)

		// Mock upload - w przyszłości tutaj będzie prawdziwy upload
		if (onUpload) {
			onUpload(file, visitId)
		}
	}

	const handleDelete = () => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl)
		}
		setAudioFile(null)
		setAudioUrl(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	return (
		<Box>
			{audioUrl ? (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
						<Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<AudioIcon sx={{ fontSize: '1.2rem' }} />
							Nagranie wgrane: {audioFile?.name}
						</Typography>
						<IconButton
							onClick={handleDelete}
							size="small"
							sx={{
								color: 'error.main',
								'&:hover': {
									backgroundColor: 'rgba(211, 47, 47, 0.08)',
								},
							}}>
							<DeleteIcon />
						</IconButton>
					</Box>
					<AudioPlayer 
						audioUrl={audioUrl} 
						fileName={audioFile?.name}
						visitId={visitId}
						onAnalyze={onAnalyze}
					/>
				</Box>
			) : (
				<Paper
					variant='outlined'
					sx={{
						p: 3,
						borderRadius: 2,
						borderColor: 'rgba(74, 144, 226, 0.3)',
						borderStyle: 'dashed',
						textAlign: 'center',
						backgroundColor: 'rgba(74, 144, 226, 0.02)',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: 'rgba(74, 144, 226, 0.05)',
							borderColor: '#4A90E2',
						},
					}}
					onClick={handleUploadClick}>
					<input
						ref={fileInputRef}
						type="file"
						accept="audio/*"
						onChange={handleFileSelect}
						style={{ display: 'none' }}
					/>
					<UploadIcon sx={{ fontSize: 48, color: '#4A90E2', mb: 2 }} />
					<Typography variant='body1' sx={{ mb: 1, fontWeight: 600, color: '#4A90E2' }}>
						Kliknij, aby wgrać nagranie
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						Obsługiwane formaty: MP3, WAV, OGG
					</Typography>
				</Paper>
			)}
		</Box>
	)
}

export default AudioUpload

