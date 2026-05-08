"""
Meeting Summarizer
Generates and updates structured meeting summaries.
"""
import uuid
from database.db import get_transcripts, save_summary, get_summary
from services import llm_service

# Track last summarized transcript count per meeting
_last_summarized: dict[str, int] = {}


async def generate_or_update_summary(meeting_id: str, meeting_title: str, force: bool = False) -> dict | None:
    """
    Generate or update a meeting summary.
    Only regenerates if enough new content has accumulated (or force=True).
    """
    transcripts = await get_transcripts(meeting_id)
    count = len(transcripts)

    last = _last_summarized.get(meeting_id, 0)
    if not force and (count - last) < 5:
        # Not enough new content — return existing summary
        return await get_summary(meeting_id)

    if count == 0:
        return None

    # Build transcript text
    transcript_text = "\n".join(
        f"[{t['speaker']}]: {t['text']}" for t in transcripts
    )

    result = await llm_service.generate_summary(transcript_text, meeting_title)
    summary_id = str(uuid.uuid4())

    await save_summary(
        summary_id=summary_id,
        meeting_id=meeting_id,
        overview=result.get("overview", ""),
        key_points=result.get("key_points", []),
        decisions=result.get("decisions", []),
        unresolved=result.get("unresolved", []),
    )

    _last_summarized[meeting_id] = count
    return {
        "id": summary_id,
        "meeting_id": meeting_id,
        **result,
    }


def clear_session(meeting_id: str):
    if meeting_id in _last_summarized:
        del _last_summarized[meeting_id]
