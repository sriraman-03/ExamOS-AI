import { useEffect, useState, useCallback, useRef } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Card, Button, Badge, EmptyState, Spinner } from '../components/ui'

const DOC_TYPES = [
  { value: 'notes', label: 'Notes' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'textbook', label: 'Textbook' },
  { value: 'pyq', label: 'Previous-year paper' },
]

const STATUS_TONE = { ready: 'strong', processing: 'moderate', failed: 'weak' }

export default function Materials() {
  const { selectedSubjectId } = useSubjects()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('notes')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [pyqAnalysis, setPyqAnalysis] = useState({})
  const fileInputRef = useRef(null)

  async function analyzePyq(id) {
    setPyqAnalysis((p) => ({ ...p, [id]: { loading: true } }))
    try {
      const { data } = await api.get(`/api/pyq/${id}/analyze`)
      setPyqAnalysis((p) => ({ ...p, [id]: { loading: false, data } }))
    } catch (err) {
      setPyqAnalysis((p) => ({ ...p, [id]: { loading: false, error: errorMessage(err) } }))
    }
  }

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/documents').then((res) => setDocuments(res.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleFiles(files) {
    if (!files || !files.length) return
    setError('')
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('doc_type', docType)
      if (selectedSubjectId) form.append('subject_id', selectedSubjectId)
      try {
        await api.post('/api/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch (err) {
        setError(errorMessage(err))
      }
    }
    setUploading(false)
    load()
  }

  async function handleDelete(id) {
    await api.delete(`/api/documents/${id}`)
    load()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-paper">Materials</h1>
        <p className="text-mist text-sm mt-1">Upload your syllabus, notes, textbooks and previous-year papers.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-mist">Document type</label>
          <select
            value={docType} onChange={(e) => setDocType(e.target.value)}
            className="bg-ink-700 border border-ink-500 text-sm text-paper rounded-md px-2 py-1.5 focus-ring"
          >
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-mint bg-mint-soft/30' : 'border-ink-500 hover:border-mist'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2"><Spinner /><p className="text-sm text-mist">Uploading and processing...</p></div>
          ) : (
            <>
              <p className="text-paper text-sm mb-1">Drag and drop a PDF here, or click to browse</p>
              <p className="text-mist text-xs">PDF only, up to 20MB</p>
            </>
          )}
          <input
            ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {error && <p className="text-coral text-sm mt-3">{error}</p>}
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : documents.length === 0 ? (
        <EmptyState title="No materials yet" description="Upload your first PDF to start chatting with it and generating quizzes." />
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-paper text-sm truncate">{d.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{DOC_TYPES.find((t) => t.value === d.doc_type)?.label}</Badge>
                    <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                    {d.status === 'ready' && <span className="text-xs text-mist">{d.num_chunks} chunks</span>}
                  </div>
                  {d.status === 'failed' && <p className="text-coral text-xs mt-1">{d.error_message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {d.doc_type === 'pyq' && d.status === 'ready' && (
                    <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => analyzePyq(d.id)}>
                      Analyze
                    </Button>
                  )}
                  <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => handleDelete(d.id)}>Delete</Button>
                </div>
              </div>
              {pyqAnalysis[d.id]?.loading && <p className="text-xs text-mist mt-3">Analyzing frequent topics...</p>}
              {pyqAnalysis[d.id]?.error && <p className="text-xs text-coral mt-3">{pyqAnalysis[d.id].error}</p>}
              {pyqAnalysis[d.id]?.data && (
                <div className="mt-3 pt-3 border-t border-ink-600">
                  <p className="text-xs text-mist mb-2">{pyqAnalysis[d.id].data.note}</p>
                  <div className="flex flex-wrap gap-2">
                    {pyqAnalysis[d.id].data.frequent_topics.map((t, i) => (
                      <Badge key={i}>{t.topic} × {t.frequency}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
