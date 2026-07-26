import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return response.status(405).json({ error: "method_not_allowed" });
  const body = typeof request.body === "object" && request.body ? request.body : {};
  const reference = String(body.reference || request.headers["x-correlation-id"] || crypto.randomUUID()).slice(0, 64);
  console.error(JSON.stringify({
    level: "error",
    event: "dashboard_client_error",
    reference,
    release: String(body.release || "unknown").slice(0, 120),
    path: String(body.path || "unknown").slice(0, 300),
    name: String(body.name || "Error").slice(0, 120),
    message: String(body.message || "Unknown client error").slice(0, 500),
    timestamp: new Date().toISOString(),
  }));
  response.setHeader("cache-control", "no-store");
  return response.status(202).json({ accepted: true, reference });
}
