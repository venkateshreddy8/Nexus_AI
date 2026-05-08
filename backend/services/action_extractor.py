"""
Action Item Extractor
Continuously extracts and updates action items from meeting transcripts.
"""
import uuid
import re
from typing import List
from database.db import save_action_item, get_action_items
from services import llm_service

# Track seen action items to avoid duplicates
_seen_tasks: dict[str, set] = {}

# Keyword triggers that often precede action items
ACTION_KEYWORDS = [
    r"\bwill\b", r"\bshould\b", r"\bneed to\b", r"\bhave to\b",
    r"\baction item\b", r"\bfollow up\b", r"\bfollow-up\b",
    r"\bresponsible for\b", r"\bby (monday|tuesday|wednesday|thursday|friday|next week|end of day|eod)\b",
    r"\btask\b", r"\bassign\b", r"\bdeadline\b", r"\bowner\b",
]


def _normalize_task(task: str) -> str:
    return re.sub(r"\s+", " ", task.strip().lower())


async def extract_and_save(
    meeting_id: str,
    transcript_text: str,
    force: bool = False
) -> List[dict]:
    """
    Extract action items from transcript text and save new ones.
    Returns list of newly added items.
    """
    if meeting_id not in _seen_tasks:
        _seen_tasks[meeting_id] = set()

    # Only extract if text contains action keywords (saves LLM calls)
    has_keywords = any(re.search(kw, transcript_text.lower()) for kw in ACTION_KEYWORDS)
    if not has_keywords and not force:
        return []

    raw_items = await llm_service.extract_action_items(transcript_text, meeting_id)
    new_items = []

    for item in raw_items:
        task_norm = _normalize_task(item.get("task", ""))
        if not task_norm or task_norm in _seen_tasks[meeting_id]:
            continue

        _seen_tasks[meeting_id].add(task_norm)
        item_id = str(uuid.uuid4())
        await save_action_item(
            item_id=item_id,
            meeting_id=meeting_id,
            task=item.get("task", ""),
            owner=item.get("owner"),
            deadline=item.get("deadline"),
            priority=item.get("priority", "medium"),
        )
        new_items.append({
            "id": item_id,
            "meeting_id": meeting_id,
            **item,
            "status": "pending",
        })

    return new_items


def clear_session(meeting_id: str):
    if meeting_id in _seen_tasks:
        del _seen_tasks[meeting_id]
