from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Subjects ----------
class SubjectCreate(BaseModel):
    name: str
    exam_date: Optional[str] = None


class SubjectOut(BaseModel):
    id: int
    name: str
    exam_date: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Documents ----------
class DocumentOut(BaseModel):
    id: int
    filename: str
    doc_type: str
    status: str
    error_message: Optional[str] = None
    num_chunks: int
    subject_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Chat ----------
class ChatRequest(BaseModel):
    message: str
    subject_id: Optional[int] = None


class ChatSource(BaseModel):
    document: str
    chunk_index: int
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource] = []
    demo_mode: bool = False


# ---------- Study Mode ----------
class StudyRequest(BaseModel):
    subject_id: Optional[int] = None
    topic: str
    difficulty: str = "medium"
    action: str = "explain"  # explain, simpler, example, five_mark, summarize, ask_question


# ---------- Quiz ----------
class QuizGenerateRequest(BaseModel):
    subject_id: Optional[int] = None
    topic: str
    num_questions: int = 5
    difficulty: str = "medium"
    question_type: str = "mcq"  # mcq, true_false, short_answer
    is_adaptive: bool = False
    is_exam: bool = False
    duration_minutes: Optional[int] = None


class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[Dict[str, str]] = None
    difficulty: str
    order_index: int

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    id: int
    topic: str
    difficulty: str
    question_type: str
    is_adaptive: bool
    is_exam: bool
    duration_minutes: Optional[int] = None
    questions: List[QuestionOut]

    class Config:
        from_attributes = True


class QuizSubmitAnswer(BaseModel):
    question_id: int
    selected_answer: Optional[str] = None
    marked_for_review: bool = False


class QuizSubmitRequest(BaseModel):
    answers: List[QuizSubmitAnswer]


class GradedAnswer(BaseModel):
    question_id: int
    question_text: str
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    topic: Optional[str] = None


class QuizResultOut(BaseModel):
    attempt_id: int
    total_questions: int
    correct_count: int
    wrong_count: int
    unanswered_count: int
    accuracy: float
    graded_answers: List[GradedAnswer]
    next_difficulty: Optional[str] = None


# ---------- Weakness ----------
class TopicPerformanceOut(BaseModel):
    topic: str
    attempts: int
    correct: int
    accuracy: float
    last_accuracy: float
    classification: str

    class Config:
        from_attributes = True


class WeaknessReportOut(BaseModel):
    topics: List[TopicPerformanceOut]
    recommendations: List[str]


# ---------- Planner ----------
class PlannerRequest(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str
    exam_date: str
    hours_per_day: float = 2.0
    prep_level: str = "beginner"  # beginner, intermediate, advanced
    weak_topics: List[str] = []
    all_topics: List[str] = []


class StudyTaskOut(BaseModel):
    id: int
    day_number: int
    start_time: Optional[str]
    end_time: Optional[str]
    topic: str
    task_type: str
    status: str

    class Config:
        from_attributes = True


class StudyPlanOut(BaseModel):
    id: int
    subject_id: Optional[int]
    exam_date: Optional[str]
    hours_per_day: float
    tasks: List[StudyTaskOut]
    completion_percent: float

    class Config:
        from_attributes = True


class TaskStatusUpdate(BaseModel):
    status: str


# ---------- Revision ----------
class RevisionRequest(BaseModel):
    subject_id: Optional[int] = None
    topic: str


class RevisionOut(BaseModel):
    topic: str
    summary: str
    key_definitions: List[str]
    key_points: List[str]
    flashcards: List[Dict[str, str]]
    quick_mcqs: List[Dict[str, Any]]
    demo_mode: bool = False


# ---------- Analytics ----------
class AnalyticsOut(BaseModel):
    overall_accuracy: float
    total_quizzes: int
    questions_attempted: int
    average_score: float
    strong_topics: List[TopicPerformanceOut]
    weak_topics: List[TopicPerformanceOut]
    score_history: List[Dict[str, Any]]
    topic_accuracy: List[Dict[str, Any]]
    correct_vs_incorrect: Dict[str, int]


# ---------- PYQ Analysis ----------
class PyqAnalysisOut(BaseModel):
    frequent_topics: List[Dict[str, Any]]
    note: str
