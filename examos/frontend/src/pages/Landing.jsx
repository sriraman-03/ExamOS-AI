import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'AI Study Assistant', desc: 'Chat with your own notes and get grounded, sourced answers.' },
  { title: 'PDF Intelligence', desc: 'Upload syllabus, textbooks and papers — ExamOS reads and indexes them.' },
  { title: 'Smart Quiz Generation', desc: 'Generate MCQ, true/false and short-answer quizzes from your material.' },
  { title: 'Weakness Detection', desc: 'Every attempt sharpens a topic-by-topic map of strong, moderate and weak areas.' },
  { title: 'Personalized Planning', desc: 'A day-by-day study plan that prioritizes what you actually need to revise.' },
  { title: 'Mock Exams', desc: 'Timed, navigable, realistic exam conditions before the real thing.' },
  { title: 'Performance Analytics', desc: 'Track accuracy, trend lines and topic strength over the whole term.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-900 text-paper">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-serif text-xl">ExamOS AI</span>
        <nav className="flex items-center gap-6">
          <Link to="/login" className="text-sm text-mist hover:text-paper transition-colors">Log in</Link>
          <Link to="/register" className="text-sm bg-mint text-ink-900 px-4 py-2 rounded-md font-medium hover:bg-mint/90 transition-colors">
            Get Started
          </Link>
        </nav>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="text-mint text-sm mb-4 tracking-wide">Your Personal AI Exam Operating System</p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] mb-6">
          Study smarter with the notes<br className="hidden md:block" /> you already have.
        </h1>
        <p className="text-mist text-lg max-w-2xl mx-auto mb-10">
          Chat with your notes, generate quizzes, identify weak topics and prepare with an
          AI-powered personalized study system built around your own materials.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="bg-mint text-ink-900 px-6 py-3 rounded-md font-medium hover:bg-mint/90 transition-colors">
            Get Started
          </Link>
          <a href="#features" className="border border-ink-500 px-6 py-3 rounded-md font-medium text-mist hover:text-paper hover:border-mist transition-colors">
            Explore Features
          </a>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-ink-600 rounded-lg p-6 bg-ink-800 border-t-2 border-t-mint/40">
              <p className="font-serif text-lg mb-2">{f.title}</p>
              <p className="text-mist text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-600 py-8 text-center text-mist text-sm">
        ExamOS AI — built to turn your own materials into a complete exam preparation system.
      </footer>
    </div>
  )
}
