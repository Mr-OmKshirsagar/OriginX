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

export function verifyClaim(text: string): Promise<VerifyClaimResponse> {
  return requestJson<VerifyClaimResponse>("/verify-claim", {
    method: "POST",
    body: JSON.stringify({ text }),
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
