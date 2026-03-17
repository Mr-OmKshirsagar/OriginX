import base64
import binascii
from typing import Any

import requests

from app.config import settings

_GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"
_SUPPORTED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
_DEFAULT_FALLBACK_MODELS = ("gemini-2.5-flash", "gemini-2.0-flash")


def _normalize_base64_image(image_data: str) -> str:
    normalized = image_data.strip()
    if not normalized:
        raise ValueError("Image file is empty.")

    if normalized.startswith("data:"):
        try:
            _, normalized = normalized.split(",", 1)
        except ValueError as exc:
            raise ValueError("Invalid base64 image payload.") from exc

    try:
        decoded = base64.b64decode(normalized, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Invalid base64 image payload.") from exc

    if not decoded:
        raise ValueError("Image file is empty.")

    return base64.b64encode(decoded).decode("utf-8")


def _candidate_models() -> list[str]:
    models = [settings.GEMINI_MODEL, *_DEFAULT_FALLBACK_MODELS]
    unique_models: list[str] = []
    for model in models:
        if model and model not in unique_models:
            unique_models.append(model)
    return unique_models


def extract_text_from_image_bytes(image_bytes: bytes | str, content_type: str) -> str:
    if not image_bytes:
        raise ValueError("Image file is empty.")

    if content_type not in _SUPPORTED_IMAGE_TYPES:
        raise ValueError("Unsupported image type. Use PNG, JPEG, WEBP, HEIC, or HEIF.")

    if not settings.GOOGLE_AI_STUDIO_API_KEY:
        raise RuntimeError("GOOGLE_AI_STUDIO_API_KEY is not configured.")

    if isinstance(image_bytes, str):
        image_data = _normalize_base64_image(image_bytes)
    else:
        image_data = base64.b64encode(image_bytes).decode("utf-8")

    if not image_data:
        raise ValueError("Image file is empty.")
    prompt = (
        "Extract only the claim text visible in this image. "
        "Return plain text only. "
        "Do not summarize, paraphrase, correct, or add commentary. "
        "If there are multiple text blocks, return the main claim exactly as shown."
    )

    payload: dict[str, Any] = {
        "contents": [
            {
                "role":"user",
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": content_type,
                            "data": image_data,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 300,
        },
    }

    headers = {
        "x-goog-api-key": settings.GOOGLE_AI_STUDIO_API_KEY,
        "Content-Type": "application/json",
    }
    last_error: str | None = None
    body: dict[str, Any] | None = None

    for model in _candidate_models():
        endpoint = f"{_GEMINI_API_ROOT}/{model}:generateContent"
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=30,
            )
        except requests.RequestException as exc:
            last_error = str(exc)
            continue

        if response.ok:
            body = response.json()
            break

        error_payload: dict[str, Any] = {}
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {}

        detail = (
            ((error_payload.get("error") or {}).get("message"))
            if isinstance(error_payload, dict)
            else None
        )
        last_error = f"{response.status_code}: {detail or response.text or 'Gemini OCR request failed.'}"

        # If the configured model is invalid or unavailable, try a known multimodal fallback.
        if response.status_code in {404, 400}:
            continue

        break

    if body is None:
        raise RuntimeError(f"Image OCR request failed. {last_error or 'No upstream response.'}")

    candidates = body.get("candidates", [])
    if not candidates:
        raise RuntimeError("No OCR response was returned.")

    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    text_segments = [str(part.get("text", "")).strip() for part in parts if str(part.get("text", "")).strip()]
    extracted_text = "\n".join(text_segments).strip()

    if not extracted_text:
        raise RuntimeError("No text could be extracted from the image.")

    return extracted_text
