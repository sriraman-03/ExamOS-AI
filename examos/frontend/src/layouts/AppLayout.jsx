import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubjects } from '../hooks/useSubjects'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: '◆', end: true },
  { to: '/app/materials', label: 'Materials', icon: '▤' },
  { to: '/app/chat', label: 'AI Chat', icon: '◈' },
  { to: '/app/study', label: 'Study Mode', icon: '✎' },
  { to: '/app/quiz', label: 'Quiz Mode', icon: '?' },
  { to: '/app/weakness', label: 'Weakness Mode', icon: '△' },
  { to: '/app/planner', label: 'Planner', icon: '▦' },
  { to: '/app/revision', label: 'Revision', icon: '↻' },
  { to: '/app/exam', label: 'Exam Mode', icon: '⏱' },
  { to: '/app/analytics', label: 'Analytics', icon: '▲' },
  { to: '/app/profile', label: 'Profile', icon: '●' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { subjects, selectedSubjectId, setSelectedSubjectId } = useSubjects()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-ink-900">
      <aside className="w-60 shrink-0 border-r border-ink-600 flex flex-col">
        <div className="px-5 py-5 border-b border-ink-600">
          <p className="font-serif text-xl text-paper leading-none">ExamOS AI</p>
          <p className="text-xs text-mist mt-1">Exam Operating System</p>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-ink-600 text-paper' : 'text-mist hover:text-paper hover:bg-ink-700'
                }`
              }
            >
              <span className="w-4 text-center text-mint">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-600">
          <p className="text-xs text-mist px-2 mb-1">Signed in as</p>
          <p className="text-sm text-paper px-2 truncate">{user?.name}</p>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="mt-3 w-full text-left px-2 py-1.5 text-sm text-mist hover:text-coral transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-ink-600 flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <span className="text-xs text-mist">Subject</span>
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="bg-ink-700 border border-ink-500 text-sm text-paper rounded-md px-2 py-1.5 focus-ring"
            >
              {subjects.length === 0 && <option value="">No subjects yet</option>}
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
