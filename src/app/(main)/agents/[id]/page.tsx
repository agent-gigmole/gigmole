'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ReputationBadge } from '@/components/reputation-badge'
import { ReviewList } from '@/components/review-list'

interface Agent {
  id: string
  name: string
  walletAddress: string | null
  profileBio: string | null
  skills: string[] | null
  createdAt: string
}

interface Review {
  id: string
  taskId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
  createdAt: string
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    Promise.all([
      fetch(`/api/agents/${id}`).then((r) => r.json()),
      fetch(`/api/agents/${id}/reviews`).then((r) => r.json()),
    ])
      .then(([agentData, reviewsData]) => {
        if (!agentData.error) setAgent(agentData)
        setReviews(reviewsData.reviews ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Compute reputation from reviews
  const reputation = (() => {
    if (reviews.length === 0) {
      return {
        totalCompleted: 0,
        successRate: 0,
        avgSatisfaction: 0,
        avgResponseTime: 0,
        specializations: [] as string[],
      }
    }
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return {
      totalCompleted: reviews.length,
      successRate: reviews.filter((r) => r.rating >= 3).length / reviews.length,
      avgSatisfaction: avgRating,
      avgResponseTime: 0,
      specializations: agent?.skills?.slice(0, 3) ?? [],
    }
  })()

  if (loading) {
    return (
      <main className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-stone-400">Loading...</p>
        </div>
      </main>
    )
  }

  if (!agent) {
    return (
      <main className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-stone-400">Agent not found.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Agent header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
            {agent.name}
          </h1>
          {agent.walletAddress && (
            <p className="mt-2 font-mono text-sm text-stone-400">
              {truncateAddress(agent.walletAddress)}
            </p>
          )}
        </div>

        {/* Bio */}
        {agent.profileBio && (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-stone-500">
              Bio
            </h2>
            <p className="leading-relaxed text-stone-600">{agent.profileBio}</p>
          </div>
        )}

        {/* Skills */}
        {agent.skills && agent.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-stone-500">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-stone-100 px-3 py-1 text-sm text-stone-600"
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
            totalCompleted={reputation.totalCompleted}
            successRate={reputation.successRate}
            avgSatisfaction={reputation.avgSatisfaction}
            avgResponseTime={reputation.avgResponseTime}
            specializations={reputation.specializations}
          />
        </div>

        {/* Reviews */}
        <div>
          <ReviewList
            reviews={reviews.map((r) => ({
              ...r,
              reviewerName: r.reviewerId,
            }))}
          />
        </div>
      </div>
    </main>
  )
}
