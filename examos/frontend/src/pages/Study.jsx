import { useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Spinner } from '../components/ui'

const ACTIONS = [
  { value: 'explain', label: 'Explain simpler' },
  { value: 'example', label: 'Give an example' },
  { value: 'five_mark', label: 'Give a 5-mark answer' },
  { value: 'summarize', label: 'Summarize this' },
  { value: 'ask_question', label: 'Ask me a question' },
]

export default function Study() {
  const { selectedSubjectId } = useSubjects()
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [thread, setThread] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)

  async function ask(action) {
    if (!topic.trim()) { setError('Enter a topic to start.'); return }
    setError('')
    setLoading(true)
    setStarted(true)
    try {
      const { data } = await api.post('/api/study', { subject_id: selectedSubjectId, topic, difficulty, action })
      setThread((t) => [...t, { action, response: data.response }])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Study Mode</h1>
        <p className="text-mist text-sm mt-1">Learn a topic interactively, one step at a time.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-mist block mb-1">Topic</label>
          <input
            value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Congestion Control"
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
          />
        </div>
        <div>
          <label className="text-xs text-mist block mb-1">Difficulty</label>
          <select
            value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="bg-ink-700 border border-ink-500 text-sm text-paper rounded-md px-3 py-2 focus-ring"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <Button onClick={() => ask('explain')} disabled={loading}>Explain topic</Button>
      </Card>

      {error && <p className="text-coral text-sm">{error}</p>}

      {started && (
        <div className="space-y-4">
          {thread.map((t, i) => (
            <Card key={i}>
              <p className="text-xs text-mint mb-2">{ACTIONS.find((a) => a.value === t.action)?.label || 'Explanation'}</p>
              <p className="text-paper text-sm whitespace-pre-wrap leading-relaxed">{t.response}</p>
            </Card>
          ))}
          {loading && <div className="flex justify-center py-4"><Spinner /></div>}
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <Button key={a.value} variant="secondary" className="text-xs" onClick={() => ask(a.value)} disabled={loading}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
