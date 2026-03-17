from app.services import reddit_propagation


class _FakeResponse:
    def __init__(self, payload: object, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError("HTTP error")

    def json(self):
        return self._payload


def test_search_reddit_posts_parses_results(monkeypatch) -> None:
    payload = {
        "data": {
            "children": [
                {
                    "data": {
                        "id": "abc1",
                        "author": "user_1",
                        "title": "Bridge collapse rumor",
                        "selftext": "Witnesses claim major incident",
                        "created_utc": 1710400000,
                        "subreddit": "news",
                        "permalink": "/r/news/comments/abc1/test/",
                        "num_comments": 12,
                    }
                }
            ]
        }
    }

    monkeypatch.setattr("app.services.reddit_propagation.requests.get", lambda *args, **kwargs: _FakeResponse(payload))

    posts = reddit_propagation.search_reddit_posts("bridge collapse")

    assert len(posts) == 1
    assert posts[0]["post_id"] == "abc1"
    assert posts[0]["user_id"] == "user_1"


def test_build_reddit_events_with_comments(monkeypatch) -> None:
    search_payload = {
        "data": {
            "children": [
                {
                    "data": {
                        "id": "abc1",
                        "author": "user_1",
                        "title": "Bridge collapse rumor",
                        "selftext": "Witnesses claim major incident",
                        "created_utc": 1710400000,
                        "permalink": "/r/news/comments/abc1/test/",
                        "num_comments": 1,
                    }
                }
            ]
        }
    }
    comments_payload = [
        {"data": {"children": []}},
        {
            "data": {
                "children": [
                    {
                        "data": {
                            "author": "user_2",
                            "body": "I saw similar reports.",
                            "created_utc": 1710400100,
                        }
                    }
                ]
            }
        },
    ]

    def _fake_get(url, *args, **kwargs):
        if "/search.json" in url:
            return _FakeResponse(search_payload)
        if "/comments/" in url:
            return _FakeResponse(comments_payload)
        return _FakeResponse({}, status_code=404)

    monkeypatch.setattr("app.services.reddit_propagation.requests.get", _fake_get)

    events = reddit_propagation.build_reddit_events("bridge collapse", include_comments=True)

    assert len(events) == 2
    assert events[0]["user_id"] == "user_1"
    assert events[1]["user_id"] == "user_2"


def test_analyze_reddit_propagation_shape(monkeypatch) -> None:
    monkeypatch.setattr(
        reddit_propagation,
        "build_reddit_events",
        lambda **_kwargs: [
            {
                "user_id": "user_1",
                "claim_text": "bridge collapse rumor",
                "timestamp": "2026-03-14T10:00:00+00:00",
                "narrative_key": "bridge collapse",
            }
        ],
    )

    result = reddit_propagation.analyze_reddit_propagation("bridge collapse")

    assert result["source"] == "reddit"
    assert result["query"] == "bridge collapse"
    assert "nodes" in result
    assert "edges" in result
    assert "timeline" in result
    assert "events_captured" in result
    assert "patient_zero" in result
    assert "top_amplifier" in result
    assert "analysis" in result
