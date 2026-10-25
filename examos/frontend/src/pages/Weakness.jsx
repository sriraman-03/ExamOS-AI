import { useEffect, useState } from 'react'
import api from '../services/api'
import { Card, Badge, Progress, EmptyState, Spinner } from '../components/ui'

export default function Weakness() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/weakness').then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Weakness Mode</h1>
        <p className="text-mist text-sm mt-1">Every quiz attempt sharpens this map of where to focus next.</p>
      </div>

      {!data?.topics?.length ? (
        <EmptyState title="No performance data yet" description="Complete a quiz to see your strong, moderate and weak topics here." />
      ) : (
        <>
          <Card>
            <p className="font-serif text-lg text-paper mb-4">Recommendations</p>
            <ul className="space-y-2">
              {data.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-mist leading-relaxed">→ {r}</li>
              ))}
            </ul>
          </Card>

          <div className="space-y-2">
            {data.topics.map((t) => (
              <Card key={t.topic}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-paper text-sm font-medium">{t.topic}</p>
                  <Badge tone={t.classification}>{t.classification} — {t.accuracy.toFixed(0)}%</Badge>
                </div>
                <Progress value={t.accuracy} />
                <p className="text-xs text-mist mt-2">{t.attempts} questions attempted · last score {t.last_accuracy.toFixed(0)}%</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
