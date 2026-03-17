from app.config import settings
from app.services.gemini_summary import generate_evidence_summary


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
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.0-mini")

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
