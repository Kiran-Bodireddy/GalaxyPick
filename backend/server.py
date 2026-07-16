from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

from phones import PHONES, match_score
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

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


@api_router.get("/buy-links/{phone_id}")
async def buy_links(phone_id: str):
    phone = next((p for p in PHONES if p["id"] == phone_id), None)
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    q = phone["name"].replace(" ", "+")
    return {
        "stores": [
            {"name": "Samsung", "url": f"https://www.google.com/search?q=site%3Asamsung.com+{q}", "price_inr": phone["price_inr"]},
            {"name": "Amazon", "url": f"https://www.amazon.in/s?k={q}", "price_inr": phone["price_inr"]},
            {"name": "Flipkart", "url": f"https://www.flipkart.com/search?q={q}", "price_inr": int(phone["price_inr"] * 1.015)},
        ]
    }


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
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    # Save user message
    user_msg = ChatMessage(session_id=req.session_id, role="user", content=req.message)
    await db.chat_messages.insert_one(user_msg.model_dump())

    persona_ctx = f"\n\nUser persona: {req.persona}" if req.persona else ""
    llm = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=req.session_id,
        system_message=SYSTEM_PROMPT + persona_ctx,
    ).with_model("gemini", "gemini-3-flash-preview")

    async def event_gen():
        full = []
        try:
            async for ev in llm.stream_message(UserMessage(text=req.message)):
                if isinstance(ev, TextDelta):
                    full.append(ev.content)
                    yield f"data: {ev.content}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.error(f"LLM stream error: {e}")
            yield f"data: [error: {str(e)}]\n\n"
        # Persist final
        assistant = ChatMessage(session_id=req.session_id, role="assistant", content="".join(full))
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
