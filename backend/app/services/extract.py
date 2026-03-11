from __future__ import annotations

import base64
from io import BytesIO
from typing import List, Optional

from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document
from pdf2image import convert_from_bytes
from PIL import Image


async def extract_text_from_upload(file: UploadFile) -> str:
    name = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    data = await file.read()

    if not data:
        return ""

    # TXT / MD
    if content_type.startswith("text/") or name.endswith(".txt") or name.endswith(".md"):
        try:
            return data.decode("utf-8")
        except Exception:
            return data.decode("latin-1", errors="ignore")

    # PDF (text layer)
    if content_type == "application/pdf" or name.endswith(".pdf"):
        reader = PdfReader(BytesIO(data))
        parts = []
        for page in reader.pages:
            txt = page.extract_text() or ""
            if txt.strip():
                parts.append(txt)
        return "\n\n".join(parts).strip()

    # DOCX
    if (
        content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or name.endswith(".docx")
    ):
        doc = Document(BytesIO(data))
        parts = []
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                parts.append(p.text.strip())
        return "\n".join(parts).strip()

    # Legacy DOC needs heavier tooling; keep it explicit
    if name.endswith(".doc"):
        raise ValueError("DOC files are not supported. Please upload DOCX or PDF.")

    # Fallback: best-effort decode
    try:
        return data.decode("utf-8")
    except Exception:
        return data.decode("latin-1", errors="ignore")


async def pdf_to_base64_images(data: bytes) -> List[str]:
    """
    Converts PDF pages to base64 PNG data URLs.
    """
    images = convert_from_bytes(data, dpi=150)
    base64_images = []
    for img in images:
        buf = BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        base64_images.append(f"data:image/png;base64,{b64}")
    return base64_images

