"""
WebSocket Router — Real-time bidirectional communication hub
"""
import json
import asyncio
import uuid
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from models.schemas import WSMessageType, WSMessage
from services import transcription, action_extractor, summarizer, memory_service, llm_service
from database.db import get_meeting, end_meeting, get_transcripts

router = APIRouter()

# Connection registry: meeting_id → list of connected WebSockets
_connections: dict[str, list[WebSocket]] = {}
# Meeting metadata cache
_meeting_cache: dict[str, dict] = {}


async def broadcast(meeting_id: str, message: dict, exclude: WebSocket = None):
    """Broadcast a message to all clients connected to a meeting."""
    conns = _connections.get(meeting_id, [])
    dead = []
    for ws in conns:
        if ws is exclude:
            continue
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(ws)
    for ws in dead:
        conns.remove(ws)


def _build_message(msg_type: str, payload: dict, meeting_id: str = None) -> dict:
    return {
        "type": msg_type,
        "payload": payload,
        "meeting_id": meeting_id,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.websocket("/ws/{meeting_id}")
async def meeting_websocket(websocket: WebSocket, meeting_id: str):
    """Main WebSocket endpoint for a meeting room."""
    await websocket.accept()

    # Register connection
    if meeting_id not in _connections:
        _connections[meeting_id] = []
    _connections[meeting_id].append(websocket)

    # Load meeting info
    meeting = await get_meeting(meeting_id)
    if not meeting:
        await websocket.send_text(json.dumps(_build_message(
            WSMessageType.ERROR, {"message": "Meeting not found"}, meeting_id
        )))
        await websocket.close()
        return

    _meeting_cache[meeting_id] = meeting

    # Send welcome
    await websocket.send_text(json.dumps(_build_message(
        WSMessageType.STATUS,
        {"status": "connected", "meeting": meeting, "mode": "demo"},
        meeting_id
    )))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps(_build_message(
                    WSMessageType.ERROR, {"message": "Invalid JSON"}, meeting_id
                )))
                continue

            msg_type = msg.get("type")
            payload = msg.get("payload", {})

            # ── Handle ping ────────────────────────────────────────────────
            if msg_type == WSMessageType.PING:
                await websocket.send_text(json.dumps(_build_message(
                    WSMessageType.PONG, {"ts": datetime.utcnow().isoformat()}, meeting_id
                )))

            # ── Handle transcript ──────────────────────────────────────────
            elif msg_type == WSMessageType.TRANSCRIPT:
                text = payload.get("text", "").strip()
                speaker = payload.get("speaker")
                confidence = payload.get("confidence", 1.0)

                if not text:
                    continue

                # Save and enrich transcript entry
                entry = await transcription.process_transcript(
                    meeting_id=meeting_id,
                    text=text,
                    speaker=speaker,
                    confidence=confidence,
                )

                # Store in vector memory (async, non-blocking)
                asyncio.create_task(memory_service.store_transcript_chunk(
                    text=text,
                    meeting_id=meeting_id,
                    speaker=entry["speaker"],
                    timestamp=entry["timestamp"],
                    chunk_id=entry["id"],
                ))

                # Broadcast transcript to all clients
                await broadcast(meeting_id, _build_message(
                    WSMessageType.TRANSCRIPT, entry, meeting_id
                ))

                # Try to extract action items
                new_actions = await action_extractor.extract_and_save(meeting_id, text)
                for action in new_actions:
                    await broadcast(meeting_id, _build_message(
                        WSMessageType.ACTION_ITEM, action, meeting_id
                    ))

                # Periodically update summary (every 10 entries)
                stats = transcription.get_session_stats(meeting_id)
                if stats["entry_count"] % 10 == 0:
                    asyncio.create_task(_update_summary(meeting_id, websocket))

            # ── Handle chat query ──────────────────────────────────────────
            elif msg_type == WSMessageType.CHAT_QUERY:
                query = payload.get("query", "")
                asyncio.create_task(_handle_chat(meeting_id, query, websocket))

            # ── Handle meeting end ─────────────────────────────────────────
            elif msg_type == WSMessageType.MEETING_ENDED:
                duration = payload.get("duration_seconds", 0)
                await end_meeting(meeting_id, duration)

                # Generate final summary
                final_summary = await summarizer.generate_or_update_summary(
                    meeting_id, meeting["title"], force=True
                )

                # Final action item sweep
                transcripts = await get_transcripts(meeting_id)
                full_text = " ".join(t["text"] for t in transcripts)
                final_actions = await action_extractor.extract_and_save(meeting_id, full_text, force=True)

                await broadcast(meeting_id, _build_message(
                    WSMessageType.MEETING_ENDED,
                    {"summary": final_summary, "new_actions": final_actions},
                    meeting_id
                ))

                transcription.close_session(meeting_id)
                action_extractor.clear_session(meeting_id)
                summarizer.clear_session(meeting_id)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for meeting {meeting_id}: {e}")
    finally:
        conns = _connections.get(meeting_id, [])
        if websocket in conns:
            conns.remove(websocket)


async def _update_summary(meeting_id: str, websocket: WebSocket):
    """Background task to update summary and broadcast."""
    try:
        meeting = _meeting_cache.get(meeting_id, {})
        title = meeting.get("title", "Meeting")
        summary = await summarizer.generate_or_update_summary(meeting_id, title)
        if summary:
            await broadcast(meeting_id, _build_message(
                WSMessageType.SUMMARY_UPDATE, summary, meeting_id
            ))
    except Exception as e:
        print(f"Summary update error: {e}")


async def _handle_chat(meeting_id: str, query: str, websocket: WebSocket):
    """Background task to handle AI chat query and send response."""
    try:
        # Semantic memory search
        memory_hits = await memory_service.search_memory(query, meeting_id=meeting_id)
        context = "\n".join(h["text"] for h in memory_hits)

        # Also include recent transcripts
        transcripts = await get_transcripts(meeting_id)
        recent = " ".join(t["text"] for t in transcripts[-20:])
        full_context = f"{context}\n\nRecent transcript:\n{recent}"

        meeting = _meeting_cache.get(meeting_id, {})
        answer = await llm_service.answer_query(
            query=query,
            context=full_context,
            meeting_title=meeting.get("title", "")
        )

        await websocket.send_text(json.dumps(_build_message(
            WSMessageType.CHAT_RESPONSE,
            {
                "query": query,
                "answer": answer,
                "memory_hits": memory_hits[:3],
            },
            meeting_id
        )))
    except Exception as e:
        await websocket.send_text(json.dumps(_build_message(
            WSMessageType.ERROR,
            {"message": f"Chat error: {str(e)}"},
            meeting_id
        )))
