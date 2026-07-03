import { useChatStore } from '#/store/useChatStore'

export function ChatSetup() {
  const {
    roomName,
    setRoomName,
    joinRoom,
    isConnecting
  } = useChatStore()

  return (
    <div className="setup-wizard">
      <div className="step-card fade-in">
        <h3>Join a Chat Room</h3>
        <p>Enter a room name to automatically connect with a peer.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input
            className="input-textarea"
            type="text"
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
            placeholder="Room Name (e.g. my-cool-room)"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button className="primary-btn" onClick={joinRoom} disabled={isConnecting || !roomName}>
            {isConnecting ? <span className="spinner"></span> : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  )
}
