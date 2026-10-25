import { useEffect, useRef, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { useSubjects } from '../hooks/useSubjects'
import { Button, Spinner, Card } from '../components/ui'

const SUGGESTIONS = [
  'Explain this topic in simple words',
  'Summarize my uploaded notes',
  'What are my weak topics?',
  'Give me a 5-mark answer',
]

export default function Chat() {
  const { selectedSubjectId } = useSubjects()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/api/chat/history', { params: { subject_id: selectedSubjectId } }).then((res) => setMessages(res.data))
  }, [selectedSubjectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const message = (text ?? input).trim()
    if (!message || sending) return
    setError('')
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: message, id: `local-${Date.now()}` }])
    setSending(true)
    try {
      const { data } = await api.post('/api/chat/ask', { message, subject_id: selectedSubjectId })
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, sources: data.sources, id: `local-a-${Date.now()}` }])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  async function clearChat() {
    await api.delete('/api/chat/history', { params: { subject_id: selectedSubjectId } })
    setMessages([])
  }

  return (
    <div className="max-w-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-3xl text-paper">ExamOS AI Assistant</h1>
          <p className="text-mist text-sm mt-1">Ask anything about your uploaded materials.</p>
        </div>
        <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={clearChat}>Clear chat</Button>
      </div>

      <div className="flex-1 min-h-[400px] border border-ink-600 rounded-lg bg-ink-800 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <p className="text-mist text-sm">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs border border-ink-500 rounded-full px-3 py-1.5 text-mist hover:text-paper hover:border-mint transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-mint text-ink-900' : 'bg-ink-700 text-paper'
            }`}>
              {m.content}
              {m.sources?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-ink-500/50 space-y-1">
                  {m.sources.map((s, i) => (
                    <p key={i} className="text-xs text-mist">📄 {s.document} — chunk {s.chunk_index}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && <div className="flex justify-start"><Spinner /></div>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-coral text-sm mt-2">{error}</p>}

      <form onSubmit={(e) => { e.preventDefault(); send() }} className="mt-4 flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your materials..."
          className="flex-1 bg-ink-700 border border-ink-500 rounded-md px-3 py-2.5 text-paper text-sm focus-ring"
        />
        <Button type="submit" disabled={sending}>Send</Button>
      </form>
    </div>
  )
}
