"""
Transcription Service
Processes incoming transcript text (from Web Speech API on frontend)
and manages speaker identification and session tracking.
"""
import uuid
from datetime import datetime
from typing import Optional
from database.db import save_transcript, get_speaker_color

# Active transcription sessions per meeting
_sessions: dict[str, dict] = {}

SPEAKER_NAMES = ["Speaker 1", "Speaker 2", "Speaker 3", "Speaker 4"]


def get_or_create_session(meeting_id: str) -> dict:
    if meeting_id not in _sessions:
        _sessions[meeting_id] = {
            "meeting_id": meeting_id,
            "speakers": {},
            "entry_count": 0,
            "current_speaker_idx": 0,
            "started_at": datetime.utcnow().isoformat(),
        }
    return _sessions[meeting_id]


def detect_speaker(meeting_id: str, provided_speaker: Optional[str] = None) -> str:
    """Simple speaker detection — use provided name or rotate through defaults."""
    session = get_or_create_session(meeting_id)
    if provided_speaker:
        return provided_speaker
    # Auto-assign speaker based on session tracking
    idx = session["current_speaker_idx"] % len(SPEAKER_NAMES)
    return SPEAKER_NAMES[idx]


async def process_transcript(
    meeting_id: str,
    text: str,
    speaker: Optional[str] = None,
    confidence: float = 1.0,
) -> dict:
    """
    Process an incoming transcript segment.
    Returns the saved transcript entry dict.
    """
    session = get_or_create_session(meeting_id)
    resolved_speaker = detect_speaker(meeting_id, speaker)
    color = get_speaker_color(resolved_speaker)
    entry_id = str(uuid.uuid4())

    # Persist to database
    await save_transcript(
        entry_id=entry_id,
        meeting_id=meeting_id,
        speaker=resolved_speaker,
        text=text,
        confidence=confidence,
    )

    session["entry_count"] += 1

    # Track speaker word count
    word_count = len(text.split())
    if resolved_speaker not in session["speakers"]:
        session["speakers"][resolved_speaker] = {"word_count": 0, "color": color}
    session["speakers"][resolved_speaker]["word_count"] += word_count

    return {
        "id": entry_id,
        "meeting_id": meeting_id,
        "speaker": resolved_speaker,
        "speaker_color": color,
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
        "confidence": confidence,
    }


def close_session(meeting_id: str):
    """Clean up the transcription session."""
    if meeting_id in _sessions:
        del _sessions[meeting_id]


def get_session_stats(meeting_id: str) -> dict:
    """Get current session statistics."""
    session = _sessions.get(meeting_id, {})
    return {
        "entry_count": session.get("entry_count", 0),
        "speakers": session.get("speakers", {}),
    }
