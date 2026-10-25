import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { errorMessage } from '../services/api'
import { Button } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-xl text-paper block text-center mb-8">ExamOS AI</Link>
        <div className="border border-ink-600 bg-ink-800 rounded-lg p-6">
          <p className="font-serif text-2xl text-paper mb-1">Create your account</p>
          <p className="text-mist text-sm mb-6">We'll set up a sample subject so you can explore right away.</p>
          {error && <p className="text-coral text-sm mb-4 bg-coral-soft rounded-md px-3 py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-mist block mb-1">Name</label>
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
              <p className="text-xs text-mist mt-1">At least 6 characters.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-mist mt-6">
          Already have an account? <Link to="/login" className="text-mint hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
