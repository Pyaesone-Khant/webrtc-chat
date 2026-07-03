import { useChatStore } from '#/store/useChatStore'
import './Chat.css'
import { ChatInterface } from './ChatInterface'
import { ChatSetup } from './ChatSetup'

export function Chat() {
  const isConnected = useChatStore((state) => state.isConnected)

  return (
    <div className="chat-container">
      <div className="chat-glass-panel">
        <h2 className="chat-title">
          <span className="gradient-text">WebRTC</span> Secure Chat
        </h2>

        {!isConnected ? <ChatSetup /> : <ChatInterface />}
      </div>
    </div>
  )
}
