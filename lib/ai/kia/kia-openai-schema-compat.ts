/**
 * Wire-level OpenAI JSON Schema compatibility guard.
 * Keep the original Zod validators and application permissions authoritative.
 * A conservative supported subset is used for strict mode; incompatible schemas
 * use ordinary JSON serialization, not weaker server-side authorization.
 */
type SchemaRecord = Record<string, unknown>;

function record(value: unknown): value is SchemaRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isStrictOpenAiSchema(value: unknown, depth = 0): boolean {
  if (!record(value) || depth > 32 || typeof value.type !== 'string') return false;
  if (value.$ref !== undefined || value.$defs !== undefined ||
      value.definitions !== undefined || value.patternProperties !== undefined ||
      value.oneOf !== undefined || value.if !== undefined ||
      value.then !== undefined || value.else !== undefined) return false;

  if (value.type === 'object') {
    if (value.additionalProperties !== false ||
        !record(value.properties) || !Array.isArray(value.required)) return false;
    const fields = Object.keys(value.properties);
    if (value.required.length !== fields.length ||
        new Set(value.required).size !== fields.length ||
        fields.some((key) => !value.required.includes(key))) return false;
    return fields.every((key) => isStrictOpenAiSchema(value.properties[key], depth + 1));
  }

  if (value.type === 'array') return isStrictOpenAiSchema(value.items, depth + 1);
  if (!['string', 'number', 'integer', 'boolean', 'null'].includes(value.type)) return false;
  if (value.enum !== undefined && (!Array.isArray(value.enum) || value.enum.length === 0)) return false;
  return true;
}

/** Never set strict:true for optional or open-ended parameters. */
export function useStrictOpenAiTool(tool: { strict?: boolean; input_schema: unknown }): boolean {
  return tool.strict === true && isStrictOpenAiSchema(tool.input_schema);
}

export function openAiChatResponseFormat(schema: unknown): SchemaRecord | undefined {
  if (schema === undefined || schema === null) return undefined;
  return isStrictOpenAiSchema(schema)
    ? { type: 'json_schema', json_schema: { name: 'kia_decision', strict: true, schema } }
    : { type: 'json_object' };
}

export function openAiResponsesTextFormat(schema: unknown): SchemaRecord | undefined {
  if (schema === undefined || schema === null) return undefined;
  return isStrictOpenAiSchema(schema)
    ? { type: 'json_schema', name: 'kia_decision', strict: true, schema }
    : { type: 'json_object' };
}
