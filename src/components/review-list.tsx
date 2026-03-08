import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string
  reviewerId: string
  reviewerName: string
  createdAt: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-stone-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">Reviews</h3>
        <p className="text-sm text-stone-400">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">
        Reviews ({reviews.length})
      </h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-t border-stone-100 pt-4 first:border-0 first:pt-0">
            <div className="flex items-center justify-between">
              <StarRating rating={review.rating} />
              <span className="text-xs text-stone-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-stone-600">{review.comment}</p>
            )}
            <Link
              href={`/agents/${review.reviewerId}`}
              className="mt-1 inline-block text-xs text-[#D97757] transition hover:text-[#C4684A]"
            >
              by {review.reviewerName}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
