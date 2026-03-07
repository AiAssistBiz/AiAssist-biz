# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint via next lint
```

No test suite is configured.

## Architecture

This is a **Next.js 14 App Router** single-page marketing site for aiassist.biz, styled with **Tailwind CSS** and animated with **Framer Motion**.

### Key files

- `app/page.jsx` — The entire frontend: all sections (Hero, Services, Pricing, Tools, Results, How It Works, Contact/Footer) live in this one file as a `"use client"` component. Three interactive tool components are defined here:
  - `AdaAuditTool` — Posts to `/api/audit`, renders score + issues, then offers a lead capture email form (email submit is currently a `console.log` stub, not wired to any backend).
  - `ReceptionistDemo` — Fully client-side keyword-match chatbot; no real AI.
  - `KnowledgebaseDemo` — Fully client-side keyword-match Q&A over a hardcoded `DEMO_DOCS` array.
- `app/api/audit/route.js` — Next.js Route Handler (`POST /api/audit`). Fetches the target URL (10 s timeout), loads HTML into a `jsdom` window with `runScripts: "outside-only"`, injects `axe.source`, and runs a real axe-core scan (WCAG 2.0 A/AA + best-practice rules). Score = `max(0, 100 − Σ deductions)` where critical/serious = −10, moderate = −5, minor = −2. Response shape: `{ score: number, issues: { type, message, severity }[] }`.
- `app/layout.jsx` — Minimal root layout with metadata.
- `app/globals.css` — Global styles entry point for Tailwind.

### Planned but not yet implemented

- `POST /api/lead` — Lead capture endpoint (referenced in a comment in `AdaAuditTool`).
- Contact form submission — currently `alert()`s a placeholder message.
- Zapier/Make/CRM integration for lead capture.

### Styling conventions

- Tailwind utility classes only; no CSS modules.
- Color palette: `slate-*` for neutrals, `emerald-*` for primary/accent.
- Rounded cards use `rounded-2xl border border-slate-200 shadow-sm bg-white`.
- Layout helpers (`Section`, `Container`, `Badge`) are defined at the top of `app/page.jsx`.
