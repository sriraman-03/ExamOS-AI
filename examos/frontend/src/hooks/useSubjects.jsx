import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './useAuth'

const SubjectContext = createContext(null)

export function SubjectProvider({ children }) {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    const raw = localStorage.getItem('examos_subject_id')
    return raw ? Number(raw) : null
  })
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await api.get('/api/subjects')
      setSubjects(data)
      if (data.length && !data.find((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(data[0].id)
      }
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (selectedSubjectId) localStorage.setItem('examos_subject_id', String(selectedSubjectId))
  }, [selectedSubjectId])

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null

  return (
    <SubjectContext.Provider
      value={{ subjects, selectedSubject, selectedSubjectId, setSelectedSubjectId, refresh, loading }}
    >
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubjects() {
  return useContext(SubjectContext)
}
