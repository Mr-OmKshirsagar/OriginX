export interface VerificationSource {
  source: string;
  title?: string;
  description?: string;
  url?: string;
  similarity_score?: number;
}

export interface VerifyClaimResponse {
  status: string;
  message?: string;
  claim?: string;
  verification_result: string;
  verdict: string;
  credibility_score: number;
  summary: string;
  articles_found: number;
  sources: VerificationSource[];
  warning?: string;
}

export interface DomainSecurityResult {
  url: string;
  domain?: string;
  domain_risk: "high" | "medium" | "low" | "unknown";
  reason: string;
  metadata?: {
    ip_address?: string | null;
    page_title?: string | null;
    redirect_hops?: number | null;
    registrar?: string | null;
    dns_a?: string[];
    dns_mx?: string[];
    ssl_expiry?: string | null;
    ssl_valid?: boolean | null;
    location?: string | null;
    country?: string | null;
    country_code?: string | null;
    isp?: string | null;
    domain_created_at?: string | null;
    domain_expires_at?: string | null;
    domain_age_days?: number | null;
  };
}

export interface DomainSecurityResponse {
  results: DomainSecurityResult[];
}

export interface RedditEdge {
  source: string;
  target: string;
  weight: number;
}

export interface RedditAnalysis {
  patient_zero: string | null;
  spread_nodes: number;
  super_spreader: string | null;
  clusters: Array<{ cluster_id: string; event_count: number }>;
  graph: {
    nodes: string[];
    edges: RedditEdge[];
  };
}

export interface RedditPropagationResponse {
  source: "reddit";
  query: string;
  events_count: number;
  analysis: RedditAnalysis;
}

export interface TrendingNewsArticle {
  source: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  region: string;
  category: string;
}

export interface TrendingNewsResponse {
  generated_at: string;
  refresh_interval_minutes: number;
  trusted_only: boolean;
  trusted_source_count: number;
  skipped_untrusted_count: number;
  requested_country: string;
  local_country: string;
  category: string;
  articles_found: number;
  articles: TrendingNewsArticle[];
}

export interface DashboardTotals {
  total_verifications: number;
  true_claims: number;
  false_claims: number;
  uncertain_claims: number;
}

export interface DashboardChanges {
  total_verifications: string;
  true_claims: string;
  false_claims: string;
  uncertain_claims: string;
}

export interface DashboardRecentVerification {
  id: string;
  claim: string;
  score: number;
  status: string;
  created_at: string;
  sources: number;
}

export interface DashboardTrendingTopic {
  topic: string;
  count: number;
  trend: "up" | "down";
}

export interface DashboardSummaryResponse {
  generated_at: string;
  refresh_interval_seconds: number;
  totals: DashboardTotals;
  changes: DashboardChanges;
  recent_verifications: DashboardRecentVerification[];
  trending_topics: DashboardTrendingTopic[];
}

export interface HistoryVerificationItem {
  id: string;
  claim_text: string;
  verification_result: string;
  verdict: string;
  credibility_score: number;
  sources_count: number;
  created_at: string;
}

export interface HistoryVerificationsResponse {
  generated_at: string;
  refresh_interval_seconds: number;
  total: number;
  items: HistoryVerificationItem[];
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = (viteEnv?.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: string }).detail || "Unknown backend error")
        : `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return payload as T;
}

export function verifyClaim(text: string, language?: string): Promise<VerifyClaimResponse> {
  return requestJson<VerifyClaimResponse>("/verify-claim", {
    method: "POST",
    body: JSON.stringify({ text, language }),
  });
}

export function analyzeDomainSecurity(input: { url?: string; claim_text?: string }): Promise<DomainSecurityResponse> {
  return requestJson<DomainSecurityResponse>("/analysis/domain-security", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function analyzeRedditPropagation(input: {
  query: string;
  limit?: number;
  include_comments?: boolean;
  comments_per_post?: number;
  sort?: string;
  time_filter?: string;
}): Promise<RedditPropagationResponse> {
  return requestJson<RedditPropagationResponse>("/analysis/reddit-propagation", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function healthCheck(): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/health");
}

export function getTrendingNews(input?: {
  limit?: number;
  country?: string;
  category?: string;
  local_country?: string;
}): Promise<TrendingNewsResponse> {
  const params = new URLSearchParams();
  if (typeof input?.limit === "number") params.set("limit", String(input.limit));
  if (input?.country) params.set("country", input.country);
  if (input?.category) params.set("category", input.category);
  if (input?.local_country) params.set("local_country", input.local_country);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<TrendingNewsResponse>(`/analysis/trending-news${suffix}`);
}

export function getDashboardSummary(input?: { limit?: number }): Promise<DashboardSummaryResponse> {
  const params = new URLSearchParams();
  if (typeof input?.limit === "number") params.set("limit", String(input.limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<DashboardSummaryResponse>(`/dashboard/summary${suffix}`);
}

export function getHistoryVerifications(input?: { limit?: number }): Promise<HistoryVerificationsResponse> {
  const params = new URLSearchParams();
  if (typeof input?.limit === "number") params.set("limit", String(input.limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson<HistoryVerificationsResponse>(`/history/verifications${suffix}`);
}

export interface MonthlyCountResponse {
  month: string;
  count: number;
}

export function getMonthlyVerificationCount(): Promise<MonthlyCountResponse> {
  return requestJson<MonthlyCountResponse>("/dashboard/monthly-count");
}
