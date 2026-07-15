from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

from phones import PHONES, match_score
from google import genai
from google.genai import types as genai_types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash')
genai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Gemini returns transient 5xx/429s under load; a retry usually clears them.
RETRIABLE_STATUS = {429, 500, 502, 503, 504}
MAX_LLM_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 0.8
LLM_ERROR_MESSAGE = (
    "Sorry — Galaxy AI is having trouble reaching its brain right now. "
    "Please try that again in a moment."
)

app = FastAPI(title="GalaxyPick API")
api_router = APIRouter(prefix="/api")


# -------------------- Models --------------------
class RecommendRequest(BaseModel):
    persona: Optional[str] = None
    needs: List[str] = []
    budget: Optional[int] = None
    preferences: List[str] = []


class ChatRequest(BaseModel):
    session_id: str
    message: str
    persona: Optional[str] = None


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" | "assistant"
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# -------------------- Endpoints --------------------
@api_router.get("/")
async def root():
    return {"message": "GalaxyPick API is running"}


@api_router.get("/phones")
async def list_phones():
    return {"phones": PHONES}


@api_router.get("/phones/{phone_id}")
async def get_phone(phone_id: str):
    phone = next((p for p in PHONES if p["id"] == phone_id), None)
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    return phone


@api_router.post("/recommend")
async def recommend(req: RecommendRequest):
    tags = list(req.needs)
    if req.persona:
        tags.append(req.persona.lower().replace(" ", "_").replace("/", "_"))
    scored = []
    for p in PHONES:
        score = match_score(p, tags, req.budget)
        scored.append({**p, "match": score})
    scored.sort(key=lambda x: x["match"], reverse=True)
    top = scored[:3]
    # Mark best match
    if top:
        top[0]["best_match"] = True
    return {"recommendations": top, "all_scored": scored}


@api_router.get("/location")
async def location(request: Request):
    """Detect country + currency from IP."""
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
    try:
        async with httpx.AsyncClient(timeout=3.0) as hc:
            r = await hc.get(f"https://ipapi.co/{ip}/json/" if ip else "https://ipapi.co/json/")
            data = r.json()
        return {
            "country": data.get("country_name", "India"),
            "country_code": data.get("country_code", "IN"),
            "currency": data.get("currency", "INR"),
        }
    except Exception:
        return {"country": "India", "country_code": "IN", "currency": "INR"}


def phones_mentioned(text, limit=3):
    """Catalog phones named in an assistant reply, in order of first mention.

    Matches longest names first and blanks each hit out of the haystack, so
    'Galaxy S26 Ultra' isn't also counted as a mention of 'Galaxy S26'.
    """
    haystack = text
    hits = []
    for phone in sorted(PHONES, key=lambda p: -len(p["name"])):
        idx = haystack.find(phone["name"])
        if idx != -1:
            hits.append((idx, phone))
            haystack = haystack[:idx] + "\0" * len(phone["name"]) + haystack[idx + len(phone["name"]):]
    hits.sort(key=lambda hit: hit[0])
    return [phone for _, phone in hits[:limit]]


def phone_card(phone):
    """Compact payload for the in-chat product cards."""
    return {
        "id": phone["id"],
        "name": phone["name"],
        "price_inr": phone["price_inr"],
        "image": phone["image"],
        "features": phone["features"][:3],
        "samsung_url": next(s["url"] for s in store_links(phone) if s["name"] == "Samsung"),
    }


def store_links(phone):
    q = phone["name"].replace(" ", "+")
    return [
        {"name": "Samsung", "url": f"https://www.google.com/search?q=site%3Asamsung.com+{q}", "price_inr": phone["price_inr"]},
        {"name": "Amazon", "url": f"https://www.amazon.in/s?k={q}", "price_inr": phone["price_inr"]},
        {"name": "Flipkart", "url": f"https://www.flipkart.com/search?q={q}", "price_inr": int(phone["price_inr"] * 1.015)},
    ]


@api_router.get("/buy-links/{phone_id}")
async def buy_links(phone_id: str):
    phone = next((p for p in PHONES if p["id"] == phone_id), None)
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    return {"stores": store_links(phone)}


# -------------------- Chat with Galaxy AI --------------------
SYSTEM_PROMPT = """You are Galaxy AI, a friendly Samsung Galaxy phone recommendation assistant.
Your job is to understand the user's needs (budget, use-case, preferences) and suggest the best Samsung Galaxy phone(s) from Samsung's 2024-2026 lineup.

Available Samsung phones you can recommend:
- Galaxy S26 Ultra (₹139,999) — Ultimate flagship, 200MP camera, S-Pen
- Galaxy S26+ (₹99,999) — Large flagship
- Galaxy S26 (₹74,999) — Compact flagship
- Galaxy Z Fold 7 (₹174,999) — Foldable, 8" screen
- Galaxy Z Flip 7 (₹109,999) — Flip foldable
- Galaxy S25 Ultra (₹129,999) — Last-gen flagship
- Galaxy S25 (₹69,999) — Compact
- Galaxy S24 FE (₹32,999) — Fan Edition
- Galaxy A55 5G (₹32,999) — Mid-range sweet spot
- Galaxy A35 5G (₹24,999) — Budget mid-range
- Galaxy M55 5G (₹24,999) — Battery + performance
- Galaxy M35 5G (₹17,999) — Budget battery beast

Guidelines:
- Keep responses concise (2-4 short paragraphs max)
- Ask ONE clarifying question if needed (budget, main use-case)
- When recommending, name 1-3 specific models and explain WHY in one line each
- Be warm and conversational, not robotic
- Never recommend non-Samsung phones
- Use ₹ (INR) for prices"""


@api_router.post("/chat")
async def chat(req: ChatRequest):
    if not genai_client:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    # Save user message
    user_msg = ChatMessage(session_id=req.session_id, role="user", content=req.message)
    await db.chat_messages.insert_one(user_msg.model_dump())

    # Replay the stored turns so the model can see the conversation so far.
    # The just-saved user message is the last entry, so this doubles as the prompt.
    prior = await db.chat_messages.find(
        {"session_id": req.session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    contents = [
        genai_types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[genai_types.Part(text=m["content"])],
        )
        for m in prior if m["content"]
    ]

    persona_ctx = f"\n\nUser persona: {req.persona}" if req.persona else ""
    config = genai_types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT + persona_ctx,
        # Thinking roughly doubles token spend on this workload for no gain here,
        # and burns free-tier quota. Recommending a phone needs no reasoning budget.
        thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
    )

    async def event_gen():
        full = []
        failed = False
        for attempt in range(MAX_LLM_ATTEMPTS):
            try:
                stream = await genai_client.aio.models.generate_content_stream(
                    model=GEMINI_MODEL, contents=contents, config=config
                )
                async for chunk in stream:
                    if chunk.text:
                        full.append(chunk.text)
                        # JSON-encode: model output contains blank lines, which would
                        # otherwise split the SSE frame and truncate the message.
                        yield f"data: {json.dumps(chunk.text)}\n\n"
                failed = False
                break
            except Exception as e:
                failed = True
                code = getattr(e, "code", None)
                retriable = code in RETRIABLE_STATUS and not full
                logger.error(
                    f"LLM stream error (attempt {attempt + 1}/{MAX_LLM_ATTEMPTS}, "
                    f"code={code}, retrying={retriable and attempt + 1 < MAX_LLM_ATTEMPTS}): {e}"
                )
                # Once any text has reached the client, a retry would duplicate it.
                if not retriable or attempt + 1 == MAX_LLM_ATTEMPTS:
                    break
                await asyncio.sleep(RETRY_BACKOFF_SECONDS * (2 ** attempt))

        if failed and not full:
            yield f"data: {json.dumps(LLM_ERROR_MESSAGE)}\n\n"

        # Persist only a real reply — an empty row would pollute the replayed history.
        if full:
            reply = "".join(full)
            cards = [phone_card(p) for p in phones_mentioned(reply)]
            if cards:
                yield f"data: {json.dumps({'type': 'phones', 'phones': cards})}\n\n"
            assistant = ChatMessage(session_id=req.session_id, role="assistant", content=reply)
            await db.chat_messages.insert_one(assistant.model_dump())
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/chat/{session_id}/history")
async def chat_history(session_id: str):
    msgs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return {"messages": msgs}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
