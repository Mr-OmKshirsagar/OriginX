import json
from typing import Any

import requests

from app.config import settings

_GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


def _normalize_output_language(output_language: str | None) -> str:
    normalized = (output_language or "en").strip().lower()
    if normalized in {"hi", "hindi"}:
        return "hi"
    if normalized in {"mr", "marathi"}:
        return "mr"
    return "en"


def _language_label(output_language: str) -> str:
    if output_language == "hi":
        return "Hindi"
    if output_language == "mr":
        return "Marathi"
    return "English"


def _localized_article_defaults(language: str, index: int) -> tuple[str, str, str]:
    if language == "hi":
        return (
            f"स्रोत {index}",
            "इस दावे से संबंधित समाचार साक्ष्य उपलब्ध है।",
            "विस्तृत शीर्षक और विवरण का स्थानीय सारांश तैयार किया गया है।",
        )
    if language == "mr":
        return (
            f"स्रोत {index}",
            "या दाव्याशी संबंधित बातमी पुरावा उपलब्ध आहे.",
            "तपशीलवार शीर्षक आणि वर्णनाचा स्थानिक सारांश तयार केला आहे.",
        )
    return (
        f"Source {index}",
        "News evidence related to this claim is available.",
        "A localized summary has been prepared for this evidence.",
    )


def _fallback_localized_articles(articles: list[dict[str, Any]], output_language: str) -> list[dict[str, Any]]:
    language = _normalize_output_language(output_language)
    localized: list[dict[str, Any]] = []

    for index, article in enumerate(articles, start=1):
        default_source, default_title, default_description = _localized_article_defaults(language, index)
        localized.append(
            {
                "source": default_source,
                "title": default_title,
                "description": default_description,
                "url": str(article.get("url", "") or ""),
                "similarity_score": article.get("similarity_score", 0),
            }
        )

    return localized


def localize_evidence_articles(articles: list[dict[str, Any]], output_language: str = "en") -> list[dict[str, Any]]:
    language = _normalize_output_language(output_language)
    if not articles:
        return []
    if language == "en":
        return articles

    if not settings.GOOGLE_AI_STUDIO_API_KEY:
        return _fallback_localized_articles(articles, language)

    endpoint = f"{_GEMINI_API_ROOT}/{settings.GEMINI_MODEL}:generateContent"

    compact_articles: list[dict[str, Any]] = []
    for article in articles:
        compact_articles.append(
            {
                "source": str(article.get("source", "") or ""),
                "title": str(article.get("title", "") or ""),
                "description": str(article.get("description", "") or ""),
                "url": str(article.get("url", "") or ""),
                "similarity_score": article.get("similarity_score", 0),
            }
        )

    prompt = (
        f"Translate every article object into {_language_label(language)} language only. "
        "Return strict JSON array only, without markdown. "
        "Preserve url and similarity_score exactly. "
        "Do not leave source/title/description in English.\n\n"
        f"Input JSON:\n{json.dumps(compact_articles, ensure_ascii=False)}"
    )

    payload: dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1600,
        },
    }

    try:
        response = requests.post(
            endpoint,
            params={"key": settings.GOOGLE_AI_STUDIO_API_KEY},
            json=payload,
            timeout=25,
        )
        response.raise_for_status()
        body = response.json()
        candidates = body.get("candidates", [])
        parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
        text_segments = [str(part.get("text", "")).strip() for part in parts if str(part.get("text", "")).strip()]
        merged = "\n".join(text_segments)
        translated = json.loads(merged)
        if not isinstance(translated, list):
            return _fallback_localized_articles(articles, language)

        localized: list[dict[str, Any]] = []
        for index, article in enumerate(translated):
            if not isinstance(article, dict):
                continue
            localized.append(
                {
                    "source": str(article.get("source", "") or ""),
                    "title": str(article.get("title", "") or ""),
                    "description": str(article.get("description", "") or ""),
                    "url": str(article.get("url", compact_articles[index].get("url", "")) or ""),
                    "similarity_score": article.get("similarity_score", compact_articles[index].get("similarity_score", 0)),
                }
            )

        if localized:
            return localized
    except (requests.RequestException, ValueError, json.JSONDecodeError, IndexError, TypeError):
        return _fallback_localized_articles(articles, language)

    return _fallback_localized_articles(articles, language)


def _fallback_summary(top_articles: list[dict[str, Any]], output_language: str = "en") -> str:
    language = _normalize_output_language(output_language)

    if not top_articles:
        if language == "hi":
            return "सारांश तैयार करने के लिए उच्च-विश्वसनीयता और उच्च-समानता वाली खबर उपलब्ध नहीं थी।"
        if language == "mr":
            return "सारांश तयार करण्यासाठी उच्च-विश्वासार्हता आणि उच्च-साम्य असलेली बातमी उपलब्ध नव्हती."
        return "No high-credibility, high-similarity news was available for summary generation."

    if language == "hi":
        return (
            f"इस दावे के लिए {len(top_articles[:3])} उच्च-विश्वसनीयता स्रोतों की समीक्षा की गई। "
            "उपलब्ध साक्ष्य के आधार पर मुख्य निष्कर्ष संकलित किए गए हैं।"
        )
    if language == "mr":
        return (
            f"या दाव्यासाठी {len(top_articles[:3])} उच्च-विश्वासार्ह स्रोतांचे परीक्षण करण्यात आले. "
            "उपलब्ध पुराव्यांच्या आधारे मुख्य निष्कर्ष संकलित केले आहेत."
        )

    parts: list[str] = []
    for article in top_articles[:3]:
        source = str(article.get("source", "Unknown source")).strip() or "Unknown source"
        title = str(article.get("title", "")).strip()
        description = str(article.get("description", "")).strip()
        if title and description:
            parts.append(f"{source}: {title}. {description}")
        elif title:
            parts.append(f"{source}: {title}")
        elif description:
            parts.append(f"{source}: {description}")
    if parts:
        return " ".join(parts)

    if language == "hi":
        return "उच्च-विश्वसनीयता वाले लेख मिले, लेकिन विवरण सीमित थे।"
    if language == "mr":
        return "उच्च-विश्वासार्ह लेख सापडले, परंतु तपशील मर्यादित होते."
    return "High-credibility articles were found, but details were limited."


def generate_evidence_summary(claim_text: str, top_articles: list[dict[str, Any]], output_language: str = "en") -> str:
    language = _normalize_output_language(output_language)

    if not top_articles:
        return _fallback_summary(top_articles, language)

    if not settings.GOOGLE_AI_STUDIO_API_KEY:
        return _fallback_summary(top_articles, language)

    endpoint = f"{_GEMINI_API_ROOT}/{settings.GEMINI_MODEL}:generateContent"

    evidence_lines: list[str] = []
    for article in top_articles[:3]:
        source = str(article.get("source", "Unknown source"))
        title = str(article.get("title", "")).strip()
        description = str(article.get("description", "")).strip()
        score = article.get("similarity_score", 0)
        evidence_lines.append(
            f"Source: {source}\nSimilarity: {score}\nTitle: {title}\nDescription: {description}"
        )

    prompt = (
        "You are summarizing evidence for a fact-checking system. "
        "Use only the provided news evidence and do not add outside information. "
        "Write one concise paragraph of 2-4 sentences. "
        f"Write the paragraph in {_language_label(language)} language only. "
        "Do not mention any credibility score, and do not output verdict labels.\n\n"
        f"Claim: {claim_text}\n\n"
        "Top high-credibility and high-similarity news:\n"
        + "\n\n".join(evidence_lines)
    )

    payload: dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 220,
        },
    }

    try:
        response = requests.post(
            endpoint,
            params={"key": settings.GOOGLE_AI_STUDIO_API_KEY},
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
    except requests.RequestException:
        return _fallback_summary(top_articles, language)

    candidates = body.get("candidates", [])
    if not candidates:
        return _fallback_summary(top_articles, language)

    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    text_segments = [str(part.get("text", "")).strip() for part in parts if str(part.get("text", "")).strip()]
    if not text_segments:
        return _fallback_summary(top_articles, language)

    return "\n".join(text_segments)
