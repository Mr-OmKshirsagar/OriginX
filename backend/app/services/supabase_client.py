from supabase import Client, create_client
import requests

from app.config import settings


def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured in backend/.env")

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def check_supabase_connection(timeout_seconds: int = 8) -> tuple[bool, str]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return False, "Missing SUPABASE_URL or SUPABASE_KEY in backend/.env"

    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout_seconds)
        if response.ok:
            return True, "Supabase REST endpoint reachable"
        return False, f"Supabase connection failed with status code {response.status_code}"
    except requests.RequestException as exc:
        return False, f"Supabase connection error: {exc}"


supabase: Client = get_supabase_client()
