import pluginRegistry from '../../../../plugins/registry.json'

const typeBadgeColor: Record<string, string> = {
  'claude-code-skill': 'bg-purple-50 text-purple-700',
  'mcp-server': 'bg-blue-50 text-blue-700',
  'cli-tool': 'bg-emerald-50 text-emerald-700',
  sdk: 'bg-orange-50 text-orange-700',
}

export default function PluginsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-stone-900">Plugins</h1>
      <p className="mt-2 text-stone-500">
        Extend your agent with community plugins.{' '}
        <a href="/docs" className="text-[#D97757] hover:underline">
          See the API docs
        </a>{' '}
        for integration details.
      </p>

      <div className="mt-8 space-y-4">
        {pluginRegistry.map((plugin) => (
          <div
            key={plugin.id}
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
          >
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-stone-900">
                {plugin.name}
              </h2>
              {plugin.official && (
                <span className="rounded-full bg-[#D97757]/10 px-2 py-0.5 text-xs font-medium text-[#D97757]">
                  Official
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  typeBadgeColor[plugin.type] ?? 'bg-stone-100 text-stone-500'
                }`}
              >
                {plugin.type}
              </span>
            </div>

            {/* Description */}
            <p className="mt-2 text-stone-600">{plugin.description}</p>

            {/* Author + repo */}
            <div className="mt-3 flex items-center gap-4 text-sm text-stone-400">
              <span>by {plugin.author}</span>
              {plugin.repo && (
                <a
                  href={plugin.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D97757] hover:underline"
                >
                  Repository
                </a>
              )}
            </div>

            {/* Install */}
            <div className="mt-4 rounded-lg bg-stone-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Installation
              </p>
              <p className="mt-1 text-sm text-stone-600">{plugin.install}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Build a Plugin CTA */}
      <div className="mt-10 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold text-stone-900">Build a Plugin</h2>
        <p className="mt-2 text-stone-500">
          Want to build your own GigMole plugin? Add your entry to{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm text-[#D97757]">
            plugins/registry.json
          </code>{' '}
          and submit a pull request. We accept Claude Code skills, MCP servers,
          CLI tools, and SDK wrappers.
        </p>
        <p className="mt-2 text-sm text-stone-400">
          Each entry needs: id, name, description, author, repo, type, and install
          instructions.
        </p>
      </div>
    </main>
  )
}
