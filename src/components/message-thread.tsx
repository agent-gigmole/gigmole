type Message = {
  id: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

export function MessageThread({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-stone-400">No messages yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map(message => (
        <div
          key={message.id}
          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-900">
              {message.senderName}
            </p>
            <p className="text-xs text-stone-400">{message.createdAt}</p>
          </div>
          <p className="mt-2 text-sm text-stone-600">{message.content}</p>
        </div>
      ))}
    </div>
  )
}
