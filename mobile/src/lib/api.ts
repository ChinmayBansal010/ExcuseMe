const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, "");

export type Operation =
  | "stats" | "sentiment" | "emotion" | "entities" | "keywords"
  | "pos" | "summary" | "zero_shot" | "excuse" | "syntax" | "language";

async function readResponse(response: Response) {
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    payload = { detail: response.statusText || "The server returned an unreadable response." };
  }

  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item: any) => item.msg || String(item)).join("; ")
      : detail;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return payload;
}

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readResponse(response);
}

export async function analyzeText(text: string, operations: Operation[], labels: string[] = []) {
  return postJson("/api/v1/analyze", { text, operations, labels });
}

export async function compareTexts(text_a: string, text_b: string) {
  return postJson("/api/v1/compare", { text_a, text_b });
}

export async function searchCorpus(query: string, top_k = 5) {
  return postJson("/api/v1/search-corpus", { query, top_k });
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
