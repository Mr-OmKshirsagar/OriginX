from app.config import settings
from app.services.news_verification import fetch_trending_daily_news, search_news_sources
from requests import HTTPError, RequestException


class _FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise HTTPError(f"HTTP {self.status_code}")

    def json(self):
        return self._payload


def test_search_news_sources_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "demo-key")

    payload = {
        "articles": [
            {
                "source": {"name": "Reuters"},
                "title": "City says water supply is safe",
                "description": "Authorities deny poisoning rumors",
                "url": "https://example.com/reuters-1",
            },
            {
                "source": {"name": "Local News"},
                "title": "Sports update",
                "description": "Team wins match",
                "url": "https://example.com/local-2",
            },
        ]
    }

    def _fake_get(*args, **kwargs):
        return _FakeResponse(payload)

    monkeypatch.setattr("app.services.news_verification.requests.get", _fake_get)

    result = search_news_sources("city water supply poisoned")

    assert result["articles_found"] == 2
    assert result["articles"][0]["source"] == "Reuters"
    assert "similarity_score" in result["articles"][0]


def test_search_news_sources_missing_key(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "")

    try:
        search_news_sources("test claim")
    except ValueError as exc:
        assert "NEWSAPI_KEY" in str(exc)
    else:
        raise AssertionError("Expected ValueError when NEWSAPI_KEY is missing")


def test_search_news_sources_request_failure(monkeypatch) -> None:
    monkeypatch.setattr(settings, "NEWSAPI_KEY", "demo-key")

    def _fake_get(*args, **kwargs):
        raise RequestException("network down")

    monkeypatch.setattr("app.services.news_verification.requests.get", _fake_get)

    try:
        search_news_sources("test claim")
    except RuntimeError as exc:
        assert "NewsAPI request failed" in str(exc)
    else:
        raise AssertionError("Expected RuntimeError on request failure")


def test_fetch_trending_daily_news_filters_strict_category(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.news_verification._fetch_region_rss",
        lambda region_code, category=None: [
            {
                "source": "Reuters",
                "title": "AI startup unveils new semiconductor platform",
                "description": "Technology firms race to build faster AI chips",
                "url": "https://example.com/tech-story",
                "published_at": "2026-03-17T08:00:00Z",
                "region": region_code.upper(),
                "category": "technology",
            },
            {
                "source": "Reuters",
                "title": "National team wins football championship final",
                "description": "Sports fans celebrate a dramatic tournament finish",
                "url": "https://example.com/sports-story",
                "published_at": "2026-03-17T09:00:00Z",
                "region": region_code.upper(),
                "category": "sports",
            },
        ],
    )

    result = fetch_trending_daily_news(limit=10, country="in", category="technology", local_country="in")

    assert result["category"] == "technology"
    assert result["articles_found"] == 1
    assert result["articles"][0]["category"] == "technology"
    assert "AI startup" in result["articles"][0]["title"]


def test_fetch_trending_daily_news_classifies_general_when_no_specific_category(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.news_verification._fetch_region_rss",
        lambda region_code, category=None: [
            {
                "source": "Reuters",
                "title": "Prime minister addresses parliament after summit",
                "description": "Officials outlined the latest policy priorities in the capital",
                "url": "https://example.com/general-story",
                "published_at": "2026-03-17T10:00:00Z",
                "region": region_code.upper(),
            },
            {
                "source": "Reuters",
                "title": "Hospital expands vaccine trial across three cities",
                "description": "Researchers expect the health study to continue this year",
                "url": "https://example.com/health-story",
                "published_at": "2026-03-17T11:00:00Z",
                "region": region_code.upper(),
            },
        ],
    )

    result = fetch_trending_daily_news(limit=10, country="in", category="general", local_country="in")

    assert result["category"] == "general"
    assert result["articles_found"] == 1
    assert result["articles"][0]["category"] == "general"
    assert "parliament" in result["articles"][0]["title"].lower()
