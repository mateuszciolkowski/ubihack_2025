import React, { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext' // Importujemy kontekst
import './Form.css'

// Otrzymujemy props 'onSuccess', aby zamknąć modal
function LoginForm({ onSuccess }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState(null) // Stan do obsługi błędów API

	// Pobieramy funkcję logowania z kontekstu
	const { loginUser } = useContext(AuthContext)

	const handleSubmit = async e => {
		e.preventDefault()
		setError(null) // Resetuj błąd

		try {
			// Wywołujemy logikę logowania z kontekstu
			await loginUser(email, password)
			// Jeśli logowanie się powiodło (nie rzuciło błędu), zamykamy modal
			onSuccess()
		} catch (err) {
			// Jeśli API zwróci błąd (np. 401 Unauthorized)
			console.error('Login error:', err)
			setError(err.message || 'Nieprawidłowy email lub hasło.')
		}
	}

	return (
		<form onSubmit={handleSubmit} className='form-container'>
			{/* Wyświetlanie błędu logowania */}
			{error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

			<div className='form-group'>
				<label htmlFor='login-email'>Email</label>
				<input id='login-email' type='email' value={email} onChange={e => setEmail(e.target.value)} required />
			</div>
			<div className='form-group'>
				<label htmlFor='login-password'>Hasło</label>
				<input
					id='login-password'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
				/>
			</div>
			<button type='submit' className='form-button'>
				Zaloguj
			</button>
		</form>
	)
}

export default LoginForm
