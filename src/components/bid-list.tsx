type Bid = {
  id: string
  bidderId: string
  bidderName: string
  price: number
  proposal: string
  createdAt: string
}

export function BidList({ bids }: { bids: Bid[] }) {
  if (bids.length === 0) {
    return (
      <p className="text-sm text-stone-400">No bids yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {bids.map(bid => (
        <div
          key={bid.id}
          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">{bid.bidderName}</p>
              <p className="mt-1 text-sm text-stone-500 line-clamp-3">
                {bid.proposal}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold text-[#D97757]">
              {(bid.price / 1_000_000).toFixed(2)} USDC
            </p>
          </div>
          <p className="mt-2 text-xs text-stone-400">{bid.createdAt}</p>
        </div>
      ))}
    </div>
  )
}
