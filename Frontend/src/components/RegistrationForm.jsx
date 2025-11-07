import React, { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext' // Importujemy kontekst
import './Form.css'

// onSuccess przekieruje nas do modala logowania
function RegistrationForm({ onSuccess }) {
	const [email, setEmail] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [password, setPassword] = useState('')
	const [password2, setPassword2] = useState('') // Zgodnie z payloadem
	const [error, setError] = useState(null)

	const { registerUser } = useContext(AuthContext)

	const handleSubmit = async e => {
		e.preventDefault()
		setError(null)

		// Walidacja lokalna
		if (password !== password2) {
			setError('Hasła nie są identyczne!')
			return
		}

		try {
			await registerUser(email, password, password2, firstName, lastName)
			alert('Rejestracja pomyślna! Możesz się teraz zalogować.')
			onSuccess() // Przekieruj do logowania
		} catch (err) {
			console.error('Registration error:', err)
			// Error message is already formatted in registerUser function
			setError(err.message || 'Wystąpił błąd podczas rejestracji.')
		}
	}

	return (
		<form onSubmit={handleSubmit} className='form-container'>
			{error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

			<div className='form-group'>
				<label htmlFor='reg-email'>Email</label>
				<input id='reg-email' type='email' value={email} onChange={e => setEmail(e.target.value)} required />
			</div>

			{/* === NOWE POLA === */}
			<div className='form-group'>
				<label htmlFor='reg-firstname'>Imię</label>
				<input id='reg-firstname' type='text' value={firstName} onChange={e => setFirstName(e.target.value)} required />
			</div>
			<div className='form-group'>
				<label htmlFor='reg-lastname'>Nazwisko</label>
				<input id='reg-lastname' type='text' value={lastName} onChange={e => setLastName(e.target.value)} required />
			</div>
			{/* ================== */}

			<div className='form-group'>
				<label htmlFor='reg-password'>Hasło</label>
				<input
					id='reg-password'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
				/>
			</div>
			<div className='form-group'>
				<label htmlFor='reg-confirm-password'>Potwierdź hasło (password2)</label>
				<input
					id='reg-confirm-password'
					type='password'
					value={password2}
					onChange={e => setPassword2(e.target.value)}
					required
				/>
			</div>
			<button type='submit' className='form-button'>
				Zarejestruj
			</button>
		</form>
	)
}

export default RegistrationForm
