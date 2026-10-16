// ============================================
// Orbit — Agent Action Layer: browser tools
// Registers web-page interaction as ordinary action-layer tools, so
// they get the same validation, policy, approval, timeout and audit
// treatment as file/bash tools.
//
// Risk model:
//   browser_open / browser_snapshot / browser_screenshot / browser_close -> read
//   browser_click / browser_fill / browser_press                          -> execute
// 'execute' means: in balanced & strict policy modes the user approves
// interactions before they happen, while reading pages stays free.
// Submitting forms / purchases: a click is a click to the browser —
// gate those runs with allowedTools and approvals, and never let a
// click-tool call carry payment details (see INTEGRATION.md).
// ============================================
import path from 'path';
import { defineTool, ToolRegistry } from './registry';
import { isPublicHttpUrl, sandboxPath } from './policy';
import type { BrowserSessionManager } from './browser';

export function registerBrowserTools(
  registry: ToolRegistry,
  sessions: BrowserSessionManager,
): ToolRegistry {
  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_open',
      description: 'Open a public web page in this run\'s browser and return its title and URL. Use browser_snapshot next to see the page.',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Public http(s) URL' } },
        required: ['url'],
      },
      risk: 'read',
      timeoutMs: 40_000,
      handler: async (args, ctx) => {
        const url = String(args.url ?? '');
        if (!isPublicHttpUrl(url)) throw new Error(`Refused: not a public http(s) URL: ${url}`);
        const page = await sessions.pageFor(ctx.runId);
        await page.goto(url);
        return { url: page.currentUrl(), title: await page.title() };
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_snapshot',
      description: 'See the current page: visible text plus the interactive elements (buttons, links, inputs) you can act on, in order.',
      parameters: {
        type: 'object',
        properties: {
          maxChars: { type: 'number', description: 'Max text characters (default 6000)' },
          maxElements: { type: 'number', description: 'Max interactive elements (default 80)' },
        },
        required: [],
      },
      risk: 'read',
      timeoutMs: 20_000,
      handler: async (_args, ctx) => {
        const page = await sessions.pageFor(ctx.runId);
        const maxChars = typeof _args.maxChars === 'number' ? _args.maxChars : 6000;
        const maxElements = typeof _args.maxElements === 'number' ? _args.maxElements : 80;
        return {
          url: page.currentUrl(),
          title: await page.title(),
          text: await page.visibleText(maxChars),
          elements: await page.interactiveElements(maxElements),
        };
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_click',
      description: 'Click an element on the current page, by its visible text (preferred) or a CSS selector.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Visible text of a button/link to click' },
          selector: { type: 'string', description: 'CSS selector (fallback)' },
        },
        required: [],
      },
      risk: 'execute',
      timeoutMs: 20_000,
      handler: async (args, ctx) => {
        const page = await sessions.pageFor(ctx.runId);
        if (typeof args.text === 'string' && args.text) {
          await page.clickText(args.text);
        } else if (typeof args.selector === 'string' && args.selector) {
          await page.clickSelector(args.selector);
        } else {
          throw new Error('browser_click needs `text` or `selector`');
        }
        return { url: page.currentUrl(), title: await page.title() };
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_fill',
      description: 'Type a value into a form field, found by its label, placeholder, or a CSS selector. The value is never returned or audited (the executor redacts nothing here — the handler returns only which field was filled).',
      parameters: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          placeholder: { type: 'string' },
          selector: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['value'],
      },
      risk: 'execute',
      timeoutMs: 20_000,
      handler: async (args, ctx) => {
        const page = await sessions.pageFor(ctx.runId);
        const filled = await page.fillField({
          label: args.label as string | undefined,
          placeholder: args.placeholder as string | undefined,
          selector: args.selector as string | undefined,
          value: String(args.value ?? ''),
        });
        return { filled, url: page.currentUrl() }; // value deliberately omitted
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_press',
      description: 'Press a keyboard key on the current page (e.g. Enter, Tab, Escape, ArrowDown).',
      parameters: {
        type: 'object',
        properties: { key: { type: 'string' } },
        required: ['key'],
      },
      risk: 'execute',
      timeoutMs: 10_000,
      handler: async (args, ctx) => {
        const page = await sessions.pageFor(ctx.runId);
        await page.press(String(args.key ?? 'Enter'));
        return { url: page.currentUrl() };
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_screenshot',
      description: 'Save a screenshot of the current page inside this run\'s workspace and return its path.',
      parameters: {
        type: 'object',
        properties: { filename: { type: 'string', description: 'Default: screenshot.png' } },
        required: [],
      },
      risk: 'read',
      timeoutMs: 20_000,
      handler: async (args, ctx) => {
        const page = await sessions.pageFor(ctx.runId);
        const filename = typeof args.filename === 'string' && args.filename ? args.filename : 'screenshot.png';
        const fullPath = sandboxPath(ctx.cwd, filename); // throws if it escapes the workspace
        await page.screenshot(fullPath);
        return { path: fullPath, relative: path.relative(ctx.cwd, fullPath) };
      },
    }),
  );

  registry.register(
    defineTool<Record<string, unknown>, unknown>({
      name: 'browser_close',
      description: 'Close this run\'s browser session and free its resources.',
      parameters: { type: 'object', properties: {}, required: [] },
      risk: 'read',
      timeoutMs: 10_000,
      handler: async (_args, ctx) => {
        await sessions.close(ctx.runId);
        return { closed: true };
      },
    }),
  );

  return registry;
}
