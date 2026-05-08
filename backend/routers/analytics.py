"""
Analytics REST API Router
"""
from fastapi import APIRouter
from database.db import (
    get_analytics_overview, list_meetings, get_transcripts, get_action_items
)
import json

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def analytics_overview():
    return await get_analytics_overview()


@router.get("/meetings-trend")
async def meetings_trend():
    """Returns meeting counts by date (last 30 days)."""
    meetings = await list_meetings()
    trend: dict[str, int] = {}
    for m in meetings:
        day = m["created_at"][:10]  # YYYY-MM-DD
        trend[day] = trend.get(day, 0) + 1

    return [{"date": k, "count": v} for k, v in sorted(trend.items())]


@router.get("/speakers")
async def speaker_stats():
    """Returns word count breakdown by speaker across all meetings."""
    meetings = await list_meetings()
    speaker_totals: dict[str, int] = {}
    for m in meetings:
        transcripts = await get_transcripts(m["id"])
        for t in transcripts:
            spk = t["speaker"]
            speaker_totals[spk] = speaker_totals.get(spk, 0) + len(t["text"].split())

    return [{"speaker": k, "words": v} for k, v in sorted(speaker_totals.items(), key=lambda x: -x[1])]


@router.get("/action-items-summary")
async def action_items_summary():
    """Returns action item counts by status and priority."""
    meetings = await list_meetings()
    by_status: dict[str, int] = {}
    by_priority: dict[str, int] = {}

    for m in meetings:
        items = await get_action_items(m["id"])
        for item in items:
            s = item["status"]
            p = item["priority"]
            by_status[s] = by_status.get(s, 0) + 1
            by_priority[p] = by_priority.get(p, 0) + 1

    return {
        "by_status": by_status,
        "by_priority": by_priority,
    }
