from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class MeetingStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"
    PAUSED = "paused"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


@dataclass
class Speaker:
    name: str
    color: str = "#3b82f6"
    word_count: int = 0
    speaking_time: float = 0.0


@dataclass
class TranscriptEntry:
    id: str
    meeting_id: str
    speaker: str
    speaker_color: str
    text: str
    timestamp: str
    confidence: float = 1.0


@dataclass
class ActionItem:
    id: str
    meeting_id: str
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None
    priority: str = Priority.MEDIUM
    status: str = ActionStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class MeetingSummary:
    id: str
    meeting_id: str
    overview: str
    key_points: List[str]
    decisions: List[str]
    unresolved: List[str]
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Meeting:
    id: str
    title: str
    status: str = MeetingStatus.ACTIVE
    participants: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    ended_at: Optional[str] = None
    duration_seconds: int = 0
    tags: List[str] = field(default_factory=list)
