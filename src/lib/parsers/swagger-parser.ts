import type { ParsedEndpoint, SwaggerParseResult } from "@/types";

type OpenAPISpec = {
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, OpenAPIOperation>>;
  components?: { schemas?: Record<string, unknown> };
};

type OpenAPIOperation = {
  summary?: string;
  description?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean; schema?: Record<string, unknown> }>;
  requestBody?: { content?: Record<string, { schema?: Record<string, unknown> }> };
  responses?: Record<string, { content?: Record<string, { schema?: Record<string, unknown> }> }>;
};

/**
 * Parse an OpenAPI/Swagger spec (JSON or YAML string) into structured endpoints.
 */
export function parseOpenApiSpec(specText: string): SwaggerParseResult {
  let spec: OpenAPISpec;

  try {
    spec = JSON.parse(specText);
  } catch {
    // Try basic YAML parsing (simple key: value)
    spec = parseSimpleYaml(specText);
  }

  const name = spec.info?.title || "API Spec";
  const version = spec.info?.version || "1.0.0";
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        endpoints.push(parseEndpoint(method.toUpperCase(), path, operation));
      }
    }
  }

  return { name, version, endpoints };
}

function parseEndpoint(
  method: string,
  path: string,
  op: OpenAPIOperation
): ParsedEndpoint {
  const requestSchema = extractRequestSchema(op);
  const responseSchema = extractResponseSchema(op);
  const parameters = (op.parameters || []).map((p) => ({
    name: p.name,
    in: p.in,
    required: p.required || false,
    schema: (p.schema as Record<string, unknown>) || {},
  }));

  return {
    method,
    path,
    summary: op.summary || op.description || `${method} ${path}`,
    suggestedUI: suggestUIType(method, path, op, responseSchema),
    requestSchema,
    responseSchema,
    parameters,
  };
}

function suggestUIType(
  method: string,
  path: string,
  op: OpenAPIOperation,
  responseSchema: Record<string, unknown> | null
): string {
  const hasBody = !!op.requestBody;
  const hasQueryParams = (op.parameters || []).some((p) => p.in === "query");
  const isArray = responseSchema?.type === "array" ||
    (responseSchema?.properties as Record<string, unknown>)?.items !== undefined;

  if (method === "DELETE") return "dialog";
  if ((method === "POST" || method === "PUT") && hasBody) {
    return method === "POST" ? "form-create" : "form-edit";
  }
  if (method === "GET" && isArray && hasQueryParams) return "filter-table";
  if (method === "GET" && isArray) return "table";
  if (method === "GET" && !isArray) return "detail";
  return "card";
}

function extractRequestSchema(op: OpenAPIOperation): Record<string, unknown> | null {
  const content = op.requestBody?.content;
  if (!content) return null;
  const jsonContent = content["application/json"];
  return (jsonContent?.schema as Record<string, unknown>) || null;
}

function extractResponseSchema(op: OpenAPIOperation): Record<string, unknown> | null {
  const responses = op.responses;
  if (!responses) return null;
  const successResponse = responses["200"] || responses["201"] || Object.values(responses)[0];
  const content = (successResponse as { content?: Record<string, { schema?: Record<string, unknown> }> })?.content;
  if (!content) return null;
  const jsonContent = content["application/json"];
  return (jsonContent?.schema as Record<string, unknown>) || null;
}

function parseSimpleYaml(text: string): OpenAPISpec {
  // Very basic YAML parser for simple specs — not production grade
  // For complex YAML, users should convert to JSON first
  const lines = text.split("\n");
  const result: Record<string, unknown> = {};
  for (const line of lines) {
    const match = line.match(/^(\s*)([\w-]+):\s*(.+)?$/);
    if (match) {
      const [, , key, value] = match;
      if (value) result[key] = value.trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return result as OpenAPISpec;
}
