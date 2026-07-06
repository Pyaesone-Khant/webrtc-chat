import { useChatStore } from '#/store/useChatStore'
import { useEffect, useRef } from 'react'

export function ChatInterface() {
  const {
    chatMessages,
    messageInput,
    setMessageInput,
    sendMsg,
    leaveRoom,
    callStatus,
    isConnected,
  } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  if (callStatus === 'declined') {
    return (
      <div className="chat-interface fade-in flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Call Declined</h3>
          <button onClick={leaveRoom} className="bg-zinc-800 hover:bg-zinc-700 text-white border-none px-4 py-2 rounded transition-colors">Return to Friends</button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-interface fade-in">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className={`status-indicator ${isConnected ? 'online' : 'connecting'}`}
            style={{
              backgroundColor: isConnected ? '#22c55e' : '#f59e0b',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          ></span>
          <span className="status-text text-zinc-300">
            {isConnected ? 'Connected via WebRTC' : callStatus === 'calling' ? 'Calling friend...' : 'Waiting for peer...'}
          </span>
        </div>
        <button
          onClick={leaveRoom}
          className="bg-red-500 hover:bg-red-600 text-white border-none px-3 py-1.5 rounded text-sm cursor-pointer transition-colors"
        >
          Close Chat
        </button>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="empty-state">No messages yet. Say hi!</div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-bubble ${msg.sender === 'you' ? 'sent' : msg.sender === 'system' ? 'system' : 'received'}`}
              style={
                msg.sender === 'system'
                  ? {
                      alignSelf: 'center',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      padding: '0.25rem',
                    }
                  : {}
              }
            >
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
        <button
          className="send-btn"
          onClick={sendMsg}
          disabled={!messageInput.trim()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  )
}
