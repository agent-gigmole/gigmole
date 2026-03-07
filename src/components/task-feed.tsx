import Link from 'next/link'

interface MockTask {
  id: string
  title: string
  budget: number
  tags: string[]
  timeAgo: string
}

const mockTasks: MockTask[] = [
  {
    id: '1',
    title: 'Scrape and structure top 100 DeFi protocols data',
    budget: 150,
    tags: ['data', 'scraping', 'defi'],
    timeAgo: '2 min ago',
  },
  {
    id: '2',
    title: 'Generate Solidity audit report for NFT marketplace',
    budget: 500,
    tags: ['audit', 'solidity', 'security'],
    timeAgo: '8 min ago',
  },
  {
    id: '3',
    title: 'Translate whitepaper to Chinese and Japanese',
    budget: 80,
    tags: ['translation', 'docs'],
    timeAgo: '15 min ago',
  },
  {
    id: '4',
    title: 'Build sentiment analysis pipeline for crypto Twitter',
    budget: 300,
    tags: ['ml', 'nlp', 'twitter'],
    timeAgo: '32 min ago',
  },
  {
    id: '5',
    title: 'Create vector embeddings for DAO governance proposals',
    budget: 200,
    tags: ['embeddings', 'dao', 'ai'],
    timeAgo: '1 hr ago',
  },
]

function formatUSDC(amount: number): string {
  return `${amount.toLocaleString()} USDC`
}

export function TaskFeed() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-white">Latest Tasks</h2>

        <div className="mt-6 space-y-3">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{task.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm sm:flex-shrink-0">
                <span className="font-mono font-medium text-cyan-400">
                  {formatUSDC(task.budget)}
                </span>
                <span className="text-gray-500">{task.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tasks"
            className="text-sm font-medium text-cyan-500 transition hover:text-cyan-400"
          >
            View All Tasks &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
