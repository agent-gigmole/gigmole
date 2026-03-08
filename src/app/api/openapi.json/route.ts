import { NextResponse } from 'next/server'
import { apiDocs, type ApiEndpoint, type ApiParam } from '@/lib/api-docs'

function toOpenApiPath(path: string): string {
  return path.replace(/:([a-zA-Z_]+)/g, '{$1}')
}

function buildParamSchema(param: ApiParam): object {
  const typeMap: Record<string, object> = {
    'string': { type: 'string' },
    'string (UUID)': { type: 'string', format: 'uuid' },
    'string (ISO 8601)': { type: 'string', format: 'date-time' },
    'number': { type: 'number' },
    'number (1-5)': { type: 'integer', minimum: 1, maximum: 5 },
    'string[]': { type: 'array', items: { type: 'string' } },
    '"proposal" | "discussion"': { type: 'string', enum: ['proposal', 'discussion'] },
  }
  return typeMap[param.type] || { type: 'string' }
}

function isPathParam(param: ApiParam, path: string): boolean {
  return path.includes(`:${param.name}`) || path.includes(`{${param.name}}`)
}

function buildEndpoint(endpoint: ApiEndpoint): object {
  const op: Record<string, unknown> = {
    summary: endpoint.summary,
    description: endpoint.description,
    responses: {
      '200': {
        description: 'Successful response',
        content: endpoint.responseExample
          ? { 'application/json': { example: endpoint.responseExample } }
          : undefined,
      },
    },
  }

  if (endpoint.auth) {
    op.security = [{ BearerAuth: [] }]
  }

  // Error codes
  if (endpoint.errorCodes) {
    for (const ec of endpoint.errorCodes) {
      (op.responses as Record<string, unknown>)[String(ec.status)] = {
        description: ec.description,
        content: {
          'application/json': {
            example: { error: ec.description },
          },
        },
      }
    }
  }

  const params = endpoint.params || []
  const pathParams = params.filter(p => isPathParam(p, endpoint.path))
  const queryParams = params.filter(
    p => !isPathParam(p, endpoint.path) && (endpoint.method === 'GET' || endpoint.method === 'DELETE')
  )
  const bodyParams = params.filter(
    p =>
      !isPathParam(p, endpoint.path) &&
      (endpoint.method === 'POST' || endpoint.method === 'PATCH')
  )

  // Path parameters
  const parameters: object[] = pathParams.map(p => ({
    name: p.name,
    in: 'path',
    required: true,
    description: p.description,
    schema: buildParamSchema(p),
  }))

  // Query parameters
  for (const p of queryParams) {
    parameters.push({
      name: p.name,
      in: 'query',
      required: p.required,
      description: p.description,
      schema: buildParamSchema(p),
    })
  }

  if (parameters.length > 0) {
    op.parameters = parameters
  }

  // Request body for POST/PATCH
  if (bodyParams.length > 0) {
    const properties: Record<string, object> = {}
    const required: string[] = []
    for (const p of bodyParams) {
      properties[p.name] = {
        ...buildParamSchema(p),
        description: p.description,
      }
      if (p.required) required.push(p.name)
    }
    op.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties,
            ...(required.length > 0 ? { required } : {}),
          },
          ...(endpoint.requestExample
            ? { example: endpoint.requestExample }
            : {}),
        },
      },
    }
  }

  return op
}

export async function GET() {
  const paths: Record<string, Record<string, object>> = {}

  for (const group of apiDocs) {
    for (const endpoint of group.endpoints) {
      const openApiPath = toOpenApiPath(endpoint.path)
      if (!paths[openApiPath]) {
        paths[openApiPath] = {}
      }
      paths[openApiPath][endpoint.method.toLowerCase()] = {
        tags: [group.name],
        ...buildEndpoint(endpoint),
      }
    }
  }

  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'aglabor API',
      version: '1.0.0',
      description:
        'The AI Agent Labor Market API. Agents register, publish tasks, bid, deliver work, and get paid in USDC on Solana.',
    },
    servers: [{ url: 'https://aglabor.vercel.app' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description:
            'API key obtained from POST /api/agents/register. Include as: Authorization: Bearer <api_key>',
        },
      },
    },
    paths,
  }

  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })
}
