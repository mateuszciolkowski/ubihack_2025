import React, { useState, useEffect } from 'react'
import {
	Box,
	Container,
	Typography,
	Button,
	Stack,
	AppBar,
	Toolbar,
	Grid,
	Card,
	CardContent,
	Fab,
	Divider,
} from '@mui/material'
import {
	ArrowUpward,
	Analytics,
	MonitorHeart,
	Assessment,
	CalendarToday,
	People,
	Security,
} from '@mui/icons-material'
import Modal from '../../common/Modal'
import LoginForm from '../LoginForm'
import RegistrationForm from '../RegistrationForm'
import backgroundImage from '../../../logo/obrazjpg.jpg'
import logoImage from '../../../logo/logo.png'

function LandingPage() {
	const [modalOpen, setModalOpen] = useState(null)
	const [showScrollTop, setShowScrollTop] = useState(false)

	const closeModal = () => setModalOpen(null)

	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 300)
		}
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			{/* Hero Section with Background Image */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					minHeight: '100vh',
					overflow: 'hidden',
				}}
			>
				{/* Background Image with Blur */}
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage: `url(${backgroundImage})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat',
						filter: 'blur(4px)',
						transform: 'scale(1.05)',
						zIndex: 0,
					}}
				/>
				{/* Overlay for better text readability */}
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.3)',
						zIndex: 1,
					}}
				/>

				{/* Header on Image */}
				<AppBar
					position="static"
					elevation={0}
					sx={{
						backgroundColor: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(10px)',
						borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
						borderRadius: { xs: 0, md: '0 0 12px 12px' },
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
						position: 'relative',
						zIndex: 2,
						maxWidth: { xs: '100%', md: '90%' },
						mx: 'auto',
						mt: 0,
					}}
				>
					<Toolbar
						sx={{
							minHeight: '64px !important',
							px: { xs: 2, sm: 3 },
							justifyContent: 'space-between',
						}}
					>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
							}}
						>
							<Box
								component="img"
								src={logoImage}
								alt="Logo"
								sx={{
									height: { xs: 32, sm: 40 },
									width: 'auto',
									objectFit: 'contain',
								}}
							/>
							<Typography
								variant="h6"
								sx={{
									fontWeight: 700,
									color: '#4A90E2',
									fontSize: { xs: '1.25rem', sm: '1.5rem' },
									display: { xs: 'none', sm: 'block' },
								}}
							>
								Synaptis
							</Typography>
						</Box>
						<Stack direction="row" spacing={1.5}>
							<Button
								variant="outlined"
								size="medium"
								onClick={() => setModalOpen('login')}
								sx={{
									px: 3,
									py: 1,
									borderRadius: 2,
									textTransform: 'none',
									fontSize: '0.9375rem',
									fontWeight: 600,
									borderWidth: 2,
									borderColor: '#4A90E2',
									color: '#4A90E2',
									'&:hover': {
										borderWidth: 2,
										backgroundColor: 'rgba(74, 144, 226, 0.08)',
									},
								}}
							>
								Zaloguj się
							</Button>
							<Button
								variant="contained"
								size="medium"
								onClick={() => setModalOpen('register')}
								sx={{
									px: 3,
									py: 1,
									borderRadius: 2,
									textTransform: 'none',
									fontSize: '0.9375rem',
									fontWeight: 600,
									backgroundColor: '#4A90E2',
									boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
									'&:hover': {
										backgroundColor: '#3A7BC8',
										boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
									},
								}}
							>
								Zarejestruj się
							</Button>
						</Stack>
					</Toolbar>
				</AppBar>

				{/* Hero Content */}
				<Box
					sx={{
						flex: 1,
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'center',
						position: 'relative',
						zIndex: 2,
						py: { xs: 2, md: 4 },
						pt: { xs: 4, md: 6 },
					}}
				>
					<Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
				{/* Logo Container with Clouds Background */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						mt: 0,
						position: 'relative',
					}}
				>
					<Box
						sx={{
							position: 'relative',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							padding: { xs: 4, sm: 5, md: 6 },
							borderRadius: 4,
							backgroundColor: 'transparent',
							minWidth: { xs: '450px', sm: '600px', md: '700px' },
						}}
					>
						{/* Logo */}
						<Box
							component="img"
							src={logoImage}
							alt="Logo"
							sx={{
								height: { xs: 120, sm: 160, md: 200 },
								width: 'auto',
								objectFit: 'contain',
								filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
								opacity: 0.95,
								position: 'relative',
								zIndex: 1,
								mb: { xs: 3, sm: 4, md: 5 },
							}}
						/>
						{/* Text below Logo */}
						<Box
							sx={{
								textAlign: 'center',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								width: '100%',
								px: 2,
							}}
						>
							<Typography
								component="div"
								sx={{
									fontWeight: 700,
									color: '#ffffff',
									textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)',
									fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
									mb: { xs: 2, sm: 2.5 },
									lineHeight: 1.2,
								}}
							>
								Synaptis
							</Typography>
							<Typography
								component="div"
								sx={{
									fontWeight: 400,
									color: '#ffffff',
									textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)',
									fontSize: { xs: '1.125rem', sm: '1.375rem', md: '1.5rem' },
									lineHeight: 1.6,
									maxWidth: { xs: '90%', sm: '85%', md: '800px' },
								}}
							>
								Zaawansowana platforma do analizy i monitorowania poziomu stresu na podstawie sygnałów biometrycznych. Wykorzystaj sztuczną inteligencję do lepszego zrozumienia swojego zdrowia.
							</Typography>
						</Box>
					</Box>
				</Box>
				</Container>
				</Box>
			</Box>

			{/* Features Section */}
			<Box
				sx={{
					backgroundColor: '#ffffff',
					py: { xs: 6, md: 10 },
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					position: 'relative',
					zIndex: 1,
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h3"
						align="center"
						sx={{
							fontWeight: 700,
							mb: 1,
							color: 'rgba(0, 0, 0, 0.87)',
						}}
					>
						Funkcjonalności
					</Typography>
					<Typography
						variant="body1"
						align="center"
						sx={{
							color: 'rgba(0, 0, 0, 0.6)',
							mb: 6,
							maxWidth: '600px',
							mx: 'auto',
						}}
					>
						Odkryj możliwości naszej platformy
					</Typography>
					<Grid container spacing={4}>
						{[
							{
								icon: <MonitorHeart sx={{ fontSize: 40 }} />,
								title: 'Analiza Biometryczna',
								description: 'Monitoruj sygnały z czujników: akcelerometr, BVP, EDA i temperatura',
							},
							{
								icon: <Analytics sx={{ fontSize: 40 }} />,
								title: 'Klasyfikacja Stresu',
								description: 'Zaawansowany model CNN-LSTM do precyzyjnej klasyfikacji poziomu stresu',
							},
							{
								icon: <Assessment sx={{ fontSize: 40 }} />,
								title: 'Szczegółowe Raporty',
								description: 'Otrzymuj szczegółowe analizy i statystyki dotyczące poziomu stresu',
							},
							{
								icon: <CalendarToday sx={{ fontSize: 40 }} />,
								title: 'Historia Pomiarów',
								description: 'Śledź zmiany poziomu stresu w czasie i analizuj trendy',
							},
							{
								icon: <People sx={{ fontSize: 40 }} />,
								title: 'Zarządzanie Pacjentami',
								description: 'Zarządzaj danymi pacjentów i ich wynikami analiz',
							},
							{
								icon: <Security sx={{ fontSize: 40 }} />,
								title: 'Bezpieczeństwo',
								description: 'Twoje dane są bezpieczne dzięki zaawansowanym mechanizmom ochrony',
							},
						].map((feature, index) => (
							<Grid item xs={12} sm={6} md={4} key={index}>
								<Card
									sx={{
										height: '100%',
										borderRadius: 2,
										boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
										transition: 'box-shadow 0.2s',
										'&:hover': {
											boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
										},
									}}
								>
									<CardContent sx={{ p: 3, textAlign: 'center' }}>
										<Box
											sx={{
												color: '#4A90E2',
												mb: 2,
												display: 'flex',
												justifyContent: 'center',
											}}
										>
											{feature.icon}
										</Box>
										<Typography
											variant="h6"
											sx={{
												fontWeight: 600,
												mb: 1,
												color: 'rgba(0, 0, 0, 0.87)',
												fontSize: '1rem',
											}}
										>
											{feature.title}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												color: 'rgba(0, 0, 0, 0.6)',
												lineHeight: 1.6,
												fontSize: '0.875rem',
											}}
										>
											{feature.description}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* What App Allows Section */}
			<Box
				sx={{
					backgroundColor: 'rgba(0, 0, 0, 0.02)',
					py: { xs: 6, md: 10 },
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					position: 'relative',
					zIndex: 1,
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h3"
						align="center"
						sx={{
							fontWeight: 700,
							mb: 1,
							color: 'rgba(0, 0, 0, 0.87)',
						}}
					>
						Na co pozwala aplikacja?
					</Typography>
					<Typography
						variant="body1"
						align="center"
						sx={{
							color: 'rgba(0, 0, 0, 0.6)',
							mb: 6,
							maxWidth: '600px',
							mx: 'auto',
						}}
					>
						Poznaj możliwości naszej platformy
					</Typography>
					<Grid container spacing={4}>
						{[
							{
								title: 'Ciągłe Monitorowanie',
								description:
									'Monitoruj poziom stresu w czasie rzeczywistym dzięki analizie sygnałów biometrycznych z czujników noszonych na ciele.',
							},
							{
								title: 'Identyfikacja Momentów Stresu',
								description:
									'Aplikacja automatycznie wykrywa momenty podwyższonego stresu i dostarcza szczegółowych informacji o ich przyczynach.',
							},
							{
								title: 'Analiza Trendów',
								description:
									'Śledź długoterminowe trendy poziomu stresu i identyfikuj wzorce, które mogą wpływać na Twoje zdrowie.',
							},
							{
								title: 'Raporty i Statystyki',
								description:
									'Otrzymuj szczegółowe raporty z analizą statystyczną, rozkładem klas stresu i wizualizacjami danych.',
							},
						].map((item, index) => (
							<Grid item xs={12} md={6} key={index}>
								<Card
									sx={{
										height: '100%',
										borderRadius: 2,
										boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
										backgroundColor: '#ffffff',
										transition: 'box-shadow 0.2s',
										'&:hover': {
											boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
										},
									}}
								>
									<CardContent sx={{ p: 4 }}>
										<Typography
											variant="h6"
											sx={{
												fontWeight: 600,
												mb: 2,
												color: '#4A90E2',
												fontSize: '1.125rem',
											}}
										>
											{item.title}
										</Typography>
										<Typography
											variant="body1"
											sx={{
												color: 'rgba(0, 0, 0, 0.7)',
												lineHeight: 1.8,
												fontSize: '0.9375rem',
											}}
										>
											{item.description}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* Footer */}
			<Box
				component="footer"
				sx={{
					backgroundColor: '#ffffff',
					borderTop: '1px solid rgba(0, 0, 0, 0.08)',
					py: 6,
					position: 'relative',
					zIndex: 1,
				}}
			>
				<Container maxWidth="lg">
					<Grid container spacing={4}>
						<Grid item xs={12} md={4}>
							<Typography
								variant="h6"
								sx={{
									fontWeight: 700,
									mb: 2,
									color: 'rgba(0, 0, 0, 0.87)',
									fontSize: '1.125rem',
								}}
							>
								Synaptis
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: 'rgba(0, 0, 0, 0.6)',
									lineHeight: 1.8,
									fontSize: '0.875rem',
								}}
							>
								Zaawansowana platforma do analizy i monitorowania poziomu stresu wykorzystująca 
								sztuczną inteligencję i sygnały biometryczne.
							</Typography>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography 
								variant="h6" 
								sx={{ 
									fontWeight: 600, 
									mb: 2,
									color: 'rgba(0, 0, 0, 0.87)',
									fontSize: '1rem',
								}}
							>
								Funkcjonalności
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Analiza Biometryczna
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Klasyfikacja Stresu
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Raporty i Statystyki
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Zarządzanie Pacjentami
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography 
								variant="h6" 
								sx={{ 
									fontWeight: 600, 
									mb: 2,
									color: 'rgba(0, 0, 0, 0.87)',
									fontSize: '1rem',
								}}
							>
								Kontakt
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Email: kontakt@example.com
								</Typography>
								<Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
									Telefon: +48 123 456 789
								</Typography>
							</Stack>
						</Grid>
					</Grid>
					<Divider sx={{ my: 4, borderColor: 'rgba(0, 0, 0, 0.08)' }} />
					<Typography
						variant="body2"
						align="center"
						sx={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '0.875rem' }}
					>
						© 2025 Synaptis. Wszelkie prawa zastrzeżone.
					</Typography>
				</Container>
			</Box>

			{/* Scroll to Top Button */}
			<Fab
				aria-label="scroll back to top"
				onClick={scrollToTop}
				sx={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					display: showScrollTop ? 'flex' : 'none',
					zIndex: 1000,
					backgroundColor: '#4A90E2',
					color: '#ffffff',
					boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
					'&:hover': {
						backgroundColor: '#3A7BC8',
						boxShadow: '0 6px 16px rgba(74, 144, 226, 0.5)',
					},
				}}
			>
				<ArrowUpward />
			</Fab>

			<Modal isOpen={modalOpen === 'login'} onClose={closeModal} title="Zaloguj się">
				<LoginForm
					onSuccess={closeModal}
					onSwitchToRegister={() => setModalOpen('register')}
				/>
			</Modal>

			<Modal isOpen={modalOpen === 'register'} onClose={closeModal} title="Utwórz konto">
				<RegistrationForm
					onSuccess={() => setModalOpen('login')}
					onSwitchToLogin={() => setModalOpen('login')}
				/>
			</Modal>
		</Box>
	)
}

export default LandingPage

