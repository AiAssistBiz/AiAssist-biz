export const FETCH_TIMEOUT_MS = 10_000;
export const SCAN_TIMEOUT_MS = 15_000;
export const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_REDIRECTS = 5;

export const SEVERITY_MAP = {
  critical: "high",
  serious: "high",
  moderate: "medium",
  minor: "low",
};

export const DEDUCTION = { high: 10, medium: 5, low: 2 };

export const ERROR_MESSAGES = {
  INVALID_JSON: "Invalid JSON body.",
  URL_REQUIRED: "URL is required.",
  INVALID_PROTOCOL: "URL must start with http:// or https://.",
  FETCH_TIMEOUT: "The page took too long to respond. Try again or check the URL.",
  HTTP_ERROR: "The page returned HTTP {status}. Check the URL and try again.",
  NOT_HTML: "URL does not appear to return an HTML page.",
  SCAN_TIMEOUT: "Accessibility scan timed out. The page may be too complex.",
  SCAN_FAILED: "Accessibility scan failed. The page structure may not be parseable.",
  CONTENT_TOO_LARGE: "Page content is too large to process.",
  SSRF_BLOCKED: "Access to this URL is not allowed.",
  NETWORK_ERROR: "Could not reach the page.",
};
