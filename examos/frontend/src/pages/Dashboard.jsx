import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Card, Progress, Badge, Button, Spinner } from '../components/ui'

const QUICK_ACTIONS = [
  { to: '/app/study', label: 'Study' },
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/quiz', label: 'Quiz' },
  { to: '/app/planner', label: 'Planner' },
  { to: '/app/weakness', label: 'Weakness' },
  { to: '/app/revision', label: 'Revision' },
  { to: '/app/exam', label: 'Mock Exam' },
  { to: '/app/analytics', label: 'Analytics' },
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard').then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">{greeting}, {data?.greeting_name?.split(' ')[0]} 👋</h1>
        <p className="text-mist text-sm mt-1">Here's where your preparation stands today.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-mist mb-2">Upcoming exam</p>
          {data?.upcoming_exam ? (
            <>
              <p className="font-serif text-xl text-paper">{data.upcoming_exam.subject}</p>
              <p className="text-mint text-sm mt-1">{data.upcoming_exam.days_remaining} days remaining</p>
            </>
          ) : (
            <p className="text-mist text-sm">No exam date set. Add one in a subject.</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-mist mb-2">Overall progress</p>
          <p className="font-serif text-3xl text-paper mb-2">{data?.overall_progress ?? 0}%</p>
          <Progress value={data?.overall_progress ?? 0} />
        </Card>
        <Card>
          <p className="text-xs text-mist mb-2">Today's recommendation</p>
          {data?.recommendation ? (
            <>
              <p className="text-paper text-sm font-medium">{data.recommendation.title}</p>
              <p className="text-mist text-xs mt-1 mb-3">{data.recommendation.reason}</p>
              <Link to="/app/revision"><Button variant="secondary" className="text-xs px-3 py-1.5">Start Revision</Button></Link>
            </>
          ) : (
            <p className="text-mist text-sm">Complete a quiz to unlock recommendations.</p>
          )}
        </Card>
      </div>

      <div>
        <p className="text-xs text-mist mb-2">Quick actions</p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to} to={a.to}
              className="text-center text-sm border border-ink-500 rounded-md py-3 text-mist hover:text-paper hover:border-mint transition-colors"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="font-serif text-lg text-paper mb-3">Weak topics</p>
          {data?.weak_topics?.length ? (
            <ul className="space-y-2">
              {data.weak_topics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between text-sm">
                  <span className="text-mist">{t.topic}</span>
                  <Badge tone={t.accuracy < 50 ? 'weak' : 'moderate'}>{t.accuracy.toFixed(0)}%</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mist text-sm">Take some quizzes to see weak topics here.</p>
          )}
        </Card>
        <Card>
          <p className="font-serif text-lg text-paper mb-3">Recent performance</p>
          {data?.recent_performance?.length ? (
            <ul className="space-y-2">
              {data.recent_performance.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-mist">{p.date}</span>
                  <span className="text-paper">{p.accuracy.toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mist text-sm">No quiz attempts yet.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
