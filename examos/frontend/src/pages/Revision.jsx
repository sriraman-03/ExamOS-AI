import { useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Spinner, Badge } from '../components/ui'

export default function Revision() {
  const { selectedSubjectId } = useSubjects()
  const [topic, setTopic] = useState('')
  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [flipped, setFlipped] = useState({})
  const [revealed, setRevealed] = useState({})

  async function generate() {
    if (!topic.trim()) { setError('Enter a topic.'); return }
    setError('')
    setLoading(true)
    setSheet(null)
    try {
      const { data } = await api.post('/api/revision', { subject_id: selectedSubjectId, topic })
      setSheet(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Revision Mode</h1>
        <p className="text-mist text-sm mt-1">A quick, concise sheet to revise before an exam.</p>
      </div>

      <Card className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-mist block mb-1">Topic</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Deadlocks"
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
        </div>
        <Button onClick={generate} disabled={loading}>{loading ? 'Building...' : 'Quick Revision'}</Button>
      </Card>
      {error && <p className="text-coral text-sm">{error}</p>}
      {loading && <div className="flex justify-center py-10"><Spinner /></div>}

      {sheet && (
        <div className="space-y-4">
          <Card>
            <p className="font-serif text-lg text-paper mb-2">{sheet.topic}</p>
            <p className="text-sm text-mist leading-relaxed">{sheet.summary}</p>
          </Card>

          <Card>
            <p className="text-xs text-mint mb-2">Key definitions</p>
            <ul className="text-sm text-mist space-y-1 list-disc list-inside">
              {sheet.key_definitions.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </Card>

          <Card>
            <p className="text-xs text-mint mb-2">Key points</p>
            <ul className="text-sm text-mist space-y-1 list-disc list-inside">
              {sheet.key_points.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </Card>

          <div>
            <p className="text-xs text-mint mb-2">Flashcards — click to flip</p>
            <div className="grid md:grid-cols-2 gap-3">
              {sheet.flashcards.map((f, i) => (
                <button
                  key={i} onClick={() => setFlipped((s) => ({ ...s, [i]: !s[i] }))}
                  className="text-left border border-ink-500 bg-ink-800 rounded-lg p-4 hover:border-mint transition-colors min-h-[90px]"
                >
                  <p className="text-xs text-mist mb-1">{flipped[i] ? 'Answer' : 'Question'}</p>
                  <p className="text-sm text-paper">{flipped[i] ? f.back : f.front}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-mint mb-2">Quick MCQs</p>
            <div className="space-y-2">
              {sheet.quick_mcqs.map((q, i) => (
                <Card key={i}>
                  <p className="text-sm text-paper mb-2">{q.question}</p>
                  <div className="space-y-1 mb-2">
                    {Object.entries(q.options || {}).map(([k, v]) => (
                      <p key={k} className={`text-xs ${revealed[i] && k === q.correct_answer ? 'text-mint' : 'text-mist'}`}>
                        {k}. {v}
                      </p>
                    ))}
                  </div>
                  <button onClick={() => setRevealed((s) => ({ ...s, [i]: true }))} className="text-xs text-mint hover:underline">
                    Reveal answer
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {sheet.demo_mode && <Badge>Demo mode — connect an API key for fully AI-generated revision sheets</Badge>}
        </div>
      )}
    </div>
  )
}
