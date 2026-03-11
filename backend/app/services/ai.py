from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx


def _clean_json_text(text: str) -> str:
    raw = (text or "").strip()
    raw = raw.removeprefix("```json").removeprefix("```").strip()
    if raw.endswith("```"):
        raw = raw[: -3].strip()
    return raw


def safe_json_loads(text: str) -> Dict[str, Any]:
    cleaned = _clean_json_text(text)
    return json.loads(cleaned)


def extract_image_data_url_from_chat(completion: Dict[str, Any]) -> Optional[str]:
    """
    OpenRouter returns OpenAI-like responses. The assistant content may be a string
    or an array of parts. We look for an image_url.url which may be a data URL.
    """
    try:
        choices = completion.get("choices") or []
        msg = (choices[0] or {}).get("message") or {}
        content = msg.get("content")

        if isinstance(content, list):
            for part in content:
                if part.get("type") == "image_url":
                    image_url = part.get("image_url") or {}
                    url = image_url.get("url")
                    if isinstance(url, str) and url:
                        return url
        return None
    except Exception:
        return None


@dataclass
class OpenRouterClient:
    text_api_key: str
    vision_api_key: str
    site_url: str
    app_name: str
    text_model: str
    vision_model: str
    timeout_s: float = 60.0

    @staticmethod
    def from_env() -> "OpenRouterClient":
        text_api_key = os.getenv("OPENROUTER_TEXT_API_KEY", "").strip()
        vision_api_key = os.getenv("OPENROUTER_VISION_API_KEY", "").strip()
        return OpenRouterClient(
            text_api_key=text_api_key,
            vision_api_key=vision_api_key,
            site_url=os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173"),
            app_name=os.getenv("OPENROUTER_APP_NAME", "DysLearn"),
            text_model=os.getenv("OPENROUTER_TEXT_MODEL", "nvidia/nemotron-3-nano-30b-a3b:free"),
            vision_model=os.getenv("OPENROUTER_VISION_MODEL", "nvidia/nemotron-nano-12b-v2-vl:free"),
        )

    def _headers(self, is_vision: bool = False) -> Dict[str, str]:
        key = self.vision_api_key if is_vision else self.text_api_key
        return {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": self.site_url,
            "X-Title": self.app_name,
            "Content-Type": "application/json",
        }

    async def _post(self, path: str, payload: Dict[str, Any], is_vision: bool = False) -> Dict[str, Any]:
        key = self.vision_api_key if is_vision else self.text_api_key
        if not key:
            raise RuntimeError(f"{'VISION' if is_vision else 'TEXT'} API key not set")

        url = f"https://openrouter.ai/api/v1{path}"
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.post(url, headers=self._headers(is_vision), json=payload)
            if resp.status_code >= 400:
                raise RuntimeError(f"OpenRouter error {resp.status_code}: {resp.text}")
            return resp.json()

    async def chat_text(
        self,
        *,
        system: str,
        user: str,
        response_format_json: bool,
    ) -> str:
        body: Dict[str, Any] = {
            "model": self.text_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
        }

        if response_format_json:
            body["response_format"] = {"type": "json_object"}

        try:
            data = await self._post("/chat/completions", body, is_vision=False)
        except RuntimeError as e:
            if "response_format" in body and "json_object" in str(e):
                del body["response_format"]
                data = await self._post("/chat/completions", body, is_vision=False)
            else:
                raise e

        content = (((data.get("choices") or [])[0] or {}).get("message") or {}).get("content") or ""
        return content

    async def chat_vision(
        self,
        *,
        system: str,
        user: str,
        images: List[str] = None, # List of data URLs
    ) -> str:
        """
        Using the 12B VL model for vision tasks.
        """
        content_parts = [{"type": "text", "text": user}]
        if images:
            for img_url in images:
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": img_url}
                })

        body: Dict[str, Any] = {
            "model": self.vision_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": content_parts},
            ],
            "temperature": 0.2,
        }
        
        data = await self._post("/chat/completions", body, is_vision=True)
        content = (((data.get("choices") or [])[0] or {}).get("message") or {}).get("content") or ""
        return content

    async def chat_image_gen(self, *, prompt: str) -> Dict[str, Any]:
        """
        Legacy image generation placeholder. 
        Note: The 12B VL model is for VISION UNDERSTANDING, not generation.
        We'll keep this but it might need a different model if used for 'txt2img'.
        """
        body: Dict[str, Any] = {
            "model": self.vision_model,
            "modalities": ["image", "text"],
            "messages": [
                {
                    "role": "system",
                    "content": "Generate a simple, child-friendly educational illustration. No text in the image.",
                },
                {"role": "user", "content": prompt},
            ],
        }
        return await self._post("/chat/completions", body, is_vision=True)

