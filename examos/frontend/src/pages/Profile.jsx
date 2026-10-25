import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubjects } from '../hooks/useSubjects'
import api, { errorMessage } from '../services/api'
import { Card, Button } from '../components/ui'

export default function Profile() {
  const { user } = useAuth()
  const { subjects, refresh } = useSubjects()
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function addSubject() {
    if (!name.trim()) return
    setError('')
    setCreating(true)
    try {
      await api.post('/api/subjects', { name, exam_date: examDate || null })
      setName('')
      setExamDate('')
      refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  async function removeSubject(id) {
    await api.delete(`/api/subjects/${id}`)
    refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Profile</h1>
        <p className="text-mist text-sm mt-1">Account details and your subjects.</p>
      </div>

      <Card>
        <p className="text-xs text-mist mb-1">Name</p>
        <p className="text-paper text-sm mb-3">{user?.name}</p>
        <p className="text-xs text-mist mb-1">Email</p>
        <p className="text-paper text-sm">{user?.email}</p>
      </Card>

      <Card className="space-y-3">
        <p className="font-serif text-lg text-paper">Subjects</p>
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm border-b border-ink-600 pb-2 last:border-0">
              <div><span className="text-paper">{s.name}</span>{s.exam_date && <span className="text-mist text-xs ml-2">exam {s.exam_date}</span>}</div>
              <button onClick={() => removeSubject(s.id)} className="text-xs text-mist hover:text-coral">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New subject name"
            className="flex-1 bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
            className="bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
          <Button onClick={addSubject} disabled={creating}>Add</Button>
        </div>
        {error && <p className="text-coral text-sm">{error}</p>}
      </Card>
    </div>
  )
}
