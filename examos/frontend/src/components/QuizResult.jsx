import { Card, Badge, Progress } from './ui'

export default function QuizResult({ result }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 text-center">
        <Card><p className="text-2xl font-serif text-paper">{result.accuracy.toFixed(0)}%</p><p className="text-xs text-mist mt-1">Accuracy</p></Card>
        <Card><p className="text-2xl font-serif text-mint">{result.correct_count}</p><p className="text-xs text-mist mt-1">Correct</p></Card>
        <Card><p className="text-2xl font-serif text-coral">{result.wrong_count}</p><p className="text-xs text-mist mt-1">Wrong</p></Card>
        <Card><p className="text-2xl font-serif text-mist">{result.unanswered_count}</p><p className="text-xs text-mist mt-1">Unanswered</p></Card>
      </div>
      <Progress value={result.accuracy} />
      {result.next_difficulty && (
        <p className="text-sm text-mist">Adaptive difficulty for your next quiz: <Badge>{result.next_difficulty}</Badge></p>
      )}

      <div className="space-y-3">
        <p className="font-serif text-lg text-paper">Review</p>
        {result.graded_answers.map((g) => (
          <Card key={g.question_id} className={g.is_correct ? 'border-mint/30' : 'border-coral/30'}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-paper flex-1">{g.question_text}</p>
              <Badge tone={g.is_correct ? 'strong' : 'weak'}>{g.is_correct ? 'Correct' : 'Incorrect'}</Badge>
            </div>
            <p className="text-xs text-mist mt-2">Your answer: {g.selected_answer || '—'}</p>
            {!g.is_correct && <p className="text-xs text-mint mt-1">Correct answer: {g.correct_answer}</p>}
            {g.explanation && <p className="text-xs text-mist mt-2 border-t border-ink-600 pt-2">{g.explanation}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
