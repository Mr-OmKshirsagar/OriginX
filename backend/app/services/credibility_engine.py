from typing import Any

from app.config import settings
from app.services.news_verification import _is_trusted_source as _region_aware_is_trusted_source


def _is_trusted_source(source_name: str) -> bool:
    return _region_aware_is_trusted_source(source_name, region_code=None)


def _safe_similarity_score(article: dict[str, Any]) -> int:
    try:
        return int(article.get("similarity_score", 0))
    except (TypeError, ValueError):
        return 0


def _safe_relevance_score(article: dict[str, Any]) -> int:
    try:
        return int(article.get("semantic_relevance_score", article.get("similarity_score", 0)))
    except (TypeError, ValueError):
        return 0


def _normalized_stance(article: dict[str, Any]) -> str:
    return str(article.get("stance_label", "related")).strip().lower() or "related"


def _safe_stance_confidence(article: dict[str, Any]) -> float:
    try:
        value = float(article.get("stance_confidence", 0.5))
    except (TypeError, ValueError):
        value = 0.5
    return max(0.0, min(value, 1.0))


def _is_high_similarity(article: dict[str, Any]) -> bool:
    return _safe_relevance_score(article) >= settings.CREDIBILITY_RELEVANCE_MIN


def _stance_score(article: dict[str, Any]) -> int:
    stance = _normalized_stance(article)
    confidence = _safe_stance_confidence(article)

    if stance == "supports":
        return int(70 + (confidence * 30))
    if stance == "contradicts":
        return int((1.0 - confidence) * 25)
    if stance == "unrelated":
        return int(10 + (confidence * 10))
    return int(45 + (confidence * 20))


def _article_quality_score(article: dict[str, Any]) -> int:
    source_score = 100 if _is_trusted_source(str(article.get("source", ""))) else 35
    relevance_score = _safe_relevance_score(article)
    stance_score = _stance_score(article)

    weighted = (0.30 * source_score) + (0.45 * relevance_score) + (0.25 * stance_score)
    return max(0, min(int(round(weighted)), 100))


def _enriched_article(article: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(article)
    enriched["semantic_relevance_score"] = _safe_relevance_score(article)
    enriched["stance_label"] = _normalized_stance(article)
    enriched["stance_confidence"] = _safe_stance_confidence(article)
    enriched["article_quality_score"] = _article_quality_score(article)
    return enriched


def select_top_credible_articles(articles: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    enriched_articles = [_enriched_article(article) for article in articles]
    credible_articles = [
        article
        for article in enriched_articles
        if _is_trusted_source(str(article.get("source", "")))
        and _is_high_similarity(article)
        and article.get("stance_label") != "contradicts"
    ]
    credible_articles.sort(key=lambda article: int(article.get("article_quality_score", 0)), reverse=True)
    return credible_articles[:limit]


def generate_verification_result(claim_text: str, articles: list[dict[str, Any]]) -> dict[str, Any]:
    if not articles:
        return {
            "claim": claim_text,
            "verification_result": "false",
            "verdict": "Likely false or unsupported",
            "credibility_score": 20,
            "top_credible_articles": [],
            "score_breakdown": {
                "mean_article_quality": 0,
                "trusted_ratio": 0.0,
                "support_ratio": 0.0,
                "contradiction_ratio": 0.0,
            },
        }

    enriched_articles = [_enriched_article(article) for article in articles]
    top_credible_articles = select_top_credible_articles(articles)

    considered_articles = sorted(
        enriched_articles,
        key=lambda article: int(article.get("article_quality_score", 0)),
        reverse=True,
    )[: settings.CREDIBILITY_TOP_ARTICLES_CONSIDERED]

    quality_scores = [int(article.get("article_quality_score", 0)) for article in considered_articles]
    mean_article_quality = sum(quality_scores) / len(quality_scores)

    trusted_count = sum(1 for article in considered_articles if _is_trusted_source(str(article.get("source", ""))))
    support_count = sum(1 for article in considered_articles if article.get("stance_label") == "supports")
    contradiction_count = sum(1 for article in considered_articles if article.get("stance_label") == "contradicts")

    trusted_ratio = trusted_count / len(considered_articles)
    support_ratio = support_count / len(considered_articles)
    contradiction_ratio = contradiction_count / len(considered_articles)

    score = (
        (settings.CREDIBILITY_WEIGHT_MEAN_QUALITY * mean_article_quality)
        + (settings.CREDIBILITY_WEIGHT_TRUST_RATIO * (trusted_ratio * 100))
        + (settings.CREDIBILITY_WEIGHT_SUPPORT_RATIO * (support_ratio * 100))
        - (settings.CREDIBILITY_CONTRADICTION_PENALTY * contradiction_ratio)
    )
    credibility_score = max(0, min(int(round(score)), 100))

    if credibility_score >= settings.CREDIBILITY_TRUE_THRESHOLD:
        verification_result = "true"
        verdict = "Likely true"
    elif credibility_score >= settings.CREDIBILITY_UNVERIFIED_THRESHOLD:
        verification_result = "false"
        verdict = "Likely false or unverified"
    else:
        verification_result = "false"
        verdict = "Likely false or unsupported"

    return {
        "claim": claim_text,
        "verification_result": verification_result,
        "verdict": verdict,
        "credibility_score": credibility_score,
        "top_credible_articles": top_credible_articles,
        "score_breakdown": {
            "mean_article_quality": round(mean_article_quality, 2),
            "trusted_ratio": round(trusted_ratio, 2),
            "support_ratio": round(support_ratio, 2),
            "contradiction_ratio": round(contradiction_ratio, 2),
        },
    }
