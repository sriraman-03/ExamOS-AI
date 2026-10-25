import { useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Spinner } from '../components/ui'
import QuizRunner from '../components/QuizRunner'
import QuizResult from '../components/QuizResult'

export default function Quiz() {
  const { selectedSubjectId } = useSubjects()
  const [config, setConfig] = useState({
    topic: '', num_questions: 5, difficulty: 'medium', question_type: 'mcq', is_adaptive: false,
  })
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function generate(overrideDifficulty) {
    if (!config.topic.trim()) { setError('Enter a topic to generate a quiz.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/api/quiz/generate', {
        subject_id: selectedSubjectId,
        topic: config.topic,
        num_questions: Number(config.num_questions),
        difficulty: overrideDifficulty || config.difficulty,
        question_type: config.question_type,
        is_adaptive: config.is_adaptive,
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

  function reset() {
    setQuiz(null)
    setResult(null)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Quiz Mode</h1>
        <p className="text-mist text-sm mt-1">Generate a quiz from your uploaded material and test yourself.</p>
      </div>

      {!quiz && (
        <Card className="space-y-4">
          <div>
            <label className="text-xs text-mist block mb-1">Topic</label>
            <input
              value={config.topic} onChange={(e) => setConfig((c) => ({ ...c, topic: e.target.value }))}
              placeholder="e.g. Congestion Control"
              className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-mist block mb-1">Questions</label>
              <input
                type="number" min={1} max={30} value={config.num_questions}
                onChange={(e) => setConfig((c) => ({ ...c, num_questions: e.target.value }))}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Difficulty</label>
              <select value={config.difficulty} onChange={(e) => setConfig((c) => ({ ...c, difficulty: e.target.value }))}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Type</label>
              <select value={config.question_type} onChange={(e) => setConfig((c) => ({ ...c, question_type: e.target.value }))}
                className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring">
                <option value="mcq">MCQ</option><option value="true_false">True/False</option><option value="short_answer">Short Answer</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-mist">
            <input type="checkbox" checked={config.is_adaptive} onChange={(e) => setConfig((c) => ({ ...c, is_adaptive: e.target.checked }))} />
            Adaptive difficulty (adjusts based on your performance)
          </label>
          {error && <p className="text-coral text-sm">{error}</p>}
          <Button onClick={() => generate()} disabled={loading}>{loading ? 'Generating...' : 'Generate quiz'}</Button>
        </Card>
      )}

      {loading && <div className="flex justify-center py-10"><Spinner /></div>}

      {quiz && !result && <QuizRunner quiz={quiz} onSubmit={submit} submitting={submitting} />}

      {result && (
        <div className="space-y-4">
          <QuizResult result={result} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={reset}>New quiz</Button>
            {result.next_difficulty && (
              <Button onClick={() => { reset(); generate(result.next_difficulty); }}>
                Next adaptive quiz ({result.next_difficulty})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
