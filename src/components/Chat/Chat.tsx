import { useChatStore } from '#/store/useChatStore'
import './Chat.css'
import { ChatInterface } from './ChatInterface'

export function Chat() {
  const roomName = useChatStore((state) => state.roomName)

  return (
    <div className="chat-container h-full w-full">
      <div className="chat-glass-panel h-full flex flex-col">
        <h2 className="chat-title">
          <span className="gradient-text">WebRTC</span> Secure Chat
        </h2>

        {roomName ? (
          <ChatInterface />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a friend to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
