import { validateUrl, validateResponse, createSafeFetchOptions } from "../../../lib/audit/validators.js";
import { runAccessibilityScan, formatScanResults } from "../../../lib/audit/scanner.js";
import { ERROR_MESSAGES, MAX_CONTENT_SIZE } from "../../../lib/audit/constants.js";

export async function POST(req) {
  // --- 1. Parse & validate input ---
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 });
  }

  const url = body?.url;
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    return Response.json({ error: urlValidation.error }, { status: 400 });
  }

  // Use normalized URL for fetch and scan
  const normalizedUrl = urlValidation.normalizedUrl || url;

  // --- 2. Fetch the target page ---
  let html;
  try {
    const fetchOptions = createSafeFetchOptions();
    const res = await fetch(normalizedUrl, fetchOptions);

    const contentLength = parseInt(res.headers.get("content-length") || "0");
    const responseValidation = validateResponse(res, contentLength);
    if (!responseValidation.valid) {
      return Response.json({ error: responseValidation.error }, { status: 422 });
    }

    html = await res.text();
    
    // Double-check content size after fetch
    if (html.length > MAX_CONTENT_SIZE) {
      return Response.json({ error: ERROR_MESSAGES.CONTENT_TOO_LARGE }, { status: 422 });
    }
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return Response.json({ error: ERROR_MESSAGES.FETCH_TIMEOUT }, { status: 422 });
    }
    console.error("ADA audit fetch error:", err);
    return Response.json({ error: ERROR_MESSAGES.NETWORK_ERROR }, { status: 422 });
  }

  // --- 3. Build jsdom + inject axe-core + run scan ---
  let violations;
  try {
    console.log("[DEBUG] About to call runAccessibilityScan");
    violations = await runAccessibilityScan(html, normalizedUrl);
    console.log("[DEBUG] runAccessibilityScan returned successfully");
  } catch (err) {
    console.log("[DEBUG] Route caught scan error:", err);
    console.log("[DEBUG] Error message:", err.message);
    console.log("[DEBUG] Error name:", err.name);
    console.log("[DEBUG] Error stack:", err.stack);
    const errorMessage = err.message === "Scan timeout" ? ERROR_MESSAGES.SCAN_TIMEOUT : ERROR_MESSAGES.SCAN_FAILED;
    console.log("[DEBUG] Returning error to client:", errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }

  // --- 4. Shape response ---
  return Response.json(formatScanResults(violations), { status: 200 });
}
