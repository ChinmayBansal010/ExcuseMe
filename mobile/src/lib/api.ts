const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, "");

export type Operation =
  | "stats" | "sentiment" | "emotion" | "entities" | "keywords"
  | "pos" | "summary" | "zero_shot" | "excuse" | "syntax" | "language";

export async function analyzeText(text: string, operations: Operation[], labels: string[] = []) {
  const response = await fetch(`${API_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operations, labels }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status})`);
  }
  return payload;
}

export async function compareTexts(text_a: string, text_b: string) {
  const response = await fetch(`${API_URL}/api/v1/similarity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text_a, text_b }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "Similarity request failed");
  return payload;
}

export async function searchCorpus(query: string, top_k = 5) {
  const response = await fetch(`${API_URL}/api/v1/search-corpus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "Corpus search failed");
  return payload;
}

export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  return response.ok;
}
