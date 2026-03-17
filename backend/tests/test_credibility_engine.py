from app.services.credibility_engine import generate_verification_result


def test_generate_verification_result_true_with_multiple_trusted_sources() -> None:
    articles = [
        {
            "source": "Reuters",
            "title": "Major update",
            "description": "Authorities issued details.",
            "similarity_score": 82,
            "semantic_relevance_score": 84,
            "stance_label": "supports",
            "stance_confidence": 0.9,
        },
        {
            "source": "BBC News",
            "title": "City briefing",
            "description": "Officials shared findings.",
            "similarity_score": 77,
            "semantic_relevance_score": 78,
            "stance_label": "supports",
            "stance_confidence": 0.8,
        },
        {
            "source": "Associated Press",
            "title": "Public safety note",
            "description": "Data was corroborated.",
            "similarity_score": 64,
            "semantic_relevance_score": 67,
            "stance_label": "supports",
            "stance_confidence": 0.75,
        },
    ]

    result = generate_verification_result("sample claim", articles)

    assert result["verification_result"] == "true"
    assert result["verdict"] == "Likely true"
    assert result["credibility_score"] >= 80
    assert len(result["top_credible_articles"]) >= 3
    assert result["top_credible_articles"][0]["source"] == "Reuters"
    assert "score_breakdown" in result


def test_generate_verification_result_false_with_no_trusted_sources() -> None:
    articles = [
        {
            "source": "Unknown Blog",
            "title": "Rumor post",
            "description": "Unverified thread.",
            "similarity_score": 90,
            "semantic_relevance_score": 88,
            "stance_label": "contradicts",
            "stance_confidence": 0.9,
        },
        {
            "source": "Forum Post",
            "title": "Discussion",
            "description": "Community comments.",
            "similarity_score": 60,
            "semantic_relevance_score": 58,
            "stance_label": "unrelated",
            "stance_confidence": 0.7,
        },
    ]

    result = generate_verification_result("sample claim", articles)

    assert result["verification_result"] == "false"
    assert result["verdict"] == "Likely false or unsupported"
    assert result["credibility_score"] <= 35
    assert result["top_credible_articles"] == []


def test_generate_verification_result_penalizes_contradictions() -> None:
    supportive_articles = [
        {
            "source": "Reuters",
            "title": "Officials confirm update",
            "description": "Authorities verified the claim.",
            "semantic_relevance_score": 82,
            "stance_label": "supports",
            "stance_confidence": 0.9,
        },
        {
            "source": "BBC News",
            "title": "Evidence supports event",
            "description": "Report aligns with claim details.",
            "semantic_relevance_score": 76,
            "stance_label": "supports",
            "stance_confidence": 0.8,
        },
    ]
    contradictory_articles = [
        {
            "source": "Reuters",
            "title": "Officials deny rumor",
            "description": "Statement says claim is false.",
            "semantic_relevance_score": 82,
            "stance_label": "contradicts",
            "stance_confidence": 0.9,
        },
        {
            "source": "BBC News",
            "title": "No evidence found",
            "description": "Investigation refuted key claim details.",
            "semantic_relevance_score": 76,
            "stance_label": "contradicts",
            "stance_confidence": 0.8,
        },
    ]

    supportive_result = generate_verification_result("sample claim", supportive_articles)
    contradictory_result = generate_verification_result("sample claim", contradictory_articles)

    assert supportive_result["credibility_score"] > contradictory_result["credibility_score"]
