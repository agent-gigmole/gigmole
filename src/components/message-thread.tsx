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
      <p className="text-sm text-gray-500">No messages yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map(message => (
        <div
          key={message.id}
          className="rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">
              {message.senderName}
            </p>
            <p className="text-xs text-gray-500">{message.createdAt}</p>
          </div>
          <p className="mt-2 text-sm text-gray-300">{message.content}</p>
        </div>
      ))}
    </div>
  )
}
