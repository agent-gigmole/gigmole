import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/openapi.json/route'

describe('GET /api/openapi.json', () => {
  it('returns 200 with valid OpenAPI 3.0 structure', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const spec = await response.json()
    expect(spec.openapi).toBe('3.0.0')
    expect(spec.info).toBeDefined()
    expect(spec.info.title).toBe('GigMole API')
    expect(spec.info.version).toBe('1.0.0')
    expect(spec.info.description).toBeTruthy()
    expect(spec.servers).toBeInstanceOf(Array)
    expect(spec.servers[0].url).toBe('https://gigmole.org')
    expect(spec.paths).toBeDefined()
  })

  it('has more than 10 paths', async () => {
    const response = await GET()
    const spec = await response.json()
    const pathCount = Object.keys(spec.paths).length
    expect(pathCount).toBeGreaterThan(10)
  })

  it('has BearerAuth security scheme', async () => {
    const response = await GET()
    const spec = await response.json()
    expect(spec.components).toBeDefined()
    expect(spec.components.securitySchemes).toBeDefined()
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined()
    expect(spec.components.securitySchemes.BearerAuth.type).toBe('http')
    expect(spec.components.securitySchemes.BearerAuth.scheme).toBe('bearer')
  })

  it('sets CORS header', async () => {
    const response = await GET()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('converts :param to {param} in paths', async () => {
    const response = await GET()
    const spec = await response.json()
    const paths = Object.keys(spec.paths)

    // No path should contain :param syntax
    for (const path of paths) {
      expect(path).not.toMatch(/:/)
    }

    // Should have {id} paths
    const paramPaths = paths.filter(p => p.includes('{id}'))
    expect(paramPaths.length).toBeGreaterThan(0)
  })

  it('marks authenticated endpoints with security', async () => {
    const response = await GET()
    const spec = await response.json()

    // POST /api/tasks requires auth
    const tasksPost = spec.paths['/api/tasks']?.post
    expect(tasksPost).toBeDefined()
    expect(tasksPost.security).toEqual([{ BearerAuth: [] }])

    // GET /api/stats does NOT require auth
    const statsGet = spec.paths['/api/stats']?.get
    expect(statsGet).toBeDefined()
    expect(statsGet.security).toBeUndefined()
  })

  it('includes request body for POST endpoints with params', async () => {
    const response = await GET()
    const spec = await response.json()

    const registerPost = spec.paths['/api/agents/register']?.post
    expect(registerPost).toBeDefined()
    expect(registerPost.requestBody).toBeDefined()
    expect(registerPost.requestBody.content['application/json']).toBeDefined()
    expect(registerPost.requestBody.content['application/json'].schema.properties.name).toBeDefined()
  })

  it('includes query parameters for GET endpoints', async () => {
    const response = await GET()
    const spec = await response.json()

    const tasksGet = spec.paths['/api/tasks']?.get
    expect(tasksGet).toBeDefined()
    expect(tasksGet.parameters).toBeDefined()
    const pageParam = tasksGet.parameters.find((p: { name: string }) => p.name === 'page')
    expect(pageParam).toBeDefined()
    expect(pageParam.in).toBe('query')
  })
})
