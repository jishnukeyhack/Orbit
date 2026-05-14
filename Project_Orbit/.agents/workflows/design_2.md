---
description: Navbar
---

    /* ── Navbar ── */
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 10;
      height: 60px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px;
      background: rgba(11, 15, 25, 0.72);
      backdrop-filter: blur(14px) saturate(140%);
      border-bottom: 1px solid var(--border);
    }
    .navbar-logo {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em;
      color: var(--text-primary); text-decoration: none;
    }
    .navbar-logo-icon {
      width: 28px; height: 28px; border-radius: 7px;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #fff;
    }
    .navbar-links {
      display: flex; align-items: center; gap: 6px;
    }
    .navbar-links a {
      padding: 6px 14px; border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.875rem; font-weight: 500; text-decoration: none;
      transition: color 0.18s, background 0.18s;
    }
    .navbar-links a:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,0.06);
    }
    .navbar-cta { display: flex; align-items: center; gap: 10px; }
    .btn-ghost {
      padding: 7px 18px; border-radius: 8px;
      font-size: 0.875rem; font-weight: 500;
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid var(--border);
      cursor: pointer; text-decoration: none;
      transition: border-color 0.18s, color 0.18s;
    }
    .btn-ghost:hover {
      color: var(--text-primary);
      border-color: rgba(255,255,255,0.22);
    }
    .btn-primary {
      padding: 7px 20px; border-radius: 8px;
      font-size: 0.875rem; font-weight: 600; color: #fff;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      border: none; cursor: pointer; text-decoration: none;
      box-shadow: 0 0 20px rgba(79,140,255,0.30);
      transition: opacity 0.18s, box-shadow 0.18s;
    }
    .btn-primary:hover {
      opacity: 0.88;
      box-shadow: 0 0 32px rgba(79,140,255,0.45);
    }

    /* ── Hero ── */
    .hero {
      position: relative; z-index: 5;
      min-height: 100vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      padding: 80px 24px 60px;
      gap: 28px;
    }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 5px 14px 5px 8px; border-radius: 100px;
      background: rgba(79, 140, 255, 0.10);
      border: 1px solid rgba(79, 140, 255, 0.24);
      font-size: 0.72rem; font-weight: 600;
      color: var(--accent-blue);
      letter-spacing: 0.06em; text-transform: uppercase;
    }
    .hero-badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent-cyan);
      box-shadow: 0 0 8px var(--accent-cyan);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.45; transform: scale(0.7); }
    }

    .hero-headline {
      font-size: clamp(2.8rem, 7.5vw, 5.25rem);
      font-weight: 700; line-height: 1.08;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      max-width: 860px;
    }
    .hero-headline .gradient-text {
      background: linear-gradient(
        90deg,
        var(--accent-blue) 0%,
        var(--accent-cyan) 40%,
        var(--accent-purple) 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-size: clamp(1rem, 2.2vw, 1.2rem); font-weight: 400;
      color: var(--text-secondary);
      max-width: 560px; line-height: 1.65;
    }

    /* AI Command bar */
    .hero-command-bar {
      display: flex; align-items: center;
      width: 100%; max-width: 640px;
      background: rgba(21, 27, 46, 0.80);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 4px 4px 4px 18px;
      gap: 10px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,140,255,0.06);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .hero-command-bar:focus-within {
      border-color: rgba(79,140,255,0.35);
      box-shadow: 0 4px 32px rgba(0,0,0,0.4), 0 0 24px rgba(79,140,255,0.16);
    }
    .hero-command-bar input {
      flex: 1; background: transparent; border: none; outline: none;
      font-size: 0.9375rem; font-family: inherit;
      color: var(--text-primary);
      caret-color: var(--accent-blue);
    }
    .hero-command-bar input::placeholder { color: var(--text-muted); }
    .cmd-chips { display: flex; gap: 6px; flex-shrink: 0; }
    .cmd-chip {
      padding: 6px 12px; border-radius: 8px;
      font-size: 0.78rem; font-weight: 500;
      background: rgba(79,140,255,0.12);
      color: var(--accent-blue);
      border: 1px solid rgba(79,140,255,0.22);
      cursor: pointer;
      transition: background 0.16s;
    }
    .cmd-chip:hover { background: rgba(79,140,255,0.22); }
    .cmd-send {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.16s;
    }
    .cmd-send:hover { opacity: 0.82; }
    .cmd-send svg { width: 15px; height: 15px; fill: #fff; }

    .hero-actions {
      display: flex; align-items: center; gap: 12px;
      flex-wrap: wrap; justify-content: center;
    }
    .hero-actions .btn-primary {
      padding: 11px 28px; font-size: 0.9375rem; border-radius: 10px;
    }
    .hero-actions .btn-ghost {
      padding: 11px 24px; font-size: 0.9375rem; border-radius: 10px;
    }

    /* Stats strip */
    .hero-stats {
      display: flex; align-items: center; gap: 40px;
      flex-wrap: wrap; justify-content: center;
    }
    .stat-item { text-align: center; }
    .stat-value {
      font-size: 1.5rem; font-weight: 700;
      color: var(--text-primary); letter-spacing: -0.02em;
    }
    .stat-label {
      font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;
    }
    .stat-divider {
      width: 1px; height: 36px; background: var(--border);
    }

    /* Feature pills */
    .feature-strip {
      position: relative; z-index: 5;
      display: flex; justify-content: center; gap: 10px;
      flex-wrap: wrap; padding: 0 24px 80px;
    }
    .feature-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 18px; border-radius: 100px;
      background: rgba(21, 27, 46, 0.70);
      border: 1px solid var(--border);
      font-size: 0.8125rem; font-weight: 500;
      color: var(--text-secondary);
      backdrop-filter: blur(8px);
      transition: border-color 0.18s, color 0.18s;
    }
    .feature-pill:hover {
      border-color: rgba(79,140,255,0.30);
      color: var(--text-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .navbar-links { display: none; }
      .stat-divider { display: none; }
      .hero-stats { gap: 24px; }
      .hero-command-bar .cmd-chips { display: none; }
    }
  </style>
</head>
<body>