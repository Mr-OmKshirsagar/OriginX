import re
from datetime import datetime, timezone
import time
from typing import Any
from xml.etree import ElementTree

import requests

from app.config import settings

_NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything"

_RSS_FETCH_TIMEOUT_SECONDS = 12
_TRENDING_CACHE_TTL_SECONDS = 30 * 60
_EMPTY_RESULT_CACHE_TTL_SECONDS = 60
_GLOBAL_LOCAL_STORY_RATIO = 0.7

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "business": ["business", "economy", "economic", "market", "markets", "stock", "stocks", "finance", "financial", "trade", "bank", "banking", "investment", "inflation", "gdp", "tariff"],
    "entertainment": ["entertainment", "movie", "movies", "film", "films", "music", "celebrity", "celebrities", "tv", "television", "show", "shows", "streaming", "box office", "hollywood", "bollywood"],
    "health": ["health", "medical", "medicine", "hospital", "hospitals", "disease", "wellness", "vaccine", "vaccines", "virus", "mental health", "public health", "doctor", "doctors"],
    "science": ["science", "research", "scientist", "scientists", "space", "physics", "biology", "chemistry", "climate study", "laboratory", "lab", "nasa", "experiment", "scientific"],
    "sports": ["sport", "sports", "football", "cricket", "tennis", "olympic", "olympics", "league", "match", "tournament", "goal", "coach", "nba", "fifa", "ipl", "championship"],
    "technology": ["technology", "tech", "ai", "artificial intelligence", "software", "device", "devices", "startup", "cyber", "cybersecurity", "app", "apps", "semiconductor", "chip", "chips", "smartphone", "internet", "robot"],
}

_GLOBAL_RSS_FEEDS: list[dict[str, str]] = [
    {"source": "Reuters", "url": "https://www.reuters.com/world/rss"},
    {"source": "BBC News", "url": "http://feeds.bbci.co.uk/news/world/rss.xml"},
    {"source": "Associated Press", "url": "https://apnews.com/hub/ap-top-news?output=amp"},
    {"source": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml"},
]

_COUNTRY_RSS_FEEDS: dict[str, list[dict[str, str]]] = {
    "us": [
        {"source": "Reuters", "url": "https://www.reuters.com/world/us/rss"},
        {"source": "NPR", "url": "https://feeds.npr.org/1001/rss.xml"},
        {"source": "CNN", "url": "http://rss.cnn.com/rss/edition_us.rss"},
    ],
    "in": [
        {"source": "The Hindu", "url": "https://www.thehindu.com/news/national/feeder/default.rss"},
        {"source": "The Indian Express", "url": "https://indianexpress.com/section/india/feed/"},
        {"source": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms"},
        {"source": "NDTV", "url": "https://feeds.feedburner.com/ndtvnews-top-stories"},
    ],
    "gb": [
        {"source": "BBC News", "url": "http://feeds.bbci.co.uk/news/uk/rss.xml"},
        {"source": "The Guardian", "url": "https://www.theguardian.com/uk/rss"},
        {"source": "Financial Times", "url": "https://www.ft.com/rss/home/uk"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/uk/rss"},
    ],
    "au": [
        {"source": "ABC News (AU)", "url": "https://www.abc.net.au/news/feed/51120/rss.xml"},
        {"source": "Sydney Morning Herald", "url": "https://www.smh.com.au/rss/feed.xml"},
        {"source": "The Age", "url": "https://www.theage.com.au/rss/feed.xml"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/asia-pacific/rss"},
    ],
    "ca": [
        {"source": "CBC News", "url": "https://www.cbc.ca/webfeed/rss/rss-topstories"},
        {"source": "Global News", "url": "https://globalnews.ca/feed/"},
        {"source": "National Post", "url": "https://nationalpost.com/feed/"},
        {"source": "The Globe and Mail", "url": "https://www.theglobeandmail.com/arc/outboundfeeds/rss/"},
    ],
    "de": [
        {"source": "Deutsche Welle", "url": "https://rss.dw.com/rdf/rss-en-all"},
        {"source": "Der Spiegel", "url": "https://www.spiegel.de/international/index.rss"},
        {"source": "Die Zeit", "url": "https://newsfeed.zeit.de/index"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/europe/rss"},
    ],
    "fr": [
        {"source": "France 24", "url": "https://www.france24.com/en/rss"},
        {"source": "Le Monde", "url": "https://www.lemonde.fr/en/rss_full.xml"},
        {"source": "Le Figaro", "url": "https://www.lefigaro.fr/rss/figaro_actualites.xml"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/europe/rss"},
    ],
    "sg": [
        {"source": "The Straits Times", "url": "https://www.straitstimes.com/news/singapore/rss.xml"},
        {"source": "Channel NewsAsia", "url": "https://www.channelnewsasia.com/rssfeeds/8395986"},
        {"source": "TODAY", "url": "https://www.todayonline.com/feed"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/asia-pacific/rss"},
    ],
    "jp": [
        {"source": "NHK", "url": "https://www3.nhk.or.jp/rss/news/cat0.xml"},
        {"source": "The Japan Times", "url": "https://www.japantimes.co.jp/feed/"},
        {"source": "Nikkei Asia", "url": "https://asia.nikkei.com/rss/feed/nar"},
        {"source": "Reuters", "url": "https://www.reuters.com/world/asia-pacific/rss"},
    ],
}

_TRENDING_CACHE: dict[str, tuple[float, int, dict[str, Any]]] = {}

_GLOBAL_TRUSTED_SOURCES = {
    "reuters",
    "associated press",
    "ap news",
    "bbc",
    "the guardian",
    "al jazeera",
    "bloomberg",
    "financial times",
    "new york times",
    "the washington post",
    "npr",
    "cnn",
    "abc news",
    "cbs news",
    "nbc news",
    "the wall street journal",
    "wsj",
}

_REGION_TRUSTED_SOURCES: dict[str, set[str]] = {
    "us": {
        "usa today",
        "los angeles times",
        "politico",
        "axios",
    },
    "in": {
        "the hindu",
        "hindustan times",
        "the indian express",
        "times of india",
        "the times of india",
        "ndtv",
        "ndtv news",
        "ani",
        "ani news",
        "pti",
        "press trust of india",
        "deccan herald",
        "india today",
        "news18",
        "firstpost",
        "the economic times",
        "economic times",
        "moneycontrol",
        "mint",
        "livemint",
        "business standard",
        "the print",
        "wion",
    },
    "gb": {
        "bbc",
        "bbc news",
        "bbc sport",
        "the guardian",
        "guardian",
        "financial times",
        "sky news",
        "the telegraph",
        "telegraph",
        "independent",
        "the times",
        "metro",
        "itv news",
        "the economist",
        "evening standard",
        "daily mail",
        "mirror",
        "the sun",
        "express",
        "reuters uk",
    },
    "au": {
        "abc news",
        "abc news (au)",
        "sydney morning herald",
        "the age",
        "the australian",
        "news.com.au",
        "australian financial review",
        "afr",
        "7news",
        "9news",
        "sbs news",
        "the conversation",
        "the west australian",
        "brisbane times",
    },
    "ca": {
        "cbc",
        "cbc news",
        "globe and mail",
        "the globe and mail",
        "toronto star",
        "national post",
        "ctv news",
        "global news",
        "citynews",
        "calgary herald",
        "vancouver sun",
        "ottawa citizen",
        "montreal gazette",
    },
    "de": {
        "dw",
        "deutsche welle",
        "spiegel",
        "der spiegel",
        "die zeit",
        "frankfurter allgemeine",
        "faz",
        "handelsblatt",
        "suddeutsche",
        "sueddeutsche",
        "tagesschau",
        "welt",
        "berliner morgenpost",
    },
    "fr": {
        "le monde",
        "france 24",
        "le figaro",
        "liberation",
        "liberation.fr",
        "les echos",
        "le parisien",
        "lci",
        "bfm",
        "franceinfo",
        "ouest-france",
        "20 minutes",
    },
    "jp": {
        "nhk",
        "nhk world",
        "japan times",
        "nikkei",
        "nikkei asia",
        "mainichi",
        "asahi",
        "asahi shimbun",
        "yomiuri",
        "kyodo news",
        "jiji",
        "japan today",
        "kyodo",
    },
    "sg": {
        "straits times",
        "the straits times",
        "channel newsasia",
        "cna",
        "today online",
        "today",
        "business times",
        "the business times",
        "mothership",
        "mustsharenews",
    },
}


def _trusted_sources_for_region(region_code: str | None) -> set[str]:
    normalized_region = (region_code or "").strip().lower()
    return _GLOBAL_TRUSTED_SOURCES.union(_REGION_TRUSTED_SOURCES.get(normalized_region, set()))


def _is_trusted_source(source_name: str, region_code: str | None = None) -> bool:
    normalized = source_name.lower().strip()
    trusted_sources = _trusted_sources_for_region(region_code)
    return any(trusted_name in normalized for trusted_name in trusted_sources)


def _normalize_country(value: str | None, fallback: str = "us") -> str:
    normalized = (value or "").strip().lower()
    if len(normalized) != 2 or not normalized.isalpha():
        return fallback
    return normalized


def _is_valid_country(value: str | None) -> bool:
    normalized = (value or "").strip().lower()
    return len(normalized) == 2 and normalized.isalpha()


def _normalize_category(value: str | None) -> str | None:
    normalized = (value or "").strip().lower()
    if not normalized or normalized == "all":
        return None
    return normalized


def _shape_trending_article(article: dict[str, Any], region: str, category: str) -> dict[str, Any]:
    source_name = (article.get("source") or {}).get("name") or "Unknown"
    title = article.get("title") or "Untitled"
    description = article.get("description") or ""
    url = article.get("url") or ""
    published_at = article.get("publishedAt") or ""

    return {
        "source": source_name,
        "title": title,
        "description": description,
        "url": url,
        "published_at": published_at,
        "region": region,
        "category": category,
    }


def _cache_key(limit: int, country: str, category: str | None, local_country: str | None) -> str:
    return f"{limit}|{country}|{category or 'all'}|{local_country or ''}"


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _first_text(node: ElementTree.Element, names: list[str]) -> str:
    for child in node.iter():
        tag = _strip_ns(child.tag)
        if tag in names:
            if tag == "link":
                href = (child.attrib.get("href") or "").strip()
                if href:
                    return href
            text = (child.text or "").strip()
            if text:
                return text
    return ""


def _all_texts(node: ElementTree.Element, names: list[str]) -> list[str]:
    values: list[str] = []
    for child in node.iter():
        tag = _strip_ns(child.tag)
        if tag not in names:
            continue

        if tag == "link":
            href = (child.attrib.get("href") or "").strip()
            if href:
                values.append(href)
            continue

        text = (child.text or "").strip()
        if text:
            values.append(text)

    return values


def _classify_article_category(title: str, description: str, extra_texts: list[str] | None = None) -> str:
    blob = " ".join(part for part in [title, description, *(extra_texts or [])] if part).lower()
    if not blob.strip():
        return "general"

    category_scores: dict[str, int] = {}
    for category_name, keywords in _CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in blob:
                score += 1
        if score > 0:
            category_scores[category_name] = score

    if not category_scores:
        return "general"

    return max(category_scores.items(), key=lambda item: item[1])[0]


def _category_matches(category: str | None, title: str, description: str, extra_texts: list[str] | None = None) -> bool:
    if not category:
        return True

    return _classify_article_category(title, description, extra_texts) == category


def _fetch_feed_articles(feed: dict[str, str], region: str, category: str | None) -> list[dict[str, Any]]:
    headers = {
        "User-Agent": "OriginX/1.0 (+https://originx.local)",
    }
    try:
        response = requests.get(feed["url"], headers=headers, timeout=_RSS_FETCH_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException:
        return []

    try:
        root = ElementTree.fromstring(response.content)
    except ElementTree.ParseError:
        return []

    entries: list[ElementTree.Element] = []
    for node in root.iter():
        tag = _strip_ns(node.tag)
        if tag in {"item", "entry"}:
            entries.append(node)

    articles: list[dict[str, Any]] = []
    for entry in entries[:30]:
        title = _first_text(entry, ["title"])
        description = _first_text(entry, ["description", "summary", "content"])
        link = _first_text(entry, ["link", "id"])
        published_at = _first_text(entry, ["pubDate", "published", "updated"])
        feed_categories = _all_texts(entry, ["category", "term", "subject"])
        detected_category = _classify_article_category(title, description, [feed["source"], *feed_categories])

        if not title:
            continue
        if category and detected_category != category:
            continue

        articles.append(
            {
                "source": feed["source"],
                "title": title,
                "description": description,
                "url": link,
                "published_at": published_at,
                "region": region,
                "category": detected_category,
            }
        )

    return articles


def _fetch_region_rss(region_code: str, category: str | None) -> list[dict[str, Any]]:
    feeds = _COUNTRY_RSS_FEEDS.get(region_code, [])
    articles: list[dict[str, Any]] = []
    for feed in feeds:
        articles.extend(_fetch_feed_articles(feed, region=region_code.upper(), category=category))
    return articles


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _similarity_score(claim_text: str, article_text: str) -> int:
    claim_tokens = _tokenize(claim_text)
    article_tokens = _tokenize(article_text)

    if not claim_tokens or not article_tokens:
        return 0

    overlap = len(claim_tokens.intersection(article_tokens))
    score = int((overlap / len(claim_tokens)) * 100)
    return max(0, min(score, 100))


def search_news_sources(claim_text: str) -> dict[str, Any]:
    if not settings.NEWSAPI_KEY:
        raise ValueError("NEWSAPI_KEY is not configured.")

    params = {
        "q": claim_text,
        "apiKey": settings.NEWSAPI_KEY,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": 10,
    }

    try:
        response = requests.get(_NEWSAPI_ENDPOINT, params=params, timeout=15)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"NewsAPI request failed: {exc}") from exc

    raw_articles = payload.get("articles", [])
    articles: list[dict[str, Any]] = []

    for article in raw_articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        source_name = (article.get("source") or {}).get("name") or "Unknown"

        articles.append(
            {
                "source": source_name,
                "title": title,
                "description": description,
                "url": article.get("url") or "",
                "similarity_score": _similarity_score(claim_text, f"{title} {description}"),
            }
        )

    articles.sort(key=lambda item: item["similarity_score"], reverse=True)

    return {
        "articles_found": len(articles),
        "articles": articles,
    }


def fetch_trending_daily_news(
    limit: int = 20,
    country: str = "global",
    category: str | None = None,
    local_country: str | None = None,
) -> dict[str, Any]:
    safe_limit = max(1, min(limit, 50))
    requested_country = (country or "global").strip().lower() or "global"
    safe_category = _normalize_category(category)
    safe_local_country = _normalize_country(local_country, fallback="us")
    response_category = safe_category or "general"

    if requested_country != "global" and not _is_valid_country(requested_country):
        raise ValueError("Selected country must be a valid 2-letter country code or 'global'.")

    key = _cache_key(safe_limit, requested_country, response_category, safe_local_country)
    now = time.time()
    cached = _TRENDING_CACHE.get(key)
    if cached and (now - cached[0]) < cached[1]:
        return cached[2]

    articles: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    skipped_untrusted = 0

    def append_articles(items: list[dict[str, Any]], region: str, max_count: int | None = None) -> int:
        nonlocal skipped_untrusted
        region_code = region.lower() if len(region) == 2 else None
        added = 0
        for article in items:
            if max_count is not None and added >= max_count:
                break
            if {"source", "title", "description", "url", "published_at"}.issubset(article.keys()):
                raw_title = str(article.get("title", "Untitled"))
                raw_description = str(article.get("description", ""))
                shaped_category = str(article.get("category") or _classify_article_category(raw_title, raw_description, [str(article.get("source", "Unknown"))]))
                shaped = {
                    "source": str(article.get("source", "Unknown")),
                    "title": raw_title,
                    "description": raw_description,
                    "url": str(article.get("url", "")),
                    "published_at": str(article.get("published_at", "")),
                    "region": region,
                    "category": shaped_category,
                }
            else:
                shaped = _shape_trending_article(article, region=region, category=response_category)

            if safe_category and shaped["category"] != safe_category:
                continue

            if not _is_trusted_source(shaped["source"], region_code=region_code):
                skipped_untrusted += 1
                continue

            canonical_url = shaped["url"].strip().lower()
            if canonical_url and canonical_url in seen_urls:
                continue
            if canonical_url:
                seen_urls.add(canonical_url)
            articles.append(shaped)
            added += 1
            if len(articles) >= safe_limit:
                break

        return added

    if requested_country == "global":
        local_articles = _fetch_region_rss(safe_local_country, category=safe_category)
        local_target = safe_limit
        non_local_target = 0
        if safe_limit > 1:
            local_target = max(1, min(safe_limit - 1, int(round(safe_limit * _GLOBAL_LOCAL_STORY_RATIO))))
            non_local_target = safe_limit - local_target

        append_articles(local_articles, region=safe_local_country.upper(), max_count=local_target)

        remaining_non_local = non_local_target
        if remaining_non_local > 0:
            for region_code in _COUNTRY_RSS_FEEDS:
                if region_code == safe_local_country:
                    continue
                if remaining_non_local <= 0:
                    break

                added = append_articles(
                    _fetch_region_rss(region_code, category=safe_category),
                    region=region_code.upper(),
                    max_count=remaining_non_local,
                )
                remaining_non_local -= added

        if remaining_non_local > 0:
            global_articles: list[dict[str, Any]] = []
            for feed in _GLOBAL_RSS_FEEDS:
                global_articles.extend(_fetch_feed_articles(feed, region="GLOBAL", category=safe_category))
            append_articles(global_articles, region="GLOBAL", max_count=remaining_non_local)

        # If non-local feeds are temporarily sparse, backfill with additional local stories.
        if len(articles) < safe_limit:
            append_articles(local_articles, region=safe_local_country.upper())
    else:
        # Strict region mode: fetch only for the exact selected region from trusted RSS feeds.
        append_articles(_fetch_region_rss(requested_country, category=safe_category), region=requested_country.upper())

    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "refresh_interval_minutes": 30,
        "trusted_only": True,
        "trusted_source_count": len(_trusted_sources_for_region(requested_country if requested_country != "global" else safe_local_country)),
        "skipped_untrusted_count": skipped_untrusted,
        "requested_country": requested_country,
        "local_country": safe_local_country,
        "category": response_category,
        "articles_found": len(articles),
        "articles": articles,
    }

    ttl = _TRENDING_CACHE_TTL_SECONDS if result["articles_found"] > 0 else _EMPTY_RESULT_CACHE_TTL_SECONDS
    _TRENDING_CACHE[key] = (now, ttl, result)
    return result
