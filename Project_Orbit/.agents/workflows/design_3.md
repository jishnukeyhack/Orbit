---
description: Layer 0
---

  <!-- LAYER 0: Wave canvas -->
  <canvas id="waveCanvas"></canvas>

  <!-- LAYER 1: Dot grid -->
  <div class="dot-grid"></div>

  <!-- LAYER 2: Vignette -->
  <div class="vignette"></div>

  <!-- LAYER 4: Navbar -->
  <nav class="navbar">
    <a href="/" class="navbar-logo">
      <div class="navbar-logo-icon">A</div>
      AgentOS
    </a>
    <div class="navbar-links">
      <a href="#">Docs</a>
      <a href="#">Pricing</a>
      <a href="#">Marketplace</a>
      <a href="#">Blog</a>
    </div>
    <div class="navbar-cta">
      <a href="#" class="btn-ghost">Sign in</a>
      <a href="#" class="btn-primary">Get started free</a>
    </div>
  </nav>

  <!-- LAYER 3: Hero -->
  <section class="hero">
    <div class="hero-badge">
      <span class="hero-badge-dot"></span>
      Now in Public Beta — v2.0
    </div>

    <h1 class="hero-headline">
      The Infrastructure for<br>
      <span class="gradient-text">Autonomous AI Agents</span>
    </h1>

    <p class="hero-sub">
      Create, deploy, orchestrate, monitor, and monetize AI agents at
      enterprise scale. One platform. Infinite intelligence.
    </p>

    <div class="hero-command-bar">
      <input
        type="text"
        placeholder='Try: "Create a sales agent" or "Deploy a research swarm"'
      />
      <div class="cmd-chips">
        <button class="cmd-chip">Agent</button>
        <button class="cmd-chip">Swarm</button>
        <button class="cmd-chip">Workflow</button>
      </div>
      <button class="cmd-send" aria-label="Send">
        <svg viewBox="0 0 16 16"><path d="M1.5 8L14 1.5 10 8l4 6.5z"/></svg>
      </button>
    </div>

    <div class="hero-actions">
      <a href="#" class="btn-primary">Start building free</a>
      <a href="#" class="btn-ghost">View live demo →</a>
    </div>

    <div class="hero-stats">
      <div class="stat-item">
        <div class="stat-value">50K+</div>
        <div class="stat-label">Active agents</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">2.4B</div>
        <div class="stat-label">Tasks executed</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">99.97%</div>
        <div class="stat-label">Uptime SLA</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">180+</div>
        <div class="stat-label">Integrations</div>
      </div>
    </div>
  </section>

  <!-- Feature pills -->
  <div class="feature-strip">
    <div class="feature-pill"><span>⚡</span> Real-time orchestration</div>
    <div class="feature-pill"><span>🧠</span> Multi-model support</div>
    <div class="feature-pill"><span>🔗</span> 180+ integrations</div>
    <div class="feature-pill"><span>📊</span> Full observability</div>
    <div class="feature-pill"><span>🛡️</span> Enterprise SSO & RBAC</div>
    <div class="feature-pill"><span>🏪</span> Agent marketplace</div>
    <div class="feature-pill"><span>🔑</span> Usage-based billing</div>
    <div class="feature-pill"><span>>_</span> Built-in CLI terminal</div>
  </div>

  <!-- Wave script -->
  <script>
    const canvas = document.getElementById('waveCanvas');
    const ctx    = canvas.getContext('2d');
    let W, H, t  = 0;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Four waves: purple, blue, violet accent, cyan accent
    const waves = [
      {
        color: [120, 40, 220], alpha: 0.55, width: 340,
        cp: { x0f:0.0, y0f:0.72, cx1f:0.25, cy1f:0.55,
              cx2f:0.55, cy2f:0.78, x1f:0.55, y1f:0.62 },
        speed: 0.00045,
        amp: { cx1:0.06, cy1:0.08, cx2:0.05, cy2:0.06 },
      },
      {
        color: [50, 90, 240], alpha: 0.50, width: 280,
        cp: { x0f:0.55, y0f:0.60, cx1f:0.68, cy1f:0.50,
              cx2f:0.82, cy2f:0.70, x1f:1.05, y1f:0.58 },
        speed: 0.00038,
        amp: { cx1:0.04, cy1:0.07, cx2:0.06, cy2:0.05 },
      },
      {
        color: [160, 60, 255], alpha: 0.28, width: 200,
        cp: { x0f:0.1, y0f:0.45, cx1f:0.3, cy1f:0.38,
              cx2f:0.65, cy2f:0.52, x1f:0.85, y1f:0.42 },
        speed: 0.00055,
        amp: { cx1:0.05, cy1:0.06, cx2:0.04, cy2:0.07 },
      },
      {
        color: [0, 180, 255], alpha: 0.18, width: 160,
        cp: { x0f:0.2, y0f:0.85, cx1f:0.45, cy1f:0.80,
              cx2f:0.70, cy2f:0.90, x1f:1.0, y1f:0.82 },
        speed: 0.00032,
        amp: { cx1:0.07, cy1:0.04, cx2:0.05, cy2:0.06 },
      },
    ];

    function drawWave(wave) {
      const { cp, speed, amp, color, alpha, width } = wave;
      const s = t * speed;

      const cx1 = (cp.cx1f + Math.sin(s * 1.3 + 0.5) * amp.cx1) * W;
      const cy1 = (cp.cy1f + Math.cos(s * 1.1 + 1.2) * amp.cy1) * H;
      const cx2 = (cp.cx2f + Math.sin(s * 0.9 + 2.4) * amp.cx2) * W;
      const cy2 = (cp.cy2f + Math.cos(s * 1.4 + 0.8) * amp.cy2) * H;
      const x0  = cp.x0f * W;
      const y0  = (cp.y0f + Math.sin(s * 0.7) * 0.03) * H;
      const x1  = cp.x1f * W;
      const y1  = (cp.y1f + Math.cos(s * 0.6 + 1.0) * 0.03) * H;

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0,   `rgba(${color},0)`);
      grad.addColorStop(0.2, `rgba(${color},${alpha})`);
      grad.addColorStop(0.8, `rgba(${color},${alpha})`);
      grad.addColorStop(1,   `rgba(${color},0)`);

      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.38)}px)`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = width;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();
    }

    function loop() {
      if (t === 0) {
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, W, H);
      }
      // Partial clear — produces motion trail
      ctx.fillStyle = 'rgba(11, 15, 25, 0.22)';
      ctx.fillRect(0, 0, W, H);
      for (const w of waves) drawWave(w);
      t++;
      requestAnimationFrame(loop);
    }

    loop();
  </script>
</body>
</html>
```

---
## 3. Application Shell — Layout Architecture

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAVBAR (60px fixed) — search · workspace · profile │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ SIDEBAR  │           MAIN WORKSPACE                    │
│  240px   │           (flex-1, overflow-y: auto)        │
│ (fixed)  │                                             │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  STATUS BAR (32px) — system health · tokens · latency   │
└─────────────────────────────────────────────────────────┘
                                         ┌────────────────┐
                                         │  AI ASSISTANT  │
                                         │  (floating)    │
                                         └────────────────┘
```

### 3.1 Responsive Breakpoints

```
Mobile   < 768px    Sidebar = slide-over drawer (overlay)
Tablet   768–1024px Sidebar = icon-only rail (64px)
Desktop  > 1024px   Sidebar = full expanded (240px)
Wide     > 1440px   Optional right detail panel
```

### 3.2 Shell — React/TSX

```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0B0F19] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {children}
        </main>
        <StatusBar />
      </div>
      <AIAssistantPanel />   {/* floating, bottom-right */}
      <CommandPalette />     {/* global ⌘K modal */}
      <NotificationSystem /> {/* toast stack, top-right */}
    </div>
  );
}
```

---