export async function POST(req) {
  try {
    const body = await req.json();
    const url = body?.url;

    // Basic validation
    if (!url || typeof url !== "string") {
      return Response.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return Response.json(
        { error: "URL must start with http:// or https://." },
        { status: 400 }
      );
    }

    // 🔹 For now, we do NOT actually fetch the website.
    // Instead we return a realistic-looking "demo" audit result.
    // This keeps things stable for sales/demo and avoids network errors.

    // Very simple "fake score" formula so it feels dynamic
    const baseScore = 72;
    const urlLengthPenalty = Math.min(url.length % 10, 8);
    const score = Math.max(55, baseScore - urlLengthPenalty);

    const issues = [
      {
        type: "missing_alt_text",
        message:
          "Some images appear to be missing descriptive alt text. Add short, meaningful descriptions for all non-decorative images.",
        severity: "medium",
      },
      {
        type: "heading_structure",
        message:
          "Headings may not follow a logical outline (H1 → H2 → H3). Ensure you use a single H1 and properly nested headings.",
        severity: "medium",
      },
      {
        type: "color_contrast",
        message:
          "Text and background colors may not meet WCAG contrast ratios. Avoid light gray text on white or very light backgrounds.",
        severity: "high",
      },
      {
        type: "keyboard_navigation",
        message:
          "Some interactive elements may not be reachable or operable via keyboard only. Check focus states and skip links.",
        severity: "high",
      },
      {
        type: "form_labels",
        message:
          "Form fields may be missing associated labels or instructions. Make sure every input has a clear, programmatic label.",
        severity: "medium",
      },
    ];

    return Response.json(
      {
        score,
        issues,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ADA audit API error:", err);
    return Response.json(
      { error: "Server error while running audit. Please try again." },
      { status: 500 }
    );
  }
}
