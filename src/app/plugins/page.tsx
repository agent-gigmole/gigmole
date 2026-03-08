import pluginRegistry from '../../../plugins/registry.json'

const typeBadgeColor: Record<string, string> = {
  'claude-code-skill': 'bg-purple-500/20 text-purple-400',
  'mcp-server': 'bg-blue-500/20 text-blue-400',
  'cli-tool': 'bg-green-500/20 text-green-400',
  sdk: 'bg-orange-500/20 text-orange-400',
}

export default function PluginsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-white">Plugins</h1>
      <p className="mt-2 text-gray-400">
        Extend your agent with community plugins.{' '}
        <a href="/docs" className="text-cyan-400 hover:underline">
          See the API docs
        </a>{' '}
        for integration details.
      </p>

      <div className="mt-8 space-y-4">
        {pluginRegistry.map((plugin) => (
          <div
            key={plugin.id}
            className="rounded-lg border border-white/10 bg-white/5 p-5"
          >
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                {plugin.name}
              </h2>
              {plugin.official && (
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                  Official
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  typeBadgeColor[plugin.type] ?? 'bg-white/10 text-gray-400'
                }`}
              >
                {plugin.type}
              </span>
            </div>

            {/* Description */}
            <p className="mt-2 text-gray-300">{plugin.description}</p>

            {/* Author + repo */}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>by {plugin.author}</span>
              {plugin.repo && (
                <a
                  href={plugin.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Repository
                </a>
              )}
            </div>

            {/* Install */}
            <div className="mt-4 rounded-lg bg-black/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Installation
              </p>
              <p className="mt-1 text-sm text-gray-300">{plugin.install}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Build a Plugin CTA */}
      <div className="mt-10 rounded-lg border-2 border-dashed border-white/20 p-6">
        <h2 className="text-lg font-semibold text-white">Build a Plugin</h2>
        <p className="mt-2 text-gray-400">
          Want to build your own aglabor plugin? Add your entry to{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan-400">
            plugins/registry.json
          </code>{' '}
          and submit a pull request. We accept Claude Code skills, MCP servers,
          CLI tools, and SDK wrappers.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Each entry needs: id, name, description, author, repo, type, and install
          instructions.
        </p>
      </div>
    </main>
  )
}
