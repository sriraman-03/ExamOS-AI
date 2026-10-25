import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database.db import Base


def now():
    return datetime.datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=now)

    subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="owner", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="owner", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    exam_date = Column(String, nullable=True)  # ISO date string
    created_at = Column(DateTime, default=now)

    owner = relationship("User", back_populates="subjects")
    documents = relationship("Document", back_populates="subject")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    filename = Column(String, nullable=False)
    doc_type = Column(String, default="notes")  # notes, syllabus, textbook, pyq
    filepath = Column(String, nullable=False)
    status = Column(String, default="processing")  # processing, ready, failed
    error_message = Column(String, nullable=True)
    num_chunks = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=now)

    owner = relationship("User", back_populates="documents")
    subject = relationship("Subject", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    document = relationship("Document", back_populates="chunks")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # list of {document, chunk_index}
    created_at = Column(DateTime, default=now)

    owner = relationship("User", back_populates="chat_messages")


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic = Column(String, nullable=False)
    difficulty = Column(String, default="medium")
    question_type = Column(String, default="mcq")
    is_adaptive = Column(Boolean, default=False)
    is_exam = Column(Boolean, default=False)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now)

    owner = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    topic = Column(String, nullable=True)
    difficulty = Column(String, default="medium")
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="mcq")
    options = Column(JSON, nullable=True)  # {"A": "...", "B": "...", ...}
    correct_answer = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    unanswered_count = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=now)

    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String, nullable=True)
    is_correct = Column(Boolean, default=False)
    marked_for_review = Column(Boolean, default=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question")


class TopicPerformance(Base):
    __tablename__ = "topic_performance"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic = Column(String, nullable=False)
    attempts = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    last_accuracy = Column(Float, default=0.0)
    classification = Column(String, default="unrated")  # strong, moderate, weak
    updated_at = Column(DateTime, default=now)


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    exam_date = Column(String, nullable=True)
    hours_per_day = Column(Float, default=2.0)
    created_at = Column(DateTime, default=now)

    owner = relationship("User", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="plan", cascade="all, delete-orphan")


class StudyTask(Base):
    __tablename__ = "study_tasks"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    topic = Column(String, nullable=False)
    task_type = Column(String, default="study")  # study, quiz, revision
    status = Column(String, default="not_started")  # not_started, in_progress, completed

    plan = relationship("StudyPlan", back_populates="tasks")
