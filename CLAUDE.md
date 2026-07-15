# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GalaxyPick — a Samsung Galaxy phone recommender. A user either walks a wizard
(persona → needs → budget → preferences → recommendations) or chats with "Galaxy AI",
and gets phone suggestions that link through to an ecommerce-style product page.

FastAPI backend + Create React App (craco) frontend + MongoDB. It was scaffolded by
Emergent (`.emergent/emergent.yml` pins `fastapi_react_mongo_shadcn_base_image_cloud_arm`)
and originally ran only inside their cloud container. It now runs locally, and the
Emergent LLM wrapper has been replaced with the Google Gemini API directly.

## Commands

Backend and frontend run as two processes. Neither is started by the other.

```bash
# Backend — from backend/
./.venv/Scripts/python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001

# Frontend — from frontend/
yarn start                     # CRA dev server on :3000, hot reloads

# Backend tests (see pytest.ini warning below)
cd backend && ./.venv/Scripts/python.exe -m pytest
./.venv/Scripts/python.exe -m pytest -n 0            # serial run
./.venv/Scripts/python.exe -m pytest tests/test_x.py::TestClass::test_name
```

**The backend does not auto-reload.** It is run without `--reload`, so any edit to
`server.py`, `phones.py`, or `backend/.env` requires killing and restarting uvicorn.
The frontend does hot-reload.

`backend/pytest.ini` carries an explicit instruction not to modify `addopts` (it must stay
`-n 2 --dist loadscope`). Run serially with `-n 0` — `-p no:xdist` errors, because addopts
still passes `-n`. As of writing, `tests/` contains only `__init__.py`.

## Setting up on a fresh machine

Nothing here is installed by default; there is no Docker setup.

1. **Node.js** (LTS) and **MongoDB Server** — e.g. `winget install OpenJS.NodeJS.LTS`
   and `winget install MongoDB.Server`. Mongo runs as a Windows service on
   `localhost:27017`; no auth, no seeding needed.
2. **Yarn**, not npm. `package.json` uses a `resolutions` block, which npm ignores.
   Use corepack: `corepack enable`. If that fails with EPERM (it writes to
   `C:\Program Files\nodejs`), use `corepack enable --install-directory <writable dir>`
   and put that dir on PATH.
3. **Python venv** in `backend/.venv`.
4. **Both `.env` files are gitignored and will not come with a clone** — recreate them
   (see below). The Gemini key in particular has to be carried over by hand.

### requirements.txt does not install as pinned

`pip install -r requirements.txt` fails on Python 3.14: the pinned `fastapi==0.110.1` /
`uvicorn==0.25.0` force a re-resolve that drags in a `litellm` wheel from an Emergent
asset host, which is unreliable. The working venv has **newer** versions than the file
specifies (fastapi 0.139, uvicorn 0.51, motor 3.7). Install the packages the app actually
imports rather than the pinned file:

```bash
pip install fastapi uvicorn motor pymongo python-dotenv httpx google-genai pydantic
```

`emergentintegrations` has been removed from the code, but other unused Emergent-era
deps (boto3, passlib, litellm, …) remain listed in requirements.txt.

## Environment

`backend/.env`:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=galaxypick
CORS_ORIGINS=*
GEMINI_API_KEY=          # from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-3.1-flash-lite
```

`frontend/.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8001
PORT=3000
```

`server.py` reads `MONGO_URL` and `DB_NAME` at import time and crashes without them.
`REACT_APP_BACKEND_URL` must point at the backend port; the frontend appends `/api`.

## Gemini

Never hardcode a model — it comes from `GEMINI_MODEL`, and models get retired.

- `gemini-2.5-flash` and `gemini-2.5-flash-lite` return **"no longer available to new
  users"** on a freshly issued key. `gemini-2.0-flash`/`-lite` report a free-tier limit
  of **0**. Don't reach for these.
- **Free-tier quota is per model, per day, and small** — `gemini-3.5-flash` allows only
  20 requests/day. Hitting it returns 429 `RESOURCE_EXHAUSTED`. Switching `GEMINI_MODEL`
  to another model gives a fresh bucket; billing removes the caps.
- **Chat calls cost the user real quota. Do not send test messages casually.** Exercise
  the UI without sending chat messages where possible; a handful of test conversations
  can exhaust a day's allowance.
- `thinking_budget=0` is set deliberately: Gemini 3.x spends ~1,450 thinking tokens per
  turn by default — more than the answer — for no quality gain on this workload. It
  halves token cost but does **not** help with the requests/day cap.
- The SDK's async streaming needs `async for chunk in await client.aio.models.generate_content_stream(...)`
  — it's a coroutine returning an async iterator.

## Architecture

### Backend (`backend/server.py`, single file)

All routes live under an `/api` prefix (`api_router`). **`phones.py` is the source of
truth for the 12-phone catalog** — it is a plain Python list, not database-backed.
MongoDB stores only `chat_messages`.

- `match_score()` in `phones.py` scores phones against persona/needs tags. Persona ids in
  `SelectPersona.jsx` must match the `match_tags` strings, or matching silently degrades.
- `store_links(phone)` builds the Samsung/Amazon/Flipkart URLs and is shared by
  `/api/buy-links` and the chat cards — keep it that way so they can't drift.
- `phones_mentioned(text)` scans a finished assistant reply for catalog phone names to
  build the in-chat product cards. It matches **longest name first and blanks each hit**,
  so "Galaxy S26 Ultra" isn't also counted as "Galaxy S26". Preserve that if you touch it.

### The chat stream contract

`/api/chat` returns SSE. **Frames are of two kinds**, and both sides depend on this:

- `data: "<json string>"` — a text chunk. JSON-encoded on purpose: replies contain blank
  lines, and a raw `\n\n` would split the SSE frame and silently truncate the message.
- `data: {"type":"phones","phones":[…]}` — product cards, emitted once after the text.
- `data: [DONE]` — sentinel.

`Chat.jsx` distinguishes them with a `typeof` check. Anything added to this stream must
be a JSON object with a `type`.

Gemini is stateless, so **conversation memory is rebuilt every turn** by replaying
`chat_messages` from Mongo into `contents`. Failed turns persist no assistant row — an
empty one would be replayed back to the model as a blank turn.

Transient failures (429/5xx) retry 3× with backoff; permanent ones (e.g. 404) don't.
Retries only happen before any text has been sent, since a retry would duplicate it.
Users see a friendly message; the real error goes to the server log.

### Frontend (`frontend/src`)

CRA + craco, Tailwind, shadcn/ui in `components/ui`, `@` aliased to `src`.

- `context/GalaxyContext.jsx` holds wizard state (persona, needs, budget, preferences,
  recommendations). It is **in-memory only** — deep-linking to `/recommendations` or
  `/needs` without walking the wizard means empty state.
- `hooks/useSaved.js` — bookmarks in `localStorage` under `galaxypick.saved`. It keeps
  separate mounts in sync via a module-level listener set, because the `storage` event
  only fires in *other* tabs.
- Pages map 1:1 to routes in `App.js`. `/models` and `/compare` were added later;
  `/compare` takes its selection from `?ids=a,b,c`.

**The Header creates a containing block for fixed children.** It has `backdrop-blur-xl`,
and a `backdrop-filter` ancestor makes `position: fixed` resolve against *it*, not the
viewport — a modal rendered inside the header gets clipped into the 64px bar. The About
dialog uses `createPortal(…, document.body)` for this reason. Any new modal in the header
must do the same.

Animations are plain CSS keyframes in `index.css` (`fade-up`, `hero-device`, `hero-glow`),
gated behind `prefers-reduced-motion`. framer-motion is in `package.json` but unused —
match the CSS convention rather than introducing it.

## Data that is fabricated

Be careful about presenting these as real:

- **Reviews are hardcoded** — `4.6`, `2,345 reviews` and the 72/20/6/1/1 histogram are
  identical for every phone, and there is no reviews backend. "Write a Review" validates
  input, says "submitted for moderation", and discards it.
- **Catalog images are generic stock photos**, several shared between phones; some aren't
  even Samsung devices. `m55`/`m35` previously pointed at a dead URL that 404'd.
- **Store links are Google searches**, not real product pages
  (`google.com/search?q=site:samsung.com+…`).
- Product pages show a hardcoded `98% Match` regardless of the wizard.

## Notes

- `test_result.md` contains an Emergent testing-agent protocol block marked do-not-edit.
- The README is a placeholder; `frontend/README.md` is CRA boilerplate.
