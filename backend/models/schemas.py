from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid


def gen_id() -> str:
    return str(uuid.uuid4())


# ── Request Schemas ───────────────────────────────────────────────────────────

class CreateMeetingRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    participants: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class EndMeetingRequest(BaseModel):
    duration_seconds: int = Field(default=0, ge=0)


class UpdateActionItemRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|in_progress|completed)$")


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    meeting_id: Optional[str] = None


# ── Response Schemas ──────────────────────────────────────────────────────────

class MeetingResponse(BaseModel):
    id: str
    title: str
    status: str
    participants: Any  # JSON string or list
    created_at: str
    ended_at: Optional[str]
    duration_seconds: int
    tags: Any

    class Config:
        from_attributes = True


class TranscriptEntryResponse(BaseModel):
    id: str
    meeting_id: str
    speaker: str
    speaker_color: str
    text: str
    timestamp: str
    confidence: float

    class Config:
        from_attributes = True


class ActionItemResponse(BaseModel):
    id: str
    meeting_id: str
    task: str
    owner: Optional[str]
    deadline: Optional[str]
    priority: str
    status: str
    created_at: str

    class Config:
        from_attributes = True


class SummaryResponse(BaseModel):
    id: str
    meeting_id: str
    overview: str
    key_points: List[str]
    decisions: List[str]
    unresolved: List[str]
    generated_at: str

    class Config:
        from_attributes = True


class MeetingDetailResponse(BaseModel):
    meeting: MeetingResponse
    transcripts: List[TranscriptEntryResponse]
    action_items: List[ActionItemResponse]
    summary: Optional[SummaryResponse]


class AnalyticsOverviewResponse(BaseModel):
    total_meetings: int
    active_meetings: int
    total_hours: float
    total_action_items: int
    completed_action_items: int
    total_transcript_entries: int


# ── WebSocket Message Schemas ─────────────────────────────────────────────────

class WSMessageType:
    TRANSCRIPT = "transcript"
    SUMMARY_UPDATE = "summary_update"
    ACTION_ITEM = "action_item"
    CHAT_QUERY = "chat_query"
    CHAT_RESPONSE = "chat_response"
    MEETING_STARTED = "meeting_started"
    MEETING_ENDED = "meeting_ended"
    ERROR = "error"
    PING = "ping"
    PONG = "pong"
    STATUS = "status"


class WSMessage(BaseModel):
    type: str
    payload: Any
    meeting_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
