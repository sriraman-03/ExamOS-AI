from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, Quiz, Question, QuizAttempt, Answer
from app.models.schemas import (
    QuizGenerateRequest, QuizOut, QuizSubmitRequest, QuizResultOut, GradedAnswer,
)
from app.utils.security import get_current_user
from app.rag.retriever import retrieve_top_chunks
from app.ai.generators import generate_quiz_questions, evaluate_short_answer
from app.services.performance import update_topic_performance, next_adaptive_difficulty

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizOut)
def generate(payload: QuizGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.num_questions < 1 or payload.num_questions > 30:
        raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 30.")

    chunks = retrieve_top_chunks(db, current_user.id, payload.topic, payload.subject_id, top_k=8)
    raw_questions = generate_quiz_questions(
        payload.topic, payload.num_questions, payload.difficulty, payload.question_type, chunks
    )

    quiz = Quiz(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        topic=payload.topic,
        difficulty=payload.difficulty,
        question_type=payload.question_type,
        is_adaptive=payload.is_adaptive,
        is_exam=payload.is_exam,
        duration_minutes=payload.duration_minutes,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for i, q in enumerate(raw_questions):
        db.add(Question(
            quiz_id=quiz.id,
            topic=payload.topic,
            difficulty=q.get("difficulty", payload.difficulty),
            question_text=q["question"],
            question_type=payload.question_type,
            options=q.get("options"),
            correct_answer=str(q["correct_answer"]),
            explanation=q.get("explanation"),
            order_index=i,
        ))
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizResultOut)
def submit(quiz_id: int, payload: QuizSubmitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = {q.id: q for q in quiz.questions}
    answer_map = {a.question_id: a for a in payload.answers}

    attempt = QuizAttempt(quiz_id=quiz.id, user_id=current_user.id, total_questions=len(questions))
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    graded = []

    for qid, question in questions.items():
        submitted = answer_map.get(qid)
        selected = submitted.selected_answer if submitted else None
        marked = submitted.marked_for_review if submitted else False

        if selected is None or selected == "":
            unanswered_count += 1
            is_correct = False
        elif question.question_type == "short_answer":
            eval_result = evaluate_short_answer(question.question_text, question.correct_answer, selected)
            is_correct = bool(eval_result.get("is_correct"))
            if is_correct:
                correct_count += 1
            else:
                wrong_count += 1
        else:
            is_correct = selected.strip().upper() == question.correct_answer.strip().upper()
            if is_correct:
                correct_count += 1
            else:
                wrong_count += 1

        db.add(Answer(
            attempt_id=attempt.id, question_id=qid, selected_answer=selected,
            is_correct=is_correct, marked_for_review=marked,
        ))
        graded.append(GradedAnswer(
            question_id=qid,
            question_text=question.question_text,
            selected_answer=selected,
            correct_answer=question.correct_answer,
            is_correct=is_correct,
            explanation=question.explanation,
            topic=question.topic,
        ))

    total = len(questions)
    accuracy = round((correct_count / total) * 100, 1) if total else 0.0
    attempt.correct_count = correct_count
    attempt.wrong_count = wrong_count
    attempt.unanswered_count = unanswered_count
    attempt.accuracy = accuracy
    db.commit()

    update_topic_performance(db, current_user.id, quiz.subject_id, quiz.topic, correct_count, total)

    next_difficulty = None
    if quiz.is_adaptive:
        next_difficulty = next_adaptive_difficulty(quiz.difficulty, accuracy)

    graded.sort(key=lambda g: g.question_id)
    return QuizResultOut(
        attempt_id=attempt.id,
        total_questions=total,
        correct_count=correct_count,
        wrong_count=wrong_count,
        unanswered_count=unanswered_count,
        accuracy=accuracy,
        graded_answers=graded,
        next_difficulty=next_difficulty,
    )
