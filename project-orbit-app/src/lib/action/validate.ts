// ============================================
// Orbit — Agent Action Layer: argument validation
// Minimal JSON-Schema validator (zero dependencies).
// The model WILL hallucinate arguments — validate before anything runs.
// For deeply nested schemas, swap this for ajv/zod later; keep the
// validateArgs() signature so the executor does not change.
// ============================================
import type { JsonSchema } from './types';

export interface ValidationError {
  path: string;
  message: string;
}

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function check(schema: JsonSchema, value: unknown, path: string, errors: ValidationError[]): void {
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push({ path, message: `must be one of ${JSON.stringify(schema.enum)}` });
    return;
  }

  const expected = schema.type;
  if (expected && expected !== 'any') {
    const actual = typeOf(value);
    const ok =
      expected === actual ||
      (expected === 'number' && actual === 'integer') ||
      (expected === 'object' && actual === 'object');
    if (!ok) {
      errors.push({ path, message: `expected ${expected}, got ${actual}` });
      return;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength)
      errors.push({ path, message: `shorter than minLength ${schema.minLength}` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      errors.push({ path, message: `longer than maxLength ${schema.maxLength}` });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum)
      errors.push({ path, message: `below minimum ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum)
      errors.push({ path, message: `above maximum ${schema.maximum}` });
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => check(schema.items!, item, `${path}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const props = schema.properties ?? {};
    for (const req of schema.required ?? []) {
      if (!(req in obj) || obj[req] === undefined)
        errors.push({ path: `${path}.${req}`, message: 'required property missing' });
    }
    for (const [key, val] of Object.entries(obj)) {
      if (props[key]) {
        check(props[key], val, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({ path: `${path}.${key}`, message: 'unknown property' });
      }
    }
  }
}

export function validateArgs(schema: JsonSchema, args: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  check(schema, args, 'args', errors);
  return errors;
}
