import { useEffect, useRef } from 'react'
import { useChatStore } from '#/store/useChatStore'

export function ChatInterface() {
  const { chatMessages, messageInput, setMessageInput, sendMsg } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  return (
    <div className="chat-interface fade-in">
      <div className="chat-header">
        <span className="status-indicator online"></span>
        <span className="status-text">Connected via WebRTC</span>
      </div>
      
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="empty-state">No messages yet. Say hi!</div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={`message-bubble ${msg.sender === 'you' ? 'sent' : 'received'}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
        />
        <button className="send-btn" onClick={sendMsg} disabled={!messageInput.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  )
}
