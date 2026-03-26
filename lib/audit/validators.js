import { MAX_CONTENT_SIZE, MAX_REDIRECTS, ERROR_MESSAGES } from "./constants.js";

// Private IP ranges that should be blocked
const PRIVATE_IP_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
];

function isPrivateIP(ip) {
  for (const range of PRIVATE_IP_RANGES) {
    if (ip >= range.start && ip <= range.end) {
      return true;
    }
  }
  return false;
}

function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function normalizeUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  
  // If already has protocol, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // Add https:// for bare domains and www. prefixes
  return `https://${trimmed}`;
}

export function validateUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: ERROR_MESSAGES.URL_REQUIRED };
  }

  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return { valid: false, error: ERROR_MESSAGES.URL_REQUIRED };
  }

  const hostname = extractHostname(normalizedUrl);
  if (!hostname) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_PROTOCOL };
  }

  // Basic SSRF protection - block localhost and private IPs
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return { valid: false, error: ERROR_MESSAGES.SSRF_BLOCKED };
  }

  if (hostname.startsWith("127.") || hostname.startsWith("192.168.") || 
      hostname.startsWith("10.") || hostname.startsWith("172.")) {
    return { valid: false, error: ERROR_MESSAGES.SSRF_BLOCKED };
  }

  return { valid: true, normalizedUrl };
}

export function validateResponse(response, contentLength) {
  if (!response.ok) {
    return { valid: false, error: ERROR_MESSAGES.HTTP_ERROR.replace("{status}", response.status) };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return { valid: false, error: ERROR_MESSAGES.NOT_HTML };
  }

  if (contentLength > MAX_CONTENT_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.CONTENT_TOO_LARGE };
  }

  return { valid: true };
}

export function createSafeFetchOptions() {
  return {
    signal: AbortSignal.timeout(10_000),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AiAssistBot/1.0; +https://aiassist.biz)",
    },
    redirect: "follow",
  };
}
