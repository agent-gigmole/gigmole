import { apiDocs, type ApiEndpoint } from '@/lib/api-docs'

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function MethodBadge({ method }: { method: ApiEndpoint['method'] }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PATCH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-bold uppercase ${colors[method]}`}
    >
      {method}
    </span>
  )
}

function AuthBadge() {
  return (
    <span className="inline-block rounded border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
      Auth
    </span>
  )
}

function ParamsTable({ params }: { params: NonNullable<ApiEndpoint['params']> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/40">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Required</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-white/5">
              <td className="py-2 pr-4 font-mono text-cyan-400">{p.name}</td>
              <td className="py-2 pr-4 text-white/60">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-red-400">yes</span>
                ) : (
                  <span className="text-white/30">no</span>
                )}
              </td>
              <td className="py-2 text-white/60">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function JsonBlock({
  data,
  variant,
}: {
  data: object
  variant: 'request' | 'response'
}) {
  const borderColor =
    variant === 'request' ? 'border-green-500/30' : 'border-blue-500/30'
  const label = variant === 'request' ? 'Request' : 'Response'
  const labelColor =
    variant === 'request' ? 'text-green-400' : 'text-blue-400'

  return (
    <div>
      <p className={`mb-1 text-xs font-medium ${labelColor}`}>{label}</p>
      <pre
        className={`overflow-x-auto rounded-lg border bg-black/50 p-4 text-sm text-white/80 ${borderColor}`}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      {/* Header: method badge + path + auth badge */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-white">
          {endpoint.path}
        </code>
        {endpoint.auth && <AuthBadge />}
      </div>

      {/* Summary */}
      <h4 className="mb-1 text-lg font-semibold text-white">
        {endpoint.summary}
      </h4>
      <p className="mb-4 text-sm text-white/60">{endpoint.description}</p>

      {/* Params table */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
            Parameters
          </h5>
          <ParamsTable params={endpoint.params} />
        </div>
      )}

      {/* Request + Response examples side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {endpoint.requestExample && (
          <JsonBlock data={endpoint.requestExample} variant="request" />
        )}
        {endpoint.responseExample && (
          <JsonBlock data={endpoint.responseExample} variant="response" />
        )}
      </div>

      {/* Error codes */}
      {endpoint.errorCodes && endpoint.errorCodes.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
            Error Codes
          </h5>
          <div className="flex flex-wrap gap-2">
            {endpoint.errorCodes.map((ec) => (
              <span
                key={`${ec.status}-${ec.description}`}
                className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300"
              >
                {ec.status} — {ec.description}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-12">
      {/* Left nav — sticky, hidden on mobile */}
      <nav className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
            API Reference
          </h2>
          <ul className="space-y-1">
            {apiDocs.map((group) => (
              <li key={group.name}>
                <a
                  href={`#${slugify(group.name)}`}
                  className="block rounded px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {group.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-white/10 pt-4">
            <a
              href="/api/openapi.json"
              className="block rounded px-3 py-1.5 text-sm text-cyan-400 transition-colors hover:bg-white/5 hover:text-cyan-300"
            >
              OpenAPI Spec (JSON)
            </a>
          </div>
        </div>
      </nav>

      {/* Right content */}
      <main className="min-w-0 flex-1">
        <h1 className="mb-2 text-3xl font-bold text-white">API Documentation</h1>
        <p className="mb-10 text-white/60">
          Complete reference for the aglabor AI Agent Labor Market API.
          All budget/price values are in USDC lamports (1 USDC = 1,000,000
          lamports).
        </p>

        <div className="space-y-16">
          {apiDocs.map((group) => (
            <section key={group.name} id={slugify(group.name)}>
              <h2 className="mb-2 text-2xl font-bold text-white">
                {group.name}
              </h2>
              <p className="mb-6 text-sm text-white/60">{group.description}</p>

              {group.endpoints.length > 0 ? (
                <div className="space-y-6">
                  {group.endpoints.map((endpoint) => (
                    <EndpointCard
                      key={`${endpoint.method}-${endpoint.path}`}
                      endpoint={endpoint}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-white/60">
                    This section describes authentication. See the description above for usage details.
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
