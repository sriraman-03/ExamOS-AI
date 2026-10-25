import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Badge } from './ui'

export default function QuizRunner({ quiz, isExam = false, onSubmit, submitting }) {
  const [answers, setAnswers] = useState({})
  const [marked, setMarked] = useState({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(isExam && quiz.duration_minutes ? quiz.duration_minutes * 60 : null)

  const question = quiz.questions[current]

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) { handleSubmit(); return }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  const timeLabel = useMemo(() => {
    if (secondsLeft === null) return null
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [secondsLeft])

  function select(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }))
  }

  function toggleMark(qid) {
    setMarked((m) => ({ ...m, [qid]: !m[qid] }))
  }

  function handleSubmit() {
    const payload = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? null,
      marked_for_review: !!marked[q.id],
    }))
    onSubmit(payload)
  }

  const answeredCount = Object.keys(answers).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-mist text-sm">Question {current + 1} of {quiz.questions.length} — {answeredCount} answered</p>
        {timeLabel && <Badge tone={secondsLeft < 60 ? 'weak' : 'default'}>⏱ {timeLabel}</Badge>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quiz.questions.map((q, i) => (
          <button
            key={q.id} onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
              i === current ? 'bg-mint text-ink-900'
              : marked[q.id] ? 'bg-amber-soft text-amber border border-amber/40'
              : answers[q.id] !== undefined ? 'bg-ink-600 text-paper'
              : 'bg-ink-700 text-mist border border-ink-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card>
        <p className="text-paper text-sm leading-relaxed mb-4">{question.question_text}</p>

        {question.question_type === 'short_answer' ? (
          <textarea
            rows={4}
            value={answers[question.id] || ''}
            onChange={(e) => select(question.id, e.target.value)}
            placeholder="Write your answer..."
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring"
          />
        ) : (
          <div className="space-y-2">
            {Object.entries(question.options || {}).map(([key, text]) => (
              <button
                key={key}
                onClick={() => select(question.id, key)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm border transition-colors ${
                  answers[question.id] === key
                    ? 'border-mint bg-mint-soft/40 text-paper'
                    : 'border-ink-500 text-mist hover:text-paper hover:border-mist'
                }`}
              >
                <span className="text-mint mr-2">{key}.</span>{text}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <button onClick={() => toggleMark(question.id)} className="text-xs text-amber hover:underline">
            {marked[question.id] ? 'Unmark review' : 'Mark for review'}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" className="text-xs px-3 py-1.5" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>Previous</Button>
            {current < quiz.questions.length - 1 ? (
              <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => setCurrent((c) => c + 1)}>Next</Button>
            ) : (
              <Button className="text-xs px-3 py-1.5" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
