---
description: Orbit — Orchestrating Autonomous Intelligence Into Action
---

# AgentOS — Complete UI/UX Design Document

> A next-generation autonomous AI Agent Infrastructure Platform.  
> Design philosophy: *"A fusion of Google Stitch, OpenAI, Vercel, Linear, and Stripe — built specifically for autonomous AI agents."*

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Landing Page — Stitch-Style Animated Background](#2-landing-page--stitch-style-animated-background)
3. [Application Shell — Layout Architecture](#3-application-shell--layout-architecture)
4. [Sidebar Navigation](#4-sidebar-navigation)
5. [Top Command Bar](#5-top-command-bar)
6. [Dashboard Page](#6-dashboard-page)
7. [Agents Page](#7-agents-page)
8. [Swarms Page](#8-swarms-page)
9. [Workflow Builder](#9-workflow-builder)
10. [Terminal Page](#10-terminal-page)
11. [Marketplace Page](#11-marketplace-page)
12. [Integrations Page](#12-integrations-page)
13. [Logs & Observability](#13-logs--observability)
14. [Billing Page](#14-billing-page)
15. [Floating AI Assistant Panel](#15-floating-ai-assistant-panel)
16. [Animation System](#16-animation-system)
17. [Component Library](#17-component-library)
18. [Tech Stack & Architecture](#18-tech-stack--architecture)

---

## 1. Design System

### 1.1 Color Palette

```css
:root {
  /* Backgrounds */
  --bg-base:        #0B0F19;   /* Page/body background */
  --bg-surface:     #111827;   /* Panels, sidebars */
  --bg-card:        #151B2E;   /* Cards, modals */
  --bg-elevated:    #1C2440;   /* Hover states, dropdowns */

  /* Borders */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong:  rgba(255, 255, 255, 0.18);

  /* Accent Colors */
  --accent-blue:    #4F8CFF;
  --accent-cyan:    #00D4FF;
  --accent-purple:  #7B61FF;
  --accent-glow-b:  rgba(79, 140, 255, 0.18);
  --accent-glow-p:  rgba(123, 97, 255, 0.18);

  /* Typography */
  --text-primary:   #F9FAFB;
  --text-secondary: #94A3B8;
  --text-muted:     #4B5563;
  --text-link:      #4F8CFF;

  /* Status */
  --status-success: #22C55E;
  --status-warning: #F59E0B;
  --status-error:   #EF4444;
  --status-info:    #00D4FF;

  /* Glass */
  --glass-bg:       rgba(21, 27, 46, 0.72);
  --glass-blur:     12px;

  /* Radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;

  /* Shadows */
  --shadow-card:         0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.28);
  --shadow-glow-blue:    0 0 24px rgba(79,140,255,0.22);
  --shadow-glow-purple:  0 0 24px rgba(123,97,255,0.22);
}
```

### 1.2 Typography Scale

```css
/* Font stack — Geist > Inter > system */
--font-display: 'Geist', 'Google Sans', 'Inter', system-ui, sans-serif;
--font-mono:    'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   0.72rem;     /* 11.5px — labels, badges */
--text-sm:   0.8125rem;   /* 13px   — secondary copy */
--text-base: 0.9375rem;   /* 15px   — body */
--text-lg:   1.125rem;    /* 18px   — subheadings */
--text-xl:   1.375rem;    /* 22px   — section titles */
--text-2xl:  1.75rem;     /* 28px   — page headings */
--text-3xl:  2.25rem;     /* 36px   — hero headings */
--text-4xl:  3rem;        /* 48px   — landing hero */
--text-5xl:  4rem;        /* 64px   — landing hero large */

/* Weight */
--weight-normal:   400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

/* Letter spacing */
--tracking-tight: -0.025em;
--tracking-snug:  -0.015em;
--tracking-wide:   0.06em;   /* all-caps labels */
```

### 1.3 Spacing System

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96 / 128 px
```

Tailwind mapping: `p-1` through `p-32` — use multiples of 4 exclusively.

### 1.4 Glassmorphism Recipe

```css
.glass-panel {
  background:               var(--glass-bg);
  backdrop-filter:          blur(var(--glass-blur)) saturate(140%);
  -webkit-backdrop-filter:  blur(var(--glass-blur)) saturate(140%);
  border:                   1px solid var(--border-default);
  border-radius:            var(--radius-lg);
}

/* Gradient border variant */
.glass-panel--gradient-border {
  position: relative;
}
.glass-panel--gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg,
    rgba(79,140,255,0.4),
    rgba(123,97,255,0.2),
    transparent
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

---

## 2. Landing Page — Stitch-Style Animated Background

The public-facing landing page uses the same visual language as Google Stitch:
an aurora-wave canvas animation over a near-black base with a CSS dot-grid overlay.

### 2.1 Layer Stack

| z-index | Layer | Purpose |
|---------|-------|---------|
| 0 | `<canvas id="waveCanvas">` | Four animated bezier ribbon waves — purple, blue, violet, cyan |
| 1 | `.dot-grid` | CSS `radial-gradient` dot pattern, 22 px grid, 10% white opacity |
| 2 | `.vignette` | Radial gradient darkens corners, focuses hero content |
| 3 | `.hero-content` | Headline, subline, AI command bar, stats, CTA |
| 4 | `.navbar` | Sticky top nav with blur backdrop |

### 2.2 Wave Animation — How It Works

Each aurora ribbon is a **cubic bezier path** rendered with:

- **Thick `lineWidth`** (160–340 px) — gives ribbon body and weight
- **Canvas `filter: blur()`** — creates soft, luminous glow edges
- **`linearGradient` stroke** — fades to transparent at both caps, hiding hard line ends
- **Lissajous oscillation** — each bezier control point uses `sin`/`cos` at unique frequencies, producing organic non-repeating motion
- **Partial clear per frame** — `rgba(11,15,25, 0.22)` fill instead of a hard clear leaves a subtle motion trail

### 2.3 Complete Landing Page — `landing.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgentOS — Autonomous AI Agent Infrastructure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg:             #0B0F19;
      --border:         rgba(255, 255, 255, 0.08);
      --accent-blue:    #4F8CFF;
      --accent-cyan:    #00D4FF;
      --accent-purple:  #7B61FF;
      --text-primary:   #F9FAFB;
      --text-secondary: #94A3B8;
      --text-muted:     #4B5563;
      --dot-color:      rgba(255, 255, 255, 0.10);
      --dot-gap:        22px;
    }

    html, body {
      width: 100%; min-height: 100vh;
      background: var(--bg);
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text-primary);
      overflow-x: hidden;
    }

    /* ── Canvas ── */
    #waveCanvas {
      position: fixed; inset: 0; z-index: 0;
    }

    /* ── Dot grid ── */
    .dot-grid {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background-image: radial-gradient(circle, var(--dot-color) 1px, transparent 1px);
      background-size: var(--dot-gap) var(--dot-gap);
    }

    /* ── Vignette ── */
    .vignette {
      position: fixed; inset: 0; z-index: 2; pointer-events: none;
      background: radial-gradient(
        ellipse 80% 65% at 50% 50%,
        transparent 35%,
        rgba(11, 15, 25, 0.70) 100%
      );
    }