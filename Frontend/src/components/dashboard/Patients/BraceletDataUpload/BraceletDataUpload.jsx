import React, { useState, useRef } from 'react'
import {
	Box,
	Button,
	Typography,
	Paper,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Alert,
} from '@mui/material'
import {
	CloudUpload as UploadIcon,
	Delete as DeleteIcon,
	Watch as WatchIcon,
	CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'

function BraceletDataUpload({ visitId, onUpload }) {
	const [dataFile, setDataFile] = useState(null)
	const [parsedData, setParsedData] = useState(null)
	const [error, setError] = useState(null)
	const fileInputRef = useRef(null)

	const handleFileSelect = async (event) => {
		const file = event.target.files[0]
		if (!file) return

		setError(null)

		// Mock parsing - na razie symulujemy parsowanie
		try {
			// Symuluj parsowanie pliku
			await new Promise(resolve => setTimeout(resolve, 500))

			// Mock dane - w rzeczywistości tutaj byłoby parsowanie pliku .pkl lub JSON
			const mockData = {
				acc: {
					samples: 9600, // 32 Hz * 300 sekund
					rate: 32,
					shape: [9600, 3],
					description: 'Akcelerometr (3 osie: x, y, z)'
				},
				bvp: {
					samples: 19200, // 64 Hz * 300 sekund
					rate: 64,
					shape: [19200, 1],
					description: 'Blood Volume Pulse'
				},
				eda: {
					samples: 1200, // 4 Hz * 300 sekund
					rate: 4,
					shape: [1200, 1],
					description: 'Electrodermal Activity'
				},
				temp: {
					samples: 1200, // 4 Hz * 300 sekund
					rate: 4,
					shape: [1200, 1],
					description: 'Temperatura'
				},
				duration: 300, // sekundy
				fileSize: file.size,
				fileName: file.name,
			}

			setDataFile(file)
			setParsedData(mockData)

			// Mock upload - w przyszłości tutaj będzie prawdziwy upload
			if (onUpload) {
				onUpload(mockData, visitId)
			}
		} catch (err) {
			setError('Błąd podczas parsowania pliku. Upewnij się, że plik ma poprawny format.')
			console.error('Error parsing file:', err)
		}
	}

	const handleDelete = () => {
		setDataFile(null)
		setParsedData(null)
		setError(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	return (
		<Box>
			{parsedData ? (
				<Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
						<Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<WatchIcon sx={{ fontSize: '1.2rem' }} />
							<CheckCircleIcon sx={{ fontSize: '1.2rem', color: 'success.main' }} />
							Dane wgrane: {dataFile?.name}
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

					<Paper
						variant='outlined'
						sx={{
							p: 2.5,
							borderRadius: 2,
							borderColor: 'rgba(74, 144, 226, 0.3)',
							backgroundColor: 'rgba(74, 144, 226, 0.02)',
						}}>
						<Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600, color: '#4A90E2' }}>
							Podsumowanie danych z bransoletki
						</Typography>

						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600 }}>Sygnał</TableCell>
										<TableCell sx={{ fontWeight: 600 }} align="right">Częstotliwość</TableCell>
										<TableCell sx={{ fontWeight: 600 }} align="right">Próbki</TableCell>
										<TableCell sx={{ fontWeight: 600 }} align="right">Kształt</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>
											<Box>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>ACC</Typography>
												<Typography variant='caption' color='text.secondary'>
													{parsedData.acc.description}
												</Typography>
											</Box>
										</TableCell>
										<TableCell align="right">{parsedData.acc.rate} Hz</TableCell>
										<TableCell align="right">{parsedData.acc.samples.toLocaleString()}</TableCell>
										<TableCell align="right">
											<Chip label={parsedData.acc.shape.join(' × ')} size="small" />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											<Box>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>BVP</Typography>
												<Typography variant='caption' color='text.secondary'>
													{parsedData.bvp.description}
												</Typography>
											</Box>
										</TableCell>
										<TableCell align="right">{parsedData.bvp.rate} Hz</TableCell>
										<TableCell align="right">{parsedData.bvp.samples.toLocaleString()}</TableCell>
										<TableCell align="right">
											<Chip label={parsedData.bvp.shape.join(' × ')} size="small" />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											<Box>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>EDA</Typography>
												<Typography variant='caption' color='text.secondary'>
													{parsedData.eda.description}
												</Typography>
											</Box>
										</TableCell>
										<TableCell align="right">{parsedData.eda.rate} Hz</TableCell>
										<TableCell align="right">{parsedData.eda.samples.toLocaleString()}</TableCell>
										<TableCell align="right">
											<Chip label={parsedData.eda.shape.join(' × ')} size="small" />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>
											<Box>
												<Typography variant='body2' sx={{ fontWeight: 600 }}>TEMP</Typography>
												<Typography variant='caption' color='text.secondary'>
													{parsedData.temp.description}
												</Typography>
											</Box>
										</TableCell>
										<TableCell align="right">{parsedData.temp.rate} Hz</TableCell>
										<TableCell align="right">{parsedData.temp.samples.toLocaleString()}</TableCell>
										<TableCell align="right">
											<Chip label={parsedData.temp.shape.join(' × ')} size="small" />
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>

						<Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(74, 144, 226, 0.2)' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant='body2' color='text.secondary'>
									Czas trwania sesji
								</Typography>
								<Chip 
									label={`${Math.floor(parsedData.duration / 60)}:${(parsedData.duration % 60).toString().padStart(2, '0')}`}
									color="primary"
									sx={{ fontWeight: 600 }}
								/>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
								<Typography variant='body2' color='text.secondary'>
									Rozmiar pliku
								</Typography>
								<Typography variant='body2' sx={{ fontWeight: 600 }}>
									{(parsedData.fileSize / 1024).toFixed(2)} KB
								</Typography>
							</Box>
						</Box>
					</Paper>
				</Box>
			) : (
				<Box>
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
							accept=".pkl,.json"
							onChange={handleFileSelect}
							style={{ display: 'none' }}
						/>
						<WatchIcon sx={{ fontSize: 48, color: '#4A90E2', mb: 2 }} />
						<Typography variant='body1' sx={{ mb: 1, fontWeight: 600, color: '#4A90E2' }}>
							Kliknij, aby wgrać dane z bransoletki
						</Typography>
						<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
							Obsługiwane formaty: .pkl (pickle), .json
						</Typography>
						<Button
							variant='contained'
							startIcon={<UploadIcon />}
							sx={{
								borderRadius: 2,
								textTransform: 'none',
								fontSize: '0.9375rem',
								fontWeight: 600,
								px: 3,
								py: 1,
								backgroundColor: '#4A90E2',
								boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
								'&:hover': {
									backgroundColor: '#3A7BC8',
									boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
								},
							}}>
							Wybierz plik
						</Button>
					</Paper>
					{error && (
						<Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
							{error}
						</Alert>
					)}
				</Box>
			)}
		</Box>
	)
}

export default BraceletDataUpload

