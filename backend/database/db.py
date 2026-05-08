import aiosqlite
import json
from datetime import datetime
from config import settings

DB_FILE = settings.DB_FILE

CREATE_MEETINGS_TABLE = """
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    participants TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]'
);
"""

CREATE_TRANSCRIPTS_TABLE = """
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    speaker TEXT NOT NULL,
    speaker_color TEXT DEFAULT '#3b82f6',
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
"""

CREATE_SUMMARIES_TABLE = """
CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL UNIQUE,
    overview TEXT,
    key_points TEXT DEFAULT '[]',
    decisions TEXT DEFAULT '[]',
    unresolved TEXT DEFAULT '[]',
    generated_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
"""

CREATE_ACTION_ITEMS_TABLE = """
CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    task TEXT NOT NULL,
    owner TEXT,
    deadline TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
"""


async def init_db():
    """Initialize the SQLite database and create tables."""
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(CREATE_MEETINGS_TABLE)
        await db.execute(CREATE_TRANSCRIPTS_TABLE)
        await db.execute(CREATE_SUMMARIES_TABLE)
        await db.execute(CREATE_ACTION_ITEMS_TABLE)
        await db.commit()
    print(f"✅ Database initialized at {DB_FILE}")


async def get_db():
    """Async context manager for database connections."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        yield db


# ── Meeting CRUD ──────────────────────────────────────────────────────────────

async def create_meeting(meeting_id: str, title: str, participants: list = None):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        now = datetime.utcnow().isoformat()
        await db.execute(
            "INSERT INTO meetings (id, title, participants, created_at) VALUES (?, ?, ?, ?)",
            (meeting_id, title, json.dumps(participants or []), now)
        )
        await db.commit()
        async with db.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)) as cur:
            row = await cur.fetchone()
            return dict(row)


async def get_meeting(meeting_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None


async def list_meetings():
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM meetings ORDER BY created_at DESC") as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def end_meeting(meeting_id: str, duration_seconds: int):
    async with aiosqlite.connect(DB_FILE) as db:
        now = datetime.utcnow().isoformat()
        await db.execute(
            "UPDATE meetings SET status = 'ended', ended_at = ?, duration_seconds = ? WHERE id = ?",
            (now, duration_seconds, meeting_id)
        )
        await db.commit()


async def delete_meeting(meeting_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("DELETE FROM transcripts WHERE meeting_id = ?", (meeting_id,))
        await db.execute("DELETE FROM action_items WHERE meeting_id = ?", (meeting_id,))
        await db.execute("DELETE FROM summaries WHERE meeting_id = ?", (meeting_id,))
        await db.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
        await db.commit()


# ── Transcript CRUD ───────────────────────────────────────────────────────────

SPEAKER_COLORS = [
    "#3b82f6", "#06b6d4", "#8b5cf6", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"
]

_speaker_color_map: dict = {}


def get_speaker_color(speaker: str) -> str:
    if speaker not in _speaker_color_map:
        idx = len(_speaker_color_map) % len(SPEAKER_COLORS)
        _speaker_color_map[speaker] = SPEAKER_COLORS[idx]
    return _speaker_color_map[speaker]


async def save_transcript(entry_id: str, meeting_id: str, speaker: str, text: str, confidence: float = 1.0):
    async with aiosqlite.connect(DB_FILE) as db:
        color = get_speaker_color(speaker)
        now = datetime.utcnow().isoformat()
        await db.execute(
            "INSERT INTO transcripts (id, meeting_id, speaker, speaker_color, text, timestamp, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (entry_id, meeting_id, speaker, color, text, now, confidence)
        )
        await db.commit()


async def get_transcripts(meeting_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM transcripts WHERE meeting_id = ? ORDER BY timestamp ASC", (meeting_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


# ── Action Items CRUD ─────────────────────────────────────────────────────────

async def save_action_item(item_id: str, meeting_id: str, task: str, owner: str = None,
                            deadline: str = None, priority: str = "medium"):
    async with aiosqlite.connect(DB_FILE) as db:
        now = datetime.utcnow().isoformat()
        await db.execute(
            "INSERT OR IGNORE INTO action_items (id, meeting_id, task, owner, deadline, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item_id, meeting_id, task, owner, deadline, priority, now)
        )
        await db.commit()


async def get_action_items(meeting_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at ASC", (meeting_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def update_action_status(item_id: str, status: str):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("UPDATE action_items SET status = ? WHERE id = ?", (status, item_id))
        await db.commit()


# ── Summary CRUD ──────────────────────────────────────────────────────────────

async def save_summary(summary_id: str, meeting_id: str, overview: str,
                        key_points: list, decisions: list, unresolved: list):
    async with aiosqlite.connect(DB_FILE) as db:
        now = datetime.utcnow().isoformat()
        await db.execute(
            """INSERT INTO summaries (id, meeting_id, overview, key_points, decisions, unresolved, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(meeting_id) DO UPDATE SET
                   overview = excluded.overview,
                   key_points = excluded.key_points,
                   decisions = excluded.decisions,
                   unresolved = excluded.unresolved,
                   generated_at = excluded.generated_at""",
            (summary_id, meeting_id, overview, json.dumps(key_points),
             json.dumps(decisions), json.dumps(unresolved), now)
        )
        await db.commit()


async def get_summary(meeting_id: str):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM summaries WHERE meeting_id = ?", (meeting_id,)) as cur:
            row = await cur.fetchone()
            if row:
                d = dict(row)
                d["key_points"] = json.loads(d["key_points"])
                d["decisions"] = json.loads(d["decisions"])
                d["unresolved"] = json.loads(d["unresolved"])
                return d
            return None


# ── Analytics ─────────────────────────────────────────────────────────────────

async def get_analytics_overview():
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT COUNT(*) as total FROM meetings") as cur:
            total_meetings = (await cur.fetchone())["total"]
        async with db.execute("SELECT COUNT(*) as total FROM meetings WHERE status = 'active'") as cur:
            active_meetings = (await cur.fetchone())["total"]
        async with db.execute("SELECT SUM(duration_seconds) as total FROM meetings WHERE status = 'ended'") as cur:
            total_secs = (await cur.fetchone())["total"] or 0
        async with db.execute("SELECT COUNT(*) as total FROM action_items") as cur:
            total_actions = (await cur.fetchone())["total"]
        async with db.execute("SELECT COUNT(*) as total FROM action_items WHERE status = 'completed'") as cur:
            completed_actions = (await cur.fetchone())["total"]
        async with db.execute("SELECT COUNT(*) as total FROM transcripts") as cur:
            total_transcripts = (await cur.fetchone())["total"]
        return {
            "total_meetings": total_meetings,
            "active_meetings": active_meetings,
            "total_hours": round(total_secs / 3600, 1),
            "total_action_items": total_actions,
            "completed_action_items": completed_actions,
            "total_transcript_entries": total_transcripts,
        }
