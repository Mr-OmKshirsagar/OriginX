from app.config import settings
from app.services.gemini_summary import generate_evidence_summary, localize_evidence_articles


class _FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError("HTTP error")

    def json(self) -> dict:
        return self._payload


def test_generate_evidence_summary_uses_gemini(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    def _fake_post(*args, **kwargs):
        return _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "Reuters and BBC both report aligned updates from officials.",
                                }
                            ]
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr("app.services.gemini_summary.requests.post", _fake_post)

    summary = generate_evidence_summary(
        "sample claim",
        [
            {
                "source": "Reuters",
                "title": "Major update",
                "description": "Authorities issued details.",
                "similarity_score": 90,
            }
        ],
    )

    assert "Reuters" in summary


def test_generate_evidence_summary_without_key_uses_fallback(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "")

    summary = generate_evidence_summary(
        "sample claim",
        [
            {
                "source": "Reuters",
                "title": "Major update",
                "description": "Authorities issued details.",
                "similarity_score": 90,
            }
        ],
    )

    assert "Reuters" in summary


def test_generate_evidence_summary_structured_output_falls_back(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.0-mini")

    def _fake_post(*args, **kwargs):
        return _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": (
                                        "Source: Reuters\n"
                                        "Similarity: 90\n"
                                        "Title: Major update\n"
                                        "Description: Authorities issued details."
                                    ),
                                }
                            ]
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr("app.services.gemini_summary.requests.post", _fake_post)

    summary = generate_evidence_summary(
        "sample claim",
        [
            {
                "source": "Reuters",
                "title": "Major update",
                "description": "Authorities issued details.",
                "similarity_score": 90,
            }
        ],
        output_language="hi",
    )

    assert "Source:" not in summary
    assert "Reuters" in summary


def test_generate_evidence_summary_translates_non_english(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.0-mini")

    responses = [
        _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "Reuters reports aligned updates from officials.",
                                }
                            ]
                        }
                    }
                ]
            }
        ),
        _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "रॉयटर्सच्या अहवालानुसार अधिकाऱ्यांनी सुसंगत अद्यतने दिली आहेत.",
                                }
                            ]
                        }
                    }
                ]
            }
        ),
    ]

    def _fake_post(*args, **kwargs):
        return responses.pop(0)

    monkeypatch.setattr("app.services.gemini_summary.requests.post", _fake_post)

    summary = generate_evidence_summary(
        "sample claim",
        [
            {
                "source": "Reuters",
                "title": "Major update",
                "description": "Authorities issued details.",
                "similarity_score": 90,
            }
        ],
        output_language="mr",
    )

    assert "Reuters reports" not in summary
    assert "रॉयटर्स" in summary


def test_localize_evidence_articles_fallback_preserves_real_source(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "")

    localized = localize_evidence_articles(
        [
            {
                "source": "BBC News",
                "title": "Major update",
                "description": "Authorities issued details.",
                "similarity_score": 90,
            }
        ],
        output_language="hi",
    )

    assert localized[0]["source"] == "BBC News"
    assert localized[0]["title"] == "Major update"
    assert localized[0]["description"] == "Authorities issued details."


def test_localize_evidence_articles_translation_preserves_real_source(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.0-mini")

    def _fake_post(*args, **kwargs):
        return _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": '[{"source":"स्रोत 1","title":"शीर्षक","description":"विवरण","url":"https://example.com/1","similarity_score":90}]',
                                }
                            ]
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr("app.services.gemini_summary.requests.post", _fake_post)

    localized = localize_evidence_articles(
        [
            {
                "source": "BBC News",
                "title": "Major update",
                "description": "Authorities issued details.",
                "url": "https://example.com/1",
                "similarity_score": 90,
            }
        ],
        output_language="hi",
    )

    assert localized[0]["source"] == "BBC News"
    assert localized[0]["title"] == "Major update"
    assert localized[0]["description"] == "Authorities issued details."
