"""
Smart Lesson Copilot — Backend Routes
Generates AI-powered lesson slides using Google Gemini, with Wikimedia image support.
"""

import os
import json
import re
import asyncio
import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.database import get_database

router = APIRouter(prefix="/api/lessons", tags=["lessons"])

# ── Config ─────────────────────────────────────────────
# We will construct the URL dynamically inside the function.

# ── Models ─────────────────────────────────────────────

class LessonRequest(BaseModel):
    board: str        # CBSE or ICSE
    grade: str        # "9" or "10"
    subject: str      # Physics, Chemistry, Biology
    chapter: str
    subtopic: str
    vibe: str         # concept_intro, deep_dive, exam_revision

class LessonSave(BaseModel):
    title: str
    board: str
    grade: str
    subject: str
    chapter: str
    subtopic: str
    vibe: str
    slides: list


# ── Master Prompt Builder ──────────────────────────────

VIBE_INSTRUCTIONS = {
    "concept_intro": (
        "You are teaching this topic for the VERY FIRST TIME to a Class {grade} student. "
        "Build intuition before introducing terms. Start with a relatable real-world hook "
        "(e.g. for Power: 'Why does a sports car feel more powerful than a cycle-rickshaw?'). "
        "Use ONE strong analogy per concept. Keep formulas to max 2. "
        "Add a 'Did You Know?' curiosity slide. NEVER use jargon without explaining it first."
    ),
    "deep_dive": (
        "You are preparing a student who already understands basics but needs exam-grade depth. "
        "Explain mechanisms step-by-step with cause → effect reasoning. "
        "For every formula, show: what each variable means, its SI unit, and one worked example. "
        "Add a 'Common Mistakes Students Make' slide (real errors seen in board exams). "
        "Include at least one HOTS (Higher Order Thinking) question."
    ),
    "exam_revision": (
        "You are a board exam coach doing a 30-minute rapid revision. "
        "Every bullet must be a fact a student can directly write in an answer. "
        "Include a 'PYQ Spotlight' slide with 2 actual-style previous year questions and ideal answers. "
        "Add marking scheme tips: 1-mark vs 3-mark answers. "
        "Flag topics with asterisk (*) if they appear frequently in CBSE/ICSE papers."
    ),
}

def build_master_prompt(req: LessonRequest) -> str:
    vibe_text = VIBE_INSTRUCTIONS.get(req.vibe, VIBE_INSTRUCTIONS["concept_intro"])
    vibe_text = vibe_text.replace("{grade}", req.grade)

    return f"""You are a veteran {req.board} Class {req.grade} {req.subject} teacher with 20 years of experience \
coaching students who score 95+ in board exams. You know exactly which concepts students struggle with, \
which questions appear in exams, and how to explain things simply yet precisely.

Create a PowerPoint lesson on "{req.chapter} → {req.subtopic}" for {req.board} Class {req.grade} students.

TEACHING MODE: {req.vibe.upper()}
{vibe_text}

━━━ OUTPUT FORMAT ━━━
Return a JSON array of exactly 7-8 slide objects. No markdown, no explanation, only raw JSON.

Each slide MUST have:
- "type": one of "title" | "content" | "flowchart" | "diagram" | "quiz" | "summary"
- "title": clear, engaging slide heading (no generic titles like "Introduction")

━━━ SLIDE TYPE SPECS ━━━

"title":
  - "subtitle": one punchy line that sparks curiosity
  - "tagline": "{req.board} Class {req.grade} | {req.subject}"

"content":
  - "bullets": 3-5 strings. Each bullet = ONE complete, standalone fact. 
    NO markdown bold (**text**). NO vague statements. Each must be exam-usable.
    Good: "Power is measured in Watts (W); 1 W = 1 Joule per second"
    Bad: "Power is important in physics"
  - "highlight": ONE key formula or definition (plain text, no LaTeX, no markdown)

"flowchart":
  - "mermaidCode": Valid Mermaid.js. CRITICAL SYNTAX RULES:
    * Use ONLY graph TD or graph LR
    * Node IDs: single letters only (A, B, C...)
    * Node labels: use ONLY square brackets: A[Label here]
    * Labels must NOT contain: (), {{}}, <>, special chars, apostrophes
    * Arrows: A --> B or A -->|label| B  
    * Keep each label under 5 words
    * Escape ALL newlines as \\n in JSON
    * Example: "graph TD\\n    A[Water stored] --> B[Flows down]\\n    B --> C[Turbine spins]\\n    C --> D[Electricity generated]"
  - "caption": one sentence explaining the flow

"diagram":
  - "imageQuery": 2-4 words MAX, very generic (e.g. "pendulum diagram", "human heart", "solar system")
    NEVER include words like "labelled", "cross section", "interconversion", "showing"
  - "caption": what this diagram illustrates in one sentence
  - "altText": text description if image unavailable

"quiz":
  - "questions": array of 2 questions (not 4, keep it tight), each:
    * "question": clear, board-exam style question
    * "options": exactly 4 options (plain strings, no A/B/C prefix)
    * "correct": index 0-3
    * "explanation": why the correct answer is right (1-2 sentences, exam-voice)

"summary":
  - "keyPoints": 4-6 bullets. Each = a fact a student writes in board exam.
  - "examTip": ONE specific tip e.g. "In CBSE 2023, a 3-mark question asked to derive the relation between kWh and Joules"

━━━ SLIDE SEQUENCE RULES ━━━
1. Slide 1 = "title"
2. Slide 2 = "content" (core concept, NOT introduction)
3. Include exactly 1 "flowchart" — pick a process that genuinely benefits from a flow diagram
4. Include exactly 1 "diagram" — only if a visual genuinely helps; otherwise use "content"
5. Include 1 "quiz" in the middle (slide 5 or 6)
6. Last slide = "summary"

━━━ QUALITY RULES ━━━
- Write as if you're the teacher speaking, not a textbook
- No filler bullets ("This is an important concept")
- All numbers must have units
- All definitions must be precise enough to score full marks
- Return ONLY the JSON array"""


# ── Gemini API Call ────────────────────────────────────

async def call_gemini(prompt: str) -> list:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    
    if not gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured. Add it to your .env file."
        )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }

    # Primary model + fallback if primary is overloaded
    models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
    ]
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    max_retries = 3

    last_error = None
    for model in models:
        gemini_url = f"{base_url}/{model}:generateContent"
        for attempt in range(max_retries):
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"{gemini_url}?key={gemini_api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

            if resp.status_code == 200:
                break  # Success — exit retry loop
            elif resp.status_code == 503:
                last_error = f"{model} unavailable (attempt {attempt + 1}/{max_retries})"
                wait_time = (2 ** attempt) + 1  # 2s, 3s, 5s
                await asyncio.sleep(wait_time)
            else:
                error_detail = resp.text[:300]
                raise HTTPException(
                    status_code=502,
                    detail=f"Gemini API error ({resp.status_code}): {error_detail}"
                )
        else:
            # All retries exhausted for this model — try the next one
            continue
        break  # Success — exit model loop
    else:
        # All models and retries exhausted
        raise HTTPException(
            status_code=503,
            detail=f"Gemini API is temporarily overloaded. Please try again in a minute. Last: {last_error}"
        )

    data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        # Clean up: remove code fences if model wraps output
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        slides = json.loads(text)
        if not isinstance(slides, list):
            raise ValueError("Expected JSON array")
        return slides
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini response: {str(e)}"
        )


# ── Wikipedia Image Search ─────────────────────────────

async def search_wikimedia(query: str, limit: int = 3) -> list:
    """Search Wikipedia for educational images related to the query."""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "prop": "pageimages",
        "pithumbsize": "800",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "0",  # Article namespace
        "gsrlimit": str(limit),
        "format": "json",
        "origin": "*"
    }

    headers = {
        "User-Agent": "TutorFlow/1.0 (contact@example.com)"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params, headers=headers)

    if resp.status_code != 200:
        return []

    data = resp.json()
    pages = data.get("query", {}).get("pages", {})

    results = []
    for page in pages.values():
        title = page.get("title", "")
        thumbnail = page.get("thumbnail", {})
        thumb_url = thumbnail.get("source", "")
        if thumb_url:
            results.append({
                "title": title,
                "thumbnail": thumb_url,
                "fullUrl": thumb_url,
            })

    return results


def sanitize_image_query(query: str) -> str:
    """Strip verbose words that hurt Wikimedia search results."""
    stop_words = [
        "labelled", "labeled", "diagram showing", "cross section of",
        "interconversion", "illustration of", "schematic of",
        "detailed", "annotated", "figure of"
    ]
    q = query.lower()
    for word in stop_words:
        q = q.replace(word, "")
    # Keep only first 4 words max
    words = q.strip().split()[:4]
    return " ".join(words)

async def enrich_slides_with_images(slides: list) -> list:
    """Fetch images for diagram-type slides from Wikimedia."""
    for slide in slides:
        if slide.get("type") == "diagram" and slide.get("imageQuery"):
            clean_query = sanitize_image_query(slide["imageQuery"])
            slide["imageQueryUsed"] = clean_query  # useful for debugging
            
            # Initial search attempt
            images = await search_wikimedia(clean_query, limit=3)
            
            # Fallback logic: drop trailing words incrementally until a match is found
            words = clean_query.split()
            while not images and len(words) > 1:
                words.pop()
                fallback_query = " ".join(words)
                slide["imageQueryUsed"] = f"{clean_query} -> fallback: {fallback_query}"
                images = await search_wikimedia(fallback_query, limit=3)
                
            if images:
                slide["imageUrl"] = images[0]["fullUrl"]
                slide["thumbnailUrl"] = images[0]["thumbnail"]
            else:
                slide["imageUrl"] = None
                slide["thumbnailUrl"] = None
    return slides


# ── Route Handlers ─────────────────────────────────────

@router.post("/generate")
async def generate_lesson(data: LessonRequest, request: Request):
    """Generate a lesson using Gemini AI."""
    prompt = build_master_prompt(data)
    slides = await call_gemini(prompt)
    slides = await enrich_slides_with_images(slides)

    return {
        "title": f"{data.chapter}: {data.subtopic}",
        "board": data.board,
        "grade": data.grade,
        "subject": data.subject,
        "chapter": data.chapter,
        "subtopic": data.subtopic,
        "vibe": data.vibe,
        "slides": slides,
        "generatedAt": datetime.utcnow().isoformat(),
    }


@router.get("/image-search")
async def image_search(q: str, limit: int = 8):
    """Search Wikimedia Commons for images."""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    results = await search_wikimedia(q.strip(), limit=limit)
    return {"results": results}


@router.post("/save")
async def save_lesson(data: LessonSave, request: Request):
    """Save a generated lesson to MongoDB."""
    db = get_database()
    user_id = request.state.user_id
    doc = {
        "user_id": user_id,
        "title": data.title,
        "board": data.board,
        "grade": data.grade,
        "subject": data.subject,
        "chapter": data.chapter,
        "subtopic": data.subtopic,
        "vibe": data.vibe,
        "slides": data.slides,
        "created_at": datetime.utcnow(),
    }
    result = await db.lessons.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Lesson saved"}


@router.get("")
async def list_lessons(request: Request):
    """List saved lessons for the current user."""
    db = get_database()
    user_id = request.state.user_id
    lessons = await db.lessons.find(
        {"user_id": user_id},
        {"slides": 0}  # Exclude slides for listing
    ).sort("created_at", -1).to_list(50)

    return [
        {
            "id": str(l["_id"]),
            "title": l["title"],
            "board": l["board"],
            "grade": l["grade"],
            "subject": l["subject"],
            "chapter": l["chapter"],
            "subtopic": l.get("subtopic", ""),
            "vibe": l.get("vibe", ""),
            "created_at": l.get("created_at", datetime.utcnow()),
        }
        for l in lessons
    ]


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, request: Request):
    """Retrieve a single saved lesson with slides."""
    db = get_database()
    user_id = request.state.user_id
    try:
        lesson = await db.lessons.find_one(
            {"_id": ObjectId(lesson_id), "user_id": user_id}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {
        "id": str(lesson["_id"]),
        "title": lesson["title"],
        "board": lesson["board"],
        "grade": lesson["grade"],
        "subject": lesson["subject"],
        "chapter": lesson["chapter"],
        "subtopic": lesson.get("subtopic", ""),
        "vibe": lesson.get("vibe", ""),
        "slides": lesson["slides"],
        "created_at": lesson.get("created_at", datetime.utcnow()),
    }


@router.delete("/{lesson_id}")
async def delete_lesson(lesson_id: str, request: Request):
    """Delete a saved lesson."""
    db = get_database()
    user_id = request.state.user_id
    try:
        result = await db.lessons.delete_one(
            {"_id": ObjectId(lesson_id), "user_id": user_id}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid lesson ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted"}
