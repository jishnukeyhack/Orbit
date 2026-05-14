---
description: Animation System of Orbit
---

## 16. Animation System

### 16.1 Duration Scale

```
Instant   0ms    — boolean toggle, no transition
Fast      120ms  — hover glow, color shift
Normal    200ms  — panel open/close, card hover
Smooth    300ms  — page transitions, modal appear
Slow      500ms  — complex graph reveals, wizard steps
```

### 16.2 Easing Tokens

```
Enter:   cubic-bezier(0.0, 0.0, 0.2, 1.0)   — decelerate in
Exit:    cubic-bezier(0.4, 0.0, 1.0, 1.0)   — accelerate out
Spring:  cubic-bezier(0.34, 1.56, 0.64, 1)  — elastic overshoot
Linear:  linear                               — progress bars
```

### 16.3 Framer Motion Variants

```tsx
// Page transition
export const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0,0,0.2,1] } },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)',
    transition: { duration: 0.18 } },
};

// Card stagger reveal
export const cardContainer = {
  animate: { transition: { staggerChildren: 0.055 } },
};
export const cardItem = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.24, ease: [0,0,0.2,1] } },
};

// AI assistant panel spring
export const assistantPanel = {
  closed: { scale: 0, opacity: 0, originX: 1, originY: 1 },
  open:   { scale: 1, opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 28 } },
};
```

### 16.4 CSS Micro-interactions

```css
/* Button glow */
.btn-primary:hover {
  box-shadow: 0 0 32px rgba(79,140,255,0.45), 0 4px 16px rgba(0,0,0,0.3);
}

/* Card lift */
.agent-card { transition: transform 200ms ease, box-shadow 200ms ease; }
.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(79,140,255,0.25), 0 12px 40px rgba(0,0,0,0.35);
}

/* Running agent status dot */
.status-dot--running {
  animation: status-pulse 2.4s ease-in-out infinite;
}
@keyframes status-pulse {
  0%, 100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0);   }
}

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg, #1C2440 25%, #232E50 50%, #1C2440 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
@keyframes shimmer {
  0%   { background-position:  200% 0; }
  100% { background-position: -200% 0; }
}

/* Workflow edge animation */
.flow-edge--animated {
  stroke-dasharray: 6 4;
  animation: dash-flow 0.6s linear infinite;
}
@keyframes dash-flow {
  to { stroke-dashoffset: -10; }
}
```

---