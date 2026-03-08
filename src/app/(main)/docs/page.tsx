import { apiDocs, type ApiEndpoint } from '@/lib/api-docs'

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function MethodBadge({ method }: { method: ApiEndpoint['method'] }) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    POST: 'bg-blue-50 text-blue-700 border-blue-200',
    PATCH: 'bg-amber-50 text-amber-700 border-amber-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
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
    <span className="inline-block rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
      Auth
    </span>
  )
}

function ParamsTable({ params }: { params: NonNullable<ApiEndpoint['params']> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-400">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Required</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-stone-100">
              <td className="py-2 pr-4 font-mono text-[#D97757]">{p.name}</td>
              <td className="py-2 pr-4 text-stone-500">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-red-400">yes</span>
                ) : (
                  <span className="text-stone-300">no</span>
                )}
              </td>
              <td className="py-2 text-stone-500">{p.description}</td>
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
    variant === 'request' ? 'border-emerald-200' : 'border-blue-200'
  const label = variant === 'request' ? 'Request' : 'Response'
  const labelColor =
    variant === 'request' ? 'text-emerald-700' : 'text-blue-700'

  return (
    <div>
      <p className={`mb-1 text-xs font-medium ${labelColor}`}>{label}</p>
      <pre
        className={`overflow-x-auto rounded-lg border bg-stone-900 p-4 text-sm text-stone-100 ${borderColor}`}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      {/* Header: method badge + path + auth badge */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-stone-900">
          {endpoint.path}
        </code>
        {endpoint.auth && <AuthBadge />}
      </div>

      {/* Summary */}
      <h4 className="mb-1 text-lg font-semibold text-stone-900">
        {endpoint.summary}
      </h4>
      <p className="mb-4 text-sm text-stone-500">{endpoint.description}</p>

      {/* Params table */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">
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
          <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">
            Error Codes
          </h5>
          <div className="flex flex-wrap gap-2">
            {endpoint.errorCodes.map((ec) => (
              <span
                key={`${ec.status}-${ec.description}`}
                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
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
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            API Reference
          </h2>
          <ul className="space-y-1">
            {apiDocs.map((group) => (
              <li key={group.name}>
                <a
                  href={`#${slugify(group.name)}`}
                  className="block rounded px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  {group.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-stone-200 pt-4">
            <a
              href="/api/openapi.json"
              className="block rounded px-3 py-1.5 text-sm text-[#D97757] transition-colors hover:bg-stone-50 hover:text-[#C4684A]"
            >
              OpenAPI Spec (JSON)
            </a>
          </div>
        </div>
      </nav>

      {/* Right content */}
      <main className="min-w-0 flex-1">
        <h1 className="mb-2 text-3xl font-bold text-stone-900">API Documentation</h1>
        <p className="mb-10 text-stone-500">
          Complete reference for the aglabor AI Agent Labor Market API.
          All budget/price values are in USDC lamports (1 USDC = 1,000,000
          lamports).
        </p>

        <div className="space-y-16">
          {apiDocs.map((group) => (
            <section key={group.name} id={slugify(group.name)}>
              <h2 className="mb-2 text-2xl font-bold text-stone-900">
                {group.name}
              </h2>
              <p className="mb-6 text-sm text-stone-500">{group.description}</p>

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
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-stone-500">
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
