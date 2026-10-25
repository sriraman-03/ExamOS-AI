import datetime
import random
from typing import List, Optional

from app.ai import prompts
from app.ai.llm_client import call_llm, call_llm_json
from app.config import settings


# ---------------------------------------------------------------- RAG chat
def answer_question(question: str, context_chunks: List[dict]) -> str:
    context_text = "\n\n".join(
        f"[Source: {c['document'].filename}, chunk {c['chunk'].chunk_index}]\n{c['chunk'].content}"
        for c in context_chunks
    )
    if not settings.DEMO_MODE:
        try:
            user_prompt = f"CONTEXT:\n{context_text if context_text else '(no material found)'}\n\nQUESTION:\n{question}"
            return call_llm(prompts.RAG_QA_SYSTEM, user_prompt)
        except Exception:
            pass

    # Demo-mode / fallback: extractive answer from the best-matching chunks
    if not context_chunks:
        return (
            "I couldn't find anything about this in your uploaded materials yet. "
            "Try uploading notes on this topic, or ask me something else your documents cover.\n\n"
            "(Running in demo mode — add an ANTHROPIC_API_KEY to get full generated answers.)"
        )
    best = context_chunks[0]
    snippet = best["chunk"].content.strip()
    snippet = snippet[:600] + ("..." if len(snippet) > 600 else "")
    return (
        f"Based on **{best['document'].filename}**, here's the most relevant passage I found:\n\n"
        f"> {snippet}\n\n"
        "(Demo mode: this is an extractive excerpt from your material rather than a fully generated "
        "explanation. Add an ANTHROPIC_API_KEY for AI-generated answers.)"
    )


# ---------------------------------------------------------------- Study mode
def study_explanation(topic: str, difficulty: str, action: str, context_chunks: List[dict]) -> str:
    context_text = "\n\n".join(c["chunk"].content for c in context_chunks[:4])
    if not settings.DEMO_MODE:
        try:
            user_prompt = (
                f"Topic: {topic}\nDifficulty: {difficulty}\nRequested action: {action}\n\n"
                f"Context from student's materials (may be empty):\n{context_text}"
            )
            return call_llm(prompts.STUDY_MODE_SYSTEM, user_prompt)
        except Exception:
            pass

    action_label = {
        "explain": "Explanation",
        "simpler": "Simpler explanation",
        "example": "Example",
        "five_mark": "5-mark answer",
        "summarize": "Summary",
        "ask_question": "Practice question",
    }.get(action, "Explanation")

    if context_chunks:
        excerpt = context_chunks[0]["chunk"].content.strip()[:500]
        return (
            f"**{action_label}: {topic}** ({difficulty})\n\n"
            f"From your notes: {excerpt}...\n\n"
            "Key points:\n- Review the definition and one worked example\n"
            "- Note any diagrams or formulas linked to this topic\n\n"
            "Follow-up: Can you summarize this topic in your own words?\n\n"
            "(Demo mode — add an ANTHROPIC_API_KEY for fully AI-generated tutoring.)"
        )
    return (
        f"**{action_label}: {topic}** ({difficulty})\n\n"
        f"I don't have uploaded material on {topic} yet, so here's a general study prompt: "
        f"define {topic} in your own words, list 3 key points, and write one example. "
        "Upload your notes on this topic for grounded explanations.\n\n"
        "(Demo mode — add an ANTHROPIC_API_KEY for fully AI-generated tutoring.)"
    )


# ---------------------------------------------------------------- Quiz generation
def _fallback_questions(topic: str, num_questions: int, difficulty: str, qtype: str, context_chunks: List[dict]):
    """Deterministic demo-mode quiz so Quiz Mode is fully clickable without an API key."""
    questions = []
    excerpts = [c["chunk"].content for c in context_chunks] or [
        f"{topic} is an important concept for this subject."
    ]
    for i in range(num_questions):
        excerpt = excerpts[i % len(excerpts)]
        stem = excerpt.strip().split(".")[0][:140] or topic
        if qtype == "true_false":
            questions.append({
                "question": f"True or False: the following statement reflects your material on {topic} — \"{stem}...\"",
                "options": {"A": "True", "B": "False"},
                "correct_answer": "A",
                "explanation": "This statement is drawn directly from your uploaded material.",
                "difficulty": difficulty,
            })
        elif qtype == "short_answer":
            questions.append({
                "question": f"In 3-4 sentences, explain: {topic} (question {i+1}).",
                "options": None,
                "correct_answer": f"A complete answer explains {topic} using the core ideas from your notes, "
                                   f"including at least one example.",
                "explanation": "Full credit requires a definition, one supporting detail, and an example.",
                "difficulty": difficulty,
            })
        else:
            correct = f"{stem}..." if len(stem) > 3 else f"The correct concept related to {topic}"
            distractors = [
                f"An unrelated concept sometimes confused with {topic}",
                f"A common misconception about {topic}",
                f"A partially correct but incomplete description of {topic}",
            ]
            opts = [correct] + distractors
            random.shuffle(opts)
            letter_map = ["A", "B", "C", "D"]
            options = {letter_map[j]: opts[j] for j in range(4)}
            correct_letter = letter_map[opts.index(correct)]
            questions.append({
                "question": f"Which statement best describes {topic}? (Q{i+1})",
                "options": options,
                "correct_answer": correct_letter,
                "explanation": f"This option matches your uploaded material on {topic}.",
                "difficulty": difficulty,
            })
    return questions


def generate_quiz_questions(topic: str, num_questions: int, difficulty: str, qtype: str, context_chunks: List[dict]):
    context_text = "\n\n".join(c["chunk"].content for c in context_chunks[:6])
    if not settings.DEMO_MODE:
        try:
            user_prompt = (
                f"Topic: {topic}\nNumber of questions: {num_questions}\nDifficulty: {difficulty}\n"
                f"Question type: {qtype}\n\nContext from student's material (may be empty):\n{context_text}"
            )
            data = call_llm_json(prompts.QUIZ_GENERATION_SYSTEM, user_prompt, max_tokens=3000)
            if isinstance(data, list) and len(data) > 0:
                return data[:num_questions]
        except Exception:
            pass
    return _fallback_questions(topic, num_questions, difficulty, qtype, context_chunks)


def evaluate_short_answer(question_text: str, model_answer: str, student_answer: str):
    if not settings.DEMO_MODE:
        try:
            user_prompt = (
                f"Question: {question_text}\nModel answer: {model_answer}\nStudent answer: {student_answer}"
            )
            return call_llm_json(prompts.ANSWER_EVALUATION_SYSTEM, user_prompt, max_tokens=400)
        except Exception:
            pass
    # Fallback: crude keyword overlap scoring
    model_words = set(model_answer.lower().split())
    student_words = set((student_answer or "").lower().split())
    overlap = len(model_words & student_words) / max(len(model_words), 1)
    score = round(min(overlap * 150, 100))
    return {
        "is_correct": score >= 60,
        "score_percent": score,
        "feedback": "Demo-mode keyword-overlap scoring. Add an ANTHROPIC_API_KEY for real evaluation.",
    }


# ---------------------------------------------------------------- Weakness
def weakness_recommendations(topic_rows) -> List[str]:
    if not topic_rows:
        return ["Complete a few quizzes to unlock personalized weakness analysis."]
    data_lines = "\n".join(
        f"{t.topic}: {t.accuracy:.0f}% accuracy over {t.attempts} attempts, classified {t.classification}"
        for t in topic_rows
    )
    if not settings.DEMO_MODE:
        try:
            return call_llm(prompts.WEAKNESS_ANALYSIS_SYSTEM, data_lines).split("\n")
        except Exception:
            pass
    weak = [t for t in topic_rows if t.classification == "weak"]
    moderate = [t for t in topic_rows if t.classification == "moderate"]
    recs = []
    for t in weak[:3]:
        recs.append(
            f"You need more practice in {t.topic} ({t.accuracy:.0f}% accuracy). "
            f"Try 10 more practice questions and review the explanations."
        )
    for t in moderate[:2]:
        recs.append(f"{t.topic} is moderate ({t.accuracy:.0f}%) — a quick revision sheet should push it to strong.")
    if not recs:
        recs.append("Great work — all tracked topics are strong. Keep reviewing periodically to retain them.")
    return recs


# ---------------------------------------------------------------- Planner
def _fallback_plan(exam_date: str, hours_per_day: float, weak_topics: List[str], all_topics: List[str]):
    try:
        exam_dt = datetime.date.fromisoformat(exam_date)
    except ValueError:
        exam_dt = datetime.date.today() + datetime.timedelta(days=7)
    days_available = max((exam_dt - datetime.date.today()).days, 1)
    days_available = min(days_available, 21)

    topics = weak_topics + [t for t in all_topics if t not in weak_topics]
    if not topics:
        topics = ["General Revision"]

    slots_per_day = max(int((hours_per_day * 60) // 45), 1)
    plan = []
    topic_cycle = []
    # weight weak topics to repeat more often
    for t in weak_topics:
        topic_cycle.extend([t, t])
    topic_cycle.extend(all_topics or weak_topics or ["General Revision"])
    if not topic_cycle:
        topic_cycle = ["General Revision"]

    idx = 0
    start_hour, start_min = 9, 0
    for day in range(1, days_available + 1):
        tasks = []
        h, m = start_hour, start_min
        for slot in range(slots_per_day):
            topic = topic_cycle[idx % len(topic_cycle)]
            idx += 1
            duration = 45 if slot < slots_per_day - 1 else 20
            task_type = "quiz" if slot == slots_per_day - 1 else ("revision" if slot % 3 == 2 else "study")
            end_h, end_m = h, m + duration
            if end_m >= 60:
                end_h += 1
                end_m -= 60
            tasks.append({
                "start_time": f"{h:02d}:{m:02d}",
                "end_time": f"{end_h:02d}:{end_m:02d}",
                "topic": topic,
                "task_type": task_type,
            })
            h, m = end_h, end_m
            if m >= 60:
                h += 1
                m -= 60
            h += 0
            m += 10
            if m >= 60:
                h += 1
                m -= 60
        plan.append({"day_number": day, "tasks": tasks})
    return plan


def generate_study_plan(subject_name, exam_date, hours_per_day, prep_level, weak_topics, all_topics):
    if not settings.DEMO_MODE:
        try:
            user_prompt = (
                f"Subject: {subject_name}\nExam date: {exam_date}\nHours per day: {hours_per_day}\n"
                f"Preparation level: {prep_level}\nWeak topics: {weak_topics}\nAll topics: {all_topics}"
            )
            data = call_llm_json(prompts.STUDY_PLANNING_SYSTEM, user_prompt, max_tokens=3000)
            if isinstance(data, list) and data:
                return data
        except Exception:
            pass
    return _fallback_plan(exam_date, hours_per_day, weak_topics, all_topics)


# ---------------------------------------------------------------- Revision
def generate_revision_sheet(topic: str, context_chunks: List[dict]):
    context_text = "\n\n".join(c["chunk"].content for c in context_chunks[:6])
    if not settings.DEMO_MODE:
        try:
            data = call_llm_json(prompts.REVISION_SYSTEM, f"Topic: {topic}\n\nContext:\n{context_text}", max_tokens=2000)
            data["demo_mode"] = False
            return data
        except Exception:
            pass

    excerpt = context_chunks[0]["chunk"].content.strip()[:400] if context_chunks else f"{topic} core concepts."
    return {
        "topic": topic,
        "summary": f"{topic} covers the core ideas found in your uploaded material: {excerpt[:200]}...",
        "key_definitions": [f"{topic}: see your uploaded notes for the exact definition."],
        "key_points": [
            f"Review the main definition of {topic}",
            "Note any diagrams, formulas or examples linked to it",
            "Compare it with related topics you've studied",
        ],
        "flashcards": [
            {"front": f"What is {topic}?", "back": excerpt[:120] + "..."},
            {"front": f"Give one example of {topic}.", "back": "See your notes for a worked example."},
        ],
        "quick_mcqs": _fallback_questions(topic, 3, "medium", "mcq", context_chunks),
        "demo_mode": True,
    }


# ---------------------------------------------------------------- PYQ analysis
def analyze_pyq(text: str, known_topics: Optional[List[str]] = None):
    if not settings.DEMO_MODE:
        try:
            return call_llm_json(prompts.PYQ_ANALYSIS_SYSTEM, text[:8000], max_tokens=1500)
        except Exception:
            pass
    # Fallback: naive keyword frequency against known topics, or top capitalized phrases
    topics = known_topics or []
    counts = []
    lower_text = text.lower()
    for t in topics:
        freq = lower_text.count(t.lower())
        if freq > 0:
            counts.append({"topic": t, "frequency": freq, "note": "Frequency based on keyword matches in the uploaded paper text."})
    if not counts:
        counts = [{"topic": "General", "frequency": 1, "note": "Upload more previous-year papers or tag subject topics for a detailed breakdown."}]
    return sorted(counts, key=lambda x: -x["frequency"])
