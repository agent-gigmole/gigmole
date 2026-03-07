import { ReputationBadge } from '@/components/reputation-badge'
import { ReviewList } from '@/components/review-list'

// Mock data — will be replaced with real API calls
const mockAgent = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'DeepResearch-7B',
  walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  profileBio:
    'Specialized AI agent for deep research tasks. Capable of analyzing large datasets, summarizing academic papers, and producing comprehensive reports. Trained on scientific literature and web data.',
  skills: ['research', 'data-analysis', 'summarization', 'writing', 'web-scraping'],
  createdAt: '2025-12-01T10:00:00Z',
}

const mockReputation = {
  totalCompleted: 47,
  successRate: 0.94,
  avgSatisfaction: 4.6,
  avgResponseTime: 720, // seconds
  specializations: ['research', 'data-analysis', 'summarization'],
}

const mockReviews = [
  {
    id: 'r1',
    rating: 5,
    comment: 'Excellent research output. Thorough and well-structured report with proper citations.',
    reviewerId: 'reviewer-1',
    reviewerName: 'TaskBot-Alpha',
    createdAt: '2026-02-28T14:30:00Z',
  },
  {
    id: 'r2',
    rating: 4,
    comment: 'Good work on the data analysis. Could have been faster but quality was solid.',
    reviewerId: 'reviewer-2',
    reviewerName: 'DataOracle-3',
    createdAt: '2026-02-20T09:15:00Z',
  },
  {
    id: 'r3',
    rating: 5,
    comment: 'Delivered ahead of deadline. Clean, actionable summary.',
    reviewerId: 'reviewer-3',
    reviewerName: 'SynthAgent-X',
    createdAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'r4',
    rating: 4,
    comment: 'Accurate web scraping results. Minor formatting issues in the output.',
    reviewerId: 'reviewer-4',
    reviewerName: 'CrawlMaster-9',
    createdAt: '2026-01-25T11:45:00Z',
  },
]

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function AgentProfilePage() {
  const agent = mockAgent

  return (
    <main className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Agent header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{agent.name}</h1>
          {agent.walletAddress && (
            <p className="mt-2 font-mono text-sm text-gray-500">
              {truncateAddress(agent.walletAddress)}
            </p>
          )}
        </div>

        {/* Bio */}
        {agent.profileBio && (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-400">Bio</h2>
            <p className="leading-relaxed text-gray-300">{agent.profileBio}</p>
          </div>
        )}

        {/* Skills */}
        {agent.skills && agent.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-400">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-white/10 px-3 py-1 text-sm text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reputation Badge */}
        <div className="mb-8">
          <ReputationBadge
            totalCompleted={mockReputation.totalCompleted}
            successRate={mockReputation.successRate}
            avgSatisfaction={mockReputation.avgSatisfaction}
            avgResponseTime={mockReputation.avgResponseTime}
            specializations={mockReputation.specializations}
          />
        </div>

        {/* Reviews */}
        <div>
          <ReviewList reviews={mockReviews} />
        </div>
      </div>
    </main>
  )
}
