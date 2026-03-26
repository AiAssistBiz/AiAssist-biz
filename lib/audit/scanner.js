import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";
import { SCAN_TIMEOUT_MS, ERROR_MESSAGES } from "./constants.js";

export async function runAccessibilityScan(html, url) {
  let dom = null;
  
  try {
    console.log("[DEBUG] Starting scan for URL:", url);
    console.log("[DEBUG] HTML length:", html.length);
    
    const virtualConsole = new VirtualConsole();
    dom = new JSDOM(html, {
      url,
      runScripts: "outside-only",
      virtualConsole,
    });

    console.log("[DEBUG] JSDOM created successfully");

    const script = dom.window.document.createElement("script");
    script.textContent = axe.source;
    dom.window.document.head.appendChild(script);

    console.log("[DEBUG] Axe script injected");
    console.log("[DEBUG] dom.window.axe exists:", !!dom.window.axe);
    console.log("[DEBUG] typeof dom.window.axe:", typeof dom.window.axe);
    console.log("[DEBUG] dom.window.axe.run exists:", !!(dom.window.axe && dom.window.axe.run));

    // Wait a moment for axe to be fully available
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log("[DEBUG] After 10ms wait, dom.window.axe exists:", !!dom.window.axe);
    console.log("[DEBUG] After 10ms wait, dom.window.axe.run exists:", !!(dom.window.axe && dom.window.axe.run));

    let timeoutFired = false;
    const violations = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          console.log("[DEBUG] About to call axe.run");
          dom.window.axe.run(
            dom.window.document,
            { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] } },
            (err, results) => {
              console.log("[DEBUG] axe.run callback executed");
              console.log("[DEBUG] err:", err);
              console.log("[DEBUG] results:", results ? "present" : "null/undefined");
              if (err) {
                console.log("[DEBUG] Rejecting with error:", err);
                reject(err);
              } else {
                console.log("[DEBUG] Resolving with violations count:", results?.violations?.length || 0);
                resolve(results.violations);
              }
            }
          );
        } catch (axeError) {
          console.log("[DEBUG] Synchronous axe.run error:", axeError);
          reject(axeError);
        }
      }),
      new Promise((_, reject) => {
        const timeout = setTimeout(() => {
          console.log("[DEBUG] Scan timeout fired!");
          timeoutFired = true;
          reject(new Error("Scan timeout"));
        }, SCAN_TIMEOUT_MS);
        return timeout;
      }),
    ]);

    console.log("[DEBUG] Scan completed successfully, violations:", violations.length);
    return violations;
  } catch (err) {
    console.log("[DEBUG] Scan failed with error:", err);
    console.log("[DEBUG] Error stack:", err.stack);
    throw err;
  } finally {
    if (dom) {
      try {
        dom.window.close();
      } catch (cleanupError) {
        console.error("DOM cleanup error:", cleanupError);
      }
    }
  }
}

export function formatScanResults(violations) {
  const issues = violations.map((v) => ({
    type: v.id,
    message: v.description,
    severity: v.impact === "critical" || v.impact === "serious" ? "high" :
             v.impact === "moderate" ? "medium" : "low",
  }));

  const deduction = issues.reduce((sum, i) => {
    return sum + (i.severity === "high" ? 10 : i.severity === "medium" ? 5 : 2);
  }, 0);
  
  const score = Math.max(0, 100 - deduction);

  return { score, issues };
}
