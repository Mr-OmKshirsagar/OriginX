import unicodedata


def preprocess_claim_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    normalized = " ".join(normalized.split())
    normalized = normalized.lower()
    return normalized
