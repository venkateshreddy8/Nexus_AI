"""
LLM Orchestration Service
Supports GPT-4 via LangChain OR demo/simulation mode (no API key required).
"""
import json
import random
from typing import Optional
from config import settings

# LangChain imports (only used when API key present)
_llm = None


def _get_llm():
    global _llm
    if _llm is None and not settings.DEMO_MODE:
        try:
            from langchain_openai import ChatOpenAI
            _llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=0.3,
                api_key=settings.OPENAI_API_KEY,
                streaming=True
            )
        except Exception as e:
            print(f"⚠️  LLM init failed: {e}. Falling back to demo mode.")
    return _llm


# ── Demo Mode Responses ───────────────────────────────────────────────────────

DEMO_SUMMARIES = [
    "The team discussed the upcoming product launch timeline and aligned on key milestones. Q3 deliverables were reviewed with emphasis on performance improvements and user experience enhancements.",
    "Engineering and product teams synced on the API integration roadmap. Technical debt items were prioritized alongside new feature development for the next sprint cycle.",
    "Quarterly review meeting covered revenue targets, customer acquisition metrics, and strategic initiatives for market expansion. Budget allocations were discussed and adjusted.",
]

DEMO_KEY_POINTS = [
    ["Product launch scheduled for Q3 2026", "Performance improvements are top priority", "User feedback has been overwhelmingly positive"],
    ["API integration deadline moved to end of month", "Three critical bugs need immediate attention", "New onboarding flow approved for implementation"],
    ["Revenue target achieved at 112% of forecast", "Two new enterprise clients onboarded", "Marketing budget increased by 20% for next quarter"],
]

DEMO_DECISIONS = [
    ["Proceed with phased rollout strategy", "Allocate additional engineering resources to performance team"],
    ["Use REST over GraphQL for the integration", "Weekly sync calls to be established"],
    ["Expand into APAC market in Q4", "Hire two additional sales representatives"],
]

DEMO_UNRESOLVED = [
    ["Final pricing strategy needs CFO approval", "Third-party vendor evaluation still in progress"],
    ["Security audit timeline to be confirmed", "Cloud provider selection pending cost analysis"],
    ["Regulatory compliance review awaiting legal team input"],
]

DEMO_CHAT_RESPONSES = [
    "Based on the meeting transcript, the team decided to {action} and assigned {owner} as the responsible party.",
    "The key decision discussed was around the {topic}. The team reached consensus on moving forward with the {approach} approach.",
    "I found {count} action items from this meeting. The highest priority one is assigned to {owner} with a deadline of {deadline}.",
    "The meeting summary indicates that the main discussion points were around {topic1} and {topic2}.",
]


async def generate_summary(transcript_text: str, meeting_title: str) -> dict:
    """Generate a structured meeting summary."""
    if settings.DEMO_MODE or not _get_llm():
        idx = hash(meeting_title) % len(DEMO_SUMMARIES)
        return {
            "overview": DEMO_SUMMARIES[idx],
            "key_points": DEMO_KEY_POINTS[idx],
            "decisions": DEMO_DECISIONS[idx],
            "unresolved": DEMO_UNRESOLVED[idx],
        }

    llm = _get_llm()
    prompt = f"""You are an expert meeting summarizer. Analyze the following meeting transcript and provide a structured summary.

Meeting Title: {meeting_title}

Transcript:
{transcript_text[:4000]}

Respond in JSON format with these exact keys:
{{
  "overview": "2-3 sentence meeting overview",
  "key_points": ["point1", "point2", ...],
  "decisions": ["decision1", "decision2", ...],
  "unresolved": ["issue1", "issue2", ...]
}}
"""
    try:
        from langchain_core.messages import HumanMessage
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"LLM summary error: {e}")
        idx = 0
        return {
            "overview": DEMO_SUMMARIES[idx],
            "key_points": DEMO_KEY_POINTS[idx],
            "decisions": DEMO_DECISIONS[idx],
            "unresolved": DEMO_UNRESOLVED[idx],
        }


async def extract_action_items(transcript_text: str, meeting_id: str) -> list:
    """Extract structured action items from transcript."""
    if settings.DEMO_MODE or not _get_llm():
        demo_items = [
            {"task": "Prepare Q3 roadmap presentation", "owner": "Alex Johnson", "deadline": "2026-05-15", "priority": "high"},
            {"task": "Review and finalize API documentation", "owner": "Sarah Chen", "deadline": "2026-05-12", "priority": "medium"},
            {"task": "Schedule follow-up with design team", "owner": "Mike Rodriguez", "deadline": "2026-05-10", "priority": "low"},
        ]
        return random.sample(demo_items, k=min(len(demo_items), random.randint(1, 3)))

    llm = _get_llm()
    prompt = f"""Extract all action items from this meeting transcript. Be precise.

Transcript:
{transcript_text[:3000]}

Return a JSON array:
[
  {{"task": "...", "owner": "person name or null", "deadline": "YYYY-MM-DD or null", "priority": "high|medium|low"}},
  ...
]

Only return the JSON array, nothing else.
"""
    try:
        from langchain_core.messages import HumanMessage
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"LLM action extraction error: {e}")
        return []


async def answer_query(query: str, context: str, meeting_title: str = "") -> str:
    """Answer a user query based on meeting context."""
    if settings.DEMO_MODE or not _get_llm():
        demo_answers = [
            f"Based on the meeting context for **{meeting_title}**, the team discussed several key topics. The main focus was on aligning priorities and establishing clear ownership for upcoming deliverables.",
            f"From the transcript analysis, I can see that the discussion covered strategic planning and execution timelines. Key stakeholders were aligned on the primary objectives.",
            f"The meeting revealed important insights about {query.lower().split('?')[0]}. The team reached consensus on moving forward with a structured approach.",
            f"According to the meeting memory, there were {random.randint(2, 5)} relevant discussion points related to your query. The primary decision was to prioritize based on business impact.",
        ]
        return random.choice(demo_answers)

    llm = _get_llm()
    prompt = f"""You are Nexus AI, an intelligent meeting assistant. Answer the user's question based on the meeting context.

Meeting: {meeting_title}
Context: {context[:3000]}

User Question: {query}

Provide a concise, accurate answer. If the information is not in the context, say so clearly.
"""
    try:
        from langchain_core.messages import HumanMessage
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        print(f"LLM query error: {e}")
        return "I encountered an issue processing your query. Please try again."
