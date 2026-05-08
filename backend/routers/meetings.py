"""
Meetings REST API Router
"""
import json
import uuid
from fastapi import APIRouter, HTTPException
from models.schemas import CreateMeetingRequest, EndMeetingRequest, UpdateActionItemRequest
from database import db

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _parse_json_fields(meeting: dict) -> dict:
    """Parse JSON string fields in meeting dict."""
    for field in ["participants", "tags"]:
        if isinstance(meeting.get(field), str):
            try:
                meeting[field] = json.loads(meeting[field])
            except Exception:
                meeting[field] = []
    return meeting


@router.post("/")
async def create_meeting(req: CreateMeetingRequest):
    meeting_id = str(uuid.uuid4())
    meeting = await db.create_meeting(meeting_id, req.title, req.participants)
    return _parse_json_fields(meeting)


@router.get("/")
async def list_meetings():
    meetings = await db.list_meetings()
    return [_parse_json_fields(m) for m in meetings]


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    meeting = await db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcripts = await db.get_transcripts(meeting_id)
    action_items = await db.get_action_items(meeting_id)
    summary = await db.get_summary(meeting_id)

    return {
        "meeting": _parse_json_fields(meeting),
        "transcripts": transcripts,
        "action_items": action_items,
        "summary": summary,
    }


@router.put("/{meeting_id}/end")
async def end_meeting(meeting_id: str, req: EndMeetingRequest):
    meeting = await db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    await db.end_meeting(meeting_id, req.duration_seconds)
    return {"status": "ended", "meeting_id": meeting_id}


@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str):
    meeting = await db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    await db.delete_meeting(meeting_id)
    return {"status": "deleted", "meeting_id": meeting_id}


@router.get("/{meeting_id}/summary")
async def get_summary(meeting_id: str):
    summary = await db.get_summary(meeting_id)
    if not summary:
        raise HTTPException(status_code=404, detail="No summary available")
    return summary


@router.get("/{meeting_id}/actions")
async def get_actions(meeting_id: str):
    return await db.get_action_items(meeting_id)


@router.patch("/{meeting_id}/actions/{item_id}")
async def update_action(meeting_id: str, item_id: str, req: UpdateActionItemRequest):
    await db.update_action_status(item_id, req.status)
    return {"status": "updated", "item_id": item_id, "new_status": req.status}
