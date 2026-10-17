const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, "");

export type Operation =
  | "sentiment" | "emotion" | "summary" | "excuse" | "language";

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

const REQUEST_TIMEOUT_MS = 15 * 60 * 1000; // Allow first-run Hugging Face model downloads and initialization.

async function postJson(path: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await readResponse(response);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("The request exceeded the 15-minute limit. Check your internet connection and backend logs; the first run may need to finish downloading its models before retrying.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach the ExcuseMoi API at ${API_URL}. Check the backend URL, network connection, and CORS configuration.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
