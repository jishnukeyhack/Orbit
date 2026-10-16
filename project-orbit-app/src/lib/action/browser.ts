// ============================================
// Orbit — Agent Action Layer: browser session (Playwright adapter)
// Gives Orbit agents REAL web-page interaction: open, read, click,
// fill, press, screenshot — the Muse / browser-agent pattern.
//
// Design rules (learned from how browser agents actually fail):
//  1. High-level actions only. The model says "click the text 'Log in'"
//     or "fill the field labelled 'Email'" — never raw x/y coordinates
//     as the primary interface. Coordinates are what popups break.
//  2. Perception = structure first: snapshot returns visible text PLUS
//     a list of interactive elements (tag, role, text, href) extracted
//     from the DOM. Screenshots are for humans / vision fallback.
//  3. One session per runId. Cookies/state live in the browser, never
//     in the model context. Sessions are closed explicitly.
//  4. Navigation is SSRF-guarded with the same policy as web_fetch.
//
// Requires:  npm install playwright  &&  npx playwright install chromium
// (This module is optional — the rest of the action layer has no
// Playwright dependency. Only import it if you install Playwright.)
// ============================================

/** Minimal structural interface over a page. Playwright's Page is
 *  adapted to this; tests can fake it without a real browser. */
export interface InteractiveElement {
  index: number;
  tag: string;
  role?: string;
  text: string;
  href?: string;
  inputType?: string;
  name?: string;
}

export interface PageLike {
  currentUrl(): string;
  goto(url: string): Promise<void>;
  title(): Promise<string>;
  visibleText(maxChars: number): Promise<string>;
  interactiveElements(limit: number): Promise<InteractiveElement[]>;
  clickText(text: string): Promise<void>;
  clickSelector(selector: string): Promise<void>;
  fillField(args: { label?: string; placeholder?: string; selector?: string; value: string }): Promise<string>;
  press(key: string): Promise<void>;
  screenshot(fullPath: string): Promise<void>;
  close(): Promise<void>;
}

// ---------- Playwright adapter (types are type-only imports; the
// ---------- runtime load is dynamic so importing this file is cheap)

import type { Browser, Page } from 'playwright';

class PlaywrightPage implements PageLike {
  constructor(private page: Page) {}

  currentUrl(): string {
    return this.page.url();
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  }

  title(): Promise<string> {
    return this.page.title();
  }

  async visibleText(maxChars: number): Promise<string> {
    const text = await this.page.locator('body').innerText().catch(() => '');
    return text.slice(0, maxChars);
  }

  async interactiveElements(limit: number): Promise<InteractiveElement[]> {
    // Runs in the page: collect visible, interactive elements in DOM order.
    return this.page.evaluate((lim: number) => {
      const els = Array.from(
        document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]'),
      );
      const out: Array<Record<string, unknown>> = [];
      for (const el of els) {
        if (out.length >= lim) break;
        const rect = (el as HTMLElement).getBoundingClientRect();
        const style = window.getComputedStyle(el as HTMLElement);
        if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
        const input = el as HTMLInputElement;
        out.push({
          index: out.length,
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') ?? undefined,
          text: ((el as HTMLElement).innerText || input.value || el.getAttribute('aria-label') || '').trim().slice(0, 120),
          href: (el as HTMLAnchorElement).href || undefined,
          inputType: el.tagName === 'INPUT' ? input.type : undefined,
          name: input.name || el.getAttribute('aria-label') || el.getAttribute('placeholder') || undefined,
        });
      }
      return out;
    }, limit) as unknown as Promise<InteractiveElement[]>;
  }

  async clickText(text: string): Promise<void> {
    // getByText / getByRole survive layout changes far better than coordinates.
    const byRole = this.page.getByRole('button', { name: text }).first();
    if (await byRole.count().catch(() => 0)) {
      await byRole.click({ timeout: 5_000 });
      return;
    }
    await this.page.getByText(text, { exact: false }).first().click({ timeout: 5_000 });
  }

  async clickSelector(selector: string): Promise<void> {
    await this.page.locator(selector).first().click({ timeout: 5_000 });
  }

  async fillField(args: { label?: string; placeholder?: string; selector?: string; value: string }): Promise<string> {
    if (args.label) {
      await this.page.getByLabel(args.label).fill(args.value);
      return `label:${args.label}`;
    }
    if (args.placeholder) {
      await this.page.getByPlaceholder(args.placeholder).fill(args.value);
      return `placeholder:${args.placeholder}`;
    }
    if (args.selector) {
      await this.page.locator(args.selector).first().fill(args.value);
      return `selector:${args.selector}`;
    }
    throw new Error('fillField needs one of: label, placeholder, selector');
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async screenshot(fullPath: string): Promise<void> {
    await this.page.screenshot({ path: fullPath, fullPage: false });
  }

  async close(): Promise<void> {
    await this.page.close().catch(() => undefined);
  }
}

/** Chromium does not inherit http(s)_proxy env vars automatically.
 *  If the deployment sits behind an egress proxy, pass it through —
 *  parsed into Playwright's {server, username, password} shape.
 *  Never log the returned object: it can contain proxy credentials. */
export function proxyFromEnv(
  raw: string | undefined,
  bypass?: string,
): { server: string; username?: string; password?: string; bypass?: string } | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    return {
      server: `${u.protocol}//${u.host}`,
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      // Chromium routes EVERYTHING through the proxy unless told otherwise —
      // localhost must bypass it, or even local dev pages fail to load.
      bypass: bypass ?? process.env.NO_PROXY ?? process.env.no_proxy ?? 'localhost,127.0.0.1',
    };
  } catch {
    return undefined;
  }
}

/** One Chromium + one page per runId, launched lazily on first use. */
export class BrowserSessionManager {
  private sessions = new Map<string, Promise<{ browser: Browser; page: PageLike }>>();

  constructor(private opts: { headless?: boolean; proxy?: string } = {}) {}

  private async launch(): Promise<{ browser: Browser; page: PageLike }> {
    const { chromium } = await import('playwright');
    const proxy = proxyFromEnv(this.opts.proxy ?? process.env.HTTPS_PROXY ?? process.env.https_proxy);
    const browser = await chromium.launch({
      headless: this.opts.headless ?? true,
      ...(proxy ? { proxy } : {}),
    });
    const page = await browser.newPage();
    return { browser, page: new PlaywrightPage(page) };
  }

  async pageFor(runId: string): Promise<PageLike> {
    if (!this.sessions.has(runId)) {
      this.sessions.set(runId, this.launch());
    }
    return (await this.sessions.get(runId)!).page;
  }

  async close(runId: string): Promise<void> {
    const session = this.sessions.get(runId);
    if (!session) return;
    this.sessions.delete(runId);
    const { browser, page } = await session.catch(() => ({ browser: null, page: null }));
    await page?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }

  async closeAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((id) => this.close(id)));
  }
}
