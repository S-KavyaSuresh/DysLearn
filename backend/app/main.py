from __future__ import annotations

import base64
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.services.ai import (
    OpenRouterClient,
    extract_image_data_url_from_chat,
    safe_json_loads,
)
from app.services.extract import extract_text_from_upload, pdf_to_base64_images

load_dotenv()

APP_NAME = "DysLearn API"


def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


cors_origins = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

app = FastAPI(title=APP_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai = OpenRouterClient.from_env()


@app.get("/")
def read_root() -> Dict[str, Any]:
    return {"message": "Welcome to DysLearn API", "health": "/health"}


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "provider": "openrouter", "text_model": ai.text_model}


@app.post("/api/extract-text")
async def api_extract_text(file: UploadFile = File(...)) -> Dict[str, str]:
    try:
        text = await extract_text_from_upload(file)
        return {"text": text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to extract text") from e


@app.post("/api/simplify")
async def api_simplify(payload: Dict[str, Any]) -> Dict[str, Any]:
    text = payload.get("text")
    mode = payload.get("mode", "text")
    is_pdf = payload.get("is_pdf", False)
    raw_file_b64 = payload.get("file_b64")

    # If it's a PDF and we have the raw file, we can use vision for processing
    images = []
    if is_pdf and raw_file_b64:
        # Convert base64 PDF to bytes
        try:
            pdf_bytes = base64.b64decode(raw_file_b64)
            images = await pdf_to_base64_images(pdf_bytes)
            # Limit to first 3 pages for token safety
            images = images[:3]
        except Exception as e:
            print(f"Vision processing failed: {e}")

    system_prompt = "You are a kind, clear tutor helping a dyslexic child. Return ONLY valid JSON."
    
    prompt = f"""
Return ONLY valid JSON with this exact shape:
{{
  "simplified": string,
  "keypoints": string[],
  "examples": string[],
  "mindmap": string,
  "summary": string,
  "layman": string,
  "visuals": string[]
}}

Guidelines:
- "simplified": Replace difficult big words with simple words with the same meaning. Use short, clear sentences.
- "keypoints": Neatly extract and list the most important points.
- "examples": Provide 2–4 relevant examples if they exist or can be inferred.
- "summary": A brief, comforting overview.
- "layman": Explain the simplified text in very basic layman terms.
- "mindmap": MUST be Mermaid mindmap syntax. Start with: mindmap
- "visuals": 2–4 simple image prompts (no text in image).

Input Text:
\"\"\"{text if not images else "Please analyze the attached images of the study material."}\"\"\"
"""

    try:
        if images:
            # Use vision model (12B) for image-based PDFs
            content = await ai.chat_vision(
                system=system_prompt,
                user=prompt,
                images=images
            )
        else:
            # Use text model (30B) for normal text
            content = await ai.chat_text(
                system=system_prompt,
                user=prompt,
                response_format_json=True,
            )
        
        parsed = safe_json_loads(content)
        return {
            "simplified": parsed.get("simplified", ""),
            "keypoints": parsed.get("keypoints", []) if isinstance(parsed.get("keypoints"), list) else [],
            "examples": parsed.get("examples", []) if isinstance(parsed.get("examples"), list) else [],
            "mindmap": parsed.get("mindmap", ""),
            "summary": parsed.get("summary", ""),
            "layman": parsed.get("layman", ""),
            "visuals": parsed.get("visuals", []) if isinstance(parsed.get("visuals"), list) else [],
        }
    except Exception as e:
        print(f"Simplification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to simplify text") from e


@app.post("/api/mindmap")
async def api_mindmap(payload: Dict[str, Any]) -> Dict[str, str]:
    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Missing or invalid 'text'")

    prompt = f"""
Create a Mermaid mindmap for this text.

Requirements:
- Output ONLY Mermaid mindmap syntax.
- Start with: mindmap
- Use short words/phrases.
- Use 1 central topic and 3–6 branches.

Text:
\"\"\"{text}\"\"\"
"""
    try:
        mermaid = await ai.chat_text(
            system="Return only Mermaid mindmap syntax. No markdown.",
            user=prompt,
            response_format_json=False,
        )
        mermaid = mermaid.strip().replace("```mermaid", "").replace("```", "").strip()
        return {"mermaid": mermaid}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate mindmap") from e


@app.post("/api/quiz")
async def api_quiz(payload: Dict[str, Any]) -> Dict[str, Any]:
    text = payload.get("text")
    count = payload.get("count", 6)
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Missing or invalid 'text'")

    try:
        n = int(count)
    except Exception:
        n = 6
    n = max(3, min(12, n))

    prompt = f"""
Create a quiz from this study text for a child with dyslexia.

Return ONLY valid JSON with this shape:
{{
  "questions": [
    {{
      "question": string,
      "choices": string[],
      "answerIndex": number,
      "explanation": string
    }}
  ]
}}

Rules:
- Create exactly {n} questions.
- Each question must have 4 choices.
- Keep questions short and clear.
- Explanations must be simple.

Study text:
\"\"\"{text}\"\"\"
"""

    try:
        content = await ai.chat_text(
            system="Return only valid JSON. No markdown.",
            user=prompt,
            response_format_json=True,
        )
        parsed = safe_json_loads(content)
        questions = parsed.get("questions")
        if not isinstance(questions, list):
            questions = []
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate quiz") from e


@app.post("/api/assistant")
async def api_assistant(payload: Dict[str, Any]) -> Dict[str, str]:
    message = payload.get("message")
    if not isinstance(message, str) or not message.strip():
        raise HTTPException(status_code=400, detail="Missing or invalid 'message'")

    prompt = f"""
Student message:
\"\"\"{message}\"\"\"

Guidelines:
1. Keep responses SHORT and CONCISE (2-3 sentences max for greetings, 4-5 for study help).
2. For simple greetings like "Hello", "Hi", respond with just a warm, brief greeting.
3. Be encouraging but avoid lengthy motivational speeches.
4. Use simple words and short sentences.
5. Use 1-2 emojis maximum.
6. For study questions, give direct, clear answers with brief bullet points if needed.
"""
    try:
        answer = await ai.chat_text(
            system="You are a concise, friendly AI study assistant for a dyslexic student. Keep all responses brief and to the point. Avoid long paragraphs.",
            user=prompt,
            response_format_json=False,
        )
        return {"answer": answer.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to answer") from e


@app.post("/api/image")
async def api_image(payload: Dict[str, Any]) -> Dict[str, Optional[str]]:
    prompt = payload.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise HTTPException(status_code=400, detail="Missing or invalid 'prompt'")

    try:
        completion = await ai.chat_image_gen(prompt=prompt)
        image_data_url = extract_image_data_url_from_chat(completion)
        return {"imageDataUrl": image_data_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate image") from e


@app.get("/api/quote")
async def api_quote() -> Dict[str, str]:
    prompt = "Give me one short, inspiring, unique motivational quote for a student with dyslexia. No hashtags. No repetition."
    try:
        quote = await ai.chat_text(
            system="You are a warm, encouraging mentor.",
            user=prompt,
            response_format_json=False
        )
        return {"quote": quote.strip()}
    except Exception:
        return {"quote": "Believe in yourself, you're doing great!"}


@app.post("/api/smart-schedule")
async def api_smart_schedule(payload: Dict[str, Any]) -> Dict[str, Any]:
    subjects = payload.get("subjects", [])
    hours = payload.get("hours", 2)
    
    document_text = payload.get("document_text", "")
    
    prompt = f"""
Create a balanced weekly study schedule for a dyslexic student.
Subjects: {', '.join(subjects)}
Total study hours per day: {hours}
Study Material / Document Content:
\"\"\"{document_text[:4000]}\"\"\"

Instructions:
1. If a document is provided, identify the main headings or topics.
2. Allocate study time based on the amount of content under each heading (more content = more time).
3. Ensure the schedule is spread across Monday to Friday.
4. Keep sessions under 45 minutes to maintain focus.
5. Add short breaks between sessions.

Return ONLY valid JSON in this format:
{{
  "schedule": [
    {{
      "day": "Monday",
      "sessions": [
        {{ "subject": string, "startTime": "09:00", "duration": number }}
      ]
    }}
  ]
}}
"""
    try:
        content = await ai.chat_text(
            system="You are a smart educational planner.",
            user=prompt,
            response_format_json=True
        )
        parsed = safe_json_loads(content)
        return {"schedule": parsed.get("schedule", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to plan") from e

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
