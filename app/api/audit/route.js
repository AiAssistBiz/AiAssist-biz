import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";

const FETCH_TIMEOUT_MS = 10_000;

const SEVERITY_MAP = {
  critical: "high",
  serious: "high",
  moderate: "medium",
  minor: "low",
};

const DEDUCTION = { high: 10, medium: 5, low: 2 };

export async function POST(req) {
  // --- 1. Parse & validate input ---
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = body?.url;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required." }, { status: 400 });
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return Response.json(
      { error: "URL must start with http:// or https://." },
      { status: 400 }
    );
  }

  // --- 2. Fetch the target page ---
  let html;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AiAssistBot/1.0; +https://aiassist.biz)",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return Response.json(
        {
          error: `The page returned HTTP ${res.status}. Check the URL and try again.`,
        },
        { status: 422 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return Response.json(
        { error: "URL does not appear to return an HTML page." },
        { status: 422 }
      );
    }

    html = await res.text();
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return Response.json(
        { error: "The page took too long to respond. Try again or check the URL." },
        { status: 422 }
      );
    }
    console.error("ADA audit fetch error:", err);
    return Response.json(
      { error: `Could not reach the page: ${err.message}` },
      { status: 422 }
    );
  }

  // --- 3. Build jsdom + inject axe-core + run scan ---
  let violations;
  try {
    const virtualConsole = new VirtualConsole(); // suppress jsdom console noise
    const dom = new JSDOM(html, {
      url,
      runScripts: "outside-only", // page scripts off; only our injected code runs
      virtualConsole,
    });

    // Inject axe-core source into the jsdom window
    const script = dom.window.document.createElement("script");
    script.textContent = axe.source;
    dom.window.document.head.appendChild(script);

    violations = await new Promise((resolve, reject) => {
      dom.window.axe.run(
        dom.window.document,
        { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] } },
        (err, results) => {
          if (err) reject(err);
          else resolve(results.violations);
        }
      );
    });
  } catch (err) {
    console.error("ADA audit axe error:", err);
    return Response.json(
      {
        error:
          "Accessibility scan failed. The page structure may not be parseable.",
      },
      { status: 500 }
    );
  }

  // --- 4. Shape response (same contract as before) ---
  const issues = violations.map((v) => ({
    type: v.id,
    message: v.description,
    severity: SEVERITY_MAP[v.impact] ?? "medium",
  }));

  const deduction = issues.reduce(
    (sum, i) => sum + (DEDUCTION[i.severity] ?? 5),
    0
  );
  const score = Math.max(0, 100 - deduction);

  return Response.json({ score, issues }, { status: 200 });
}
