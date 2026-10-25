import { useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Spinner, Badge } from '../components/ui'
import QuizRunner from '../components/QuizRunner'
import QuizResult from '../components/QuizResult'

export default function Exam() {
  const { selectedSubjectId } = useSubjects()
  const [config, setConfig] = useState({ topic: '', num_questions: 10, duration_minutes: 15 })
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!config.topic.trim()) { setError('Enter one or more topics (comma-separated) to build the exam.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/quiz/generate', {
        subject_id: selectedSubjectId,
        topic: config.topic,
        num_questions: Number(config.num_questions),
        difficulty: 'medium',
        question_type: 'mcq',
        is_exam: true,
        duration_minutes: Number(config.duration_minutes),
      })
      setQuiz(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function submit(answers) {
    setSubmitting(true)
    try {
      const { data } = await api.post(`/api/quiz/${quiz.id}/submit`, { answers })
      setResult(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Exam Mode</h1>
        <p className="text-mist text-sm mt-1">A realistic, timed mock exam. Answers stay hidden until you submit.</p>
      </div>

      {!quiz && (
        <Card className="space-y-4">
          <div>
            <label className="text-xs text-mist block mb-1">Topic(s)</label>
            <input
              value={config.topic} onChange={(e) => setConfig((c) => ({ ...c, topic: e.target.value }))}
              placeholder="e.g. Congestion Control, Routing"
              className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mist block mb-1">Number of questions</label>
              <input
                type="number" min={1} max={30} value={config.num_questions}
                onChange={(e) => setConfig((c) => ({ ...c, num_questions: e.target.value }))}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Duration (minutes)</label>
              <input
                type="number" min={1} max={180} value={config.duration_minutes}
                onChange={(e) => setConfig((c) => ({ ...c, duration_minutes: e.target.value }))}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
            </div>
          </div>
          {error && <p className="text-coral text-sm">{error}</p>}
          <Button onClick={generate} disabled={loading}>{loading ? 'Preparing exam...' : 'Start exam'}</Button>
        </Card>
      )}

      {loading && <div className="flex justify-center py-10"><Spinner /></div>}

      {quiz && !result && (
        <>
          <Badge tone="moderate">Exam in progress — answers are hidden until submission</Badge>
          <QuizRunner quiz={quiz} isExam onSubmit={submit} submitting={submitting} />
        </>
      )}

      {result && <QuizResult result={result} />}
    </div>
  )
}
