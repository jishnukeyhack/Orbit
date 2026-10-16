// ============================================
// Orbit — Agent Action Layer: tool registry
// ONE source of truth per tool: schema + risk + implementation together.
// (Replaces the split in Orbit today: REAL_TOOL_DEFINITIONS in one place,
// a switch statement in executeTool in another.)
// ============================================
import type { JsonSchema, ToolDefinition } from './types';

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register<A, R>(tool: ToolDefinition<A, R>): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Duplicate tool registration: ${tool.name}`);
    }
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tool.name)) {
      throw new Error(`Invalid tool name (LLM providers restrict the charset): ${tool.name}`);
    }
    this.tools.set(tool.name, tool as ToolDefinition);
    return this;
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  /** OpenAI function-calling format — the exact shape Orbit's
   *  src/lib/server/llm.ts already sends (and converts for Gemini/Anthropic). */
  schemasForLLM(only?: string[]): Array<{ type: 'function'; function: { name: string; description: string; parameters: JsonSchema } }> {
    return this.list()
      .filter((t) => !only || only.includes(t.name))
      .map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
  }
}

/** Small helper so tool files read declaratively. */
export function defineTool<A, R>(tool: ToolDefinition<A, R>): ToolDefinition<A, R> {
  return tool;
}
