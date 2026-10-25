import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Progress, EmptyState, Spinner } from '../components/ui'

export default function Planner() {
  const { selectedSubject, selectedSubjectId } = useSubjects()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    exam_date: '', hours_per_day: 2, prep_level: 'beginner', weak_topics: '', all_topics: '',
  })

  useEffect(() => {
    api.get('/api/planner').then((res) => setPlans(res.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSubject?.exam_date) setForm((f) => ({ ...f, exam_date: selectedSubject.exam_date }))
  }, [selectedSubject])

  async function generate() {
    if (!form.exam_date) { setError('Set an exam date.'); return }
    setError('')
    setGenerating(true)
    try {
      const { data } = await api.post('/api/planner/generate', {
        subject_id: selectedSubjectId,
        subject_name: selectedSubject?.name || 'General',
        exam_date: form.exam_date,
        hours_per_day: Number(form.hours_per_day),
        prep_level: form.prep_level,
        weak_topics: form.weak_topics.split(',').map((t) => t.trim()).filter(Boolean),
        all_topics: form.all_topics.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setPlans((p) => [data, ...p])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function updateStatus(planId, taskId, status) {
    await api.patch(`/api/planner/tasks/${taskId}`, { status })
    setPlans((prev) => prev.map((p) => {
      if (p.id !== planId) return p
      const tasks = p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
      const done = tasks.filter((t) => t.status === 'completed').length
      return { ...p, tasks, completion_percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
    }))
  }

  const latestPlan = plans[0]
  const days = latestPlan ? [...new Set(latestPlan.tasks.map((t) => t.day_number))].sort((a, b) => a - b) : []

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Planner Mode</h1>
        <p className="text-mist text-sm mt-1">A day-by-day plan that prioritizes your weak topics.</p>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-mist block mb-1">Exam date</label>
            <input type="date" value={form.exam_date} onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))}
              className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
          </div>
          <div>
            <label className="text-xs text-mist block mb-1">Hours per day</label>
            <input type="number" min={0.5} step={0.5} value={form.hours_per_day}
              onChange={(e) => setForm((f) => ({ ...f, hours_per_day: e.target.value }))}
              className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
          </div>
        </div>
        <div>
          <label className="text-xs text-mist block mb-1">Preparation level</label>
          <select value={form.prep_level} onChange={(e) => setForm((f) => ({ ...f, prep_level: e.target.value }))}
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring">
            <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-mist block mb-1">Weak topics (comma-separated)</label>
          <input value={form.weak_topics} onChange={(e) => setForm((f) => ({ ...f, weak_topics: e.target.value }))}
            placeholder="Congestion Control, Deadlocks"
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
        </div>
        <div>
          <label className="text-xs text-mist block mb-1">All topics (comma-separated)</label>
          <input value={form.all_topics} onChange={(e) => setForm((f) => ({ ...f, all_topics: e.target.value }))}
            placeholder="OSI Model, TCP/IP, Routing"
            className="w-full bg-ink-700 border border-ink-500 rounded-md px-3 py-2 text-paper text-sm focus-ring" />
        </div>
        {error && <p className="text-coral text-sm">{error}</p>}
        <Button onClick={generate} disabled={generating}>{generating ? 'Building plan...' : 'Generate plan'}</Button>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !latestPlan ? (
        <EmptyState title="No study plan yet" description="Fill in the form above to generate your first personalized plan." />
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-serif text-lg text-paper">Latest plan</p>
              <span className="text-sm text-mist">{latestPlan.completion_percent.toFixed(0)}% complete</span>
            </div>
            <Progress value={latestPlan.completion_percent} />
          </div>
          {days.map((day) => (
            <Card key={day}>
              <p className="text-xs text-mint mb-3">DAY {day}</p>
              <div className="space-y-2">
                {latestPlan.tasks.filter((t) => t.day_number === day).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm border-b border-ink-600 last:border-0 pb-2 last:pb-0">
                    <div>
                      <span className="text-mist text-xs mr-2">{t.start_time}–{t.end_time}</span>
                      <span className="text-paper">{t.topic}</span>
                      <span className="text-mist text-xs ml-2">({t.task_type})</span>
                    </div>
                    <select
                      value={t.status} onChange={(e) => updateStatus(latestPlan.id, t.id, e.target.value)}
                      className="bg-ink-700 border border-ink-500 text-xs text-paper rounded px-2 py-1 focus-ring"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
