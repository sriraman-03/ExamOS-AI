import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SubjectProvider } from './hooks/useSubjects'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Chat from './pages/Chat'
import Study from './pages/Study'
import Quiz from './pages/Quiz'
import Weakness from './pages/Weakness'
import Planner from './pages/Planner'
import Revision from './pages/Revision'
import Exam from './pages/Exam'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <SubjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
            >
              <Route index element={<Dashboard />} />
              <Route path="materials" element={<Materials />} />
              <Route path="chat" element={<Chat />} />
              <Route path="study" element={<Study />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="weakness" element={<Weakness />} />
              <Route path="planner" element={<Planner />} />
              <Route path="revision" element={<Revision />} />
              <Route path="exam" element={<Exam />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SubjectProvider>
    </AuthProvider>
  )
}
