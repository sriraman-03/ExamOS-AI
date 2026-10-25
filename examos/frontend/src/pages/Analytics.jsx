import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../services/api'
import { Card, Spinner, Progress, EmptyState } from '../components/ui'

const COLORS = ['#4FD1B5', '#F0715E']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/analytics').then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!data || data.total_quizzes === 0) {
    return <EmptyState title="No analytics yet" description="Complete a few quizzes to see your performance trends here." />
  }

  const pieData = [
    { name: 'Correct', value: data.correct_vs_incorrect.correct },
    { name: 'Incorrect', value: data.correct_vs_incorrect.incorrect },
  ]

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Analytics</h1>
        <p className="text-mist text-sm mt-1">Your preparation, quantified.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><p className="text-xs text-mist mb-2">Overall accuracy</p><p className="font-serif text-3xl text-paper">{data.overall_accuracy}%</p></Card>
        <Card><p className="text-xs text-mist mb-2">Quizzes completed</p><p className="font-serif text-3xl text-paper">{data.total_quizzes}</p></Card>
        <Card><p className="text-xs text-mist mb-2">Questions attempted</p><p className="font-serif text-3xl text-paper">{data.questions_attempted}</p></Card>
        <Card><p className="text-xs text-mist mb-2">Average score</p><p className="font-serif text-3xl text-paper">{data.average_score}%</p></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="font-serif text-lg text-paper mb-4">Score improvement</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.score_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232B41" />
              <XAxis dataKey="attempt" stroke="#8A93A8" fontSize={12} />
              <YAxis stroke="#8A93A8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#131826', border: '1px solid #333D57' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#4FD1B5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="font-serif text-lg text-paper mb-4">Topic accuracy</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topic_accuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232B41" />
              <XAxis dataKey="topic" stroke="#8A93A8" fontSize={10} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#8A93A8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#131826', border: '1px solid #333D57' }} />
              <Bar dataKey="accuracy" fill="#4FD1B5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="font-serif text-lg text-paper mb-4">Correct vs incorrect</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131826', border: '1px solid #333D57' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="font-serif text-lg text-paper mb-4">Strong vs weak topics</p>
          <div className="space-y-3">
            {data.strong_topics.slice(0, 3).map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-xs text-mist mb-1"><span>{t.topic}</span><span>{t.accuracy}%</span></div>
                <Progress value={t.accuracy} />
              </div>
            ))}
            {data.weak_topics.slice(0, 3).map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-xs text-mist mb-1"><span>{t.topic}</span><span>{t.accuracy}%</span></div>
                <Progress value={t.accuracy} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
