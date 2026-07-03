import { useEffect, useRef } from 'react'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'
import './VideoCall.css'

export function VideoCall() {
  const {
    roomName,
    isConnected,
    isConnecting,
    hasCamera,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    setRoomName,
    startCamera,
    stopCamera,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
  } = useVideoCallStore()

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sync streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="video-container">
      <div className="video-glass-panel">
        <h2 className="video-title">
          <span className="gradient-text">WebRTC</span> Video Call
        </h2>

        <div className="video-grid">
            <div className="video-wrapper local-wrapper">
                <video ref={localVideoRef} autoPlay playsInline muted className="video-player local-video" />
                <div className="video-label">You</div>
                {!hasCamera && (
                    <div className="camera-prompt">
                        <button className="primary-btn" onClick={startCamera}>Start Camera</button>
                    </div>
                )}
                {hasCamera && (
                    <div className="local-controls" style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                        <button onClick={toggleAudio} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>
                            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} color="#ef4444" />}
                        </button>
                        <button onClick={toggleVideo} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>
                            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} color="#ef4444" />}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="video-wrapper remote-wrapper">
                <video ref={remoteVideoRef} autoPlay playsInline className="video-player remote-video" />
                <div className="video-label">Them</div>
                {!isConnected && (
                    <div className="camera-prompt overlay">
                        <p>Waiting for connection...</p>
                    </div>
                )}
            </div>
        </div>

        {!isConnected ? (
          <div className="setup-wizard">
            <div className="step-card fade-in">
              <h3>Join a Video Call Room</h3>
              <p>Start your camera, enter a room name, and connect.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <input
                  className="input-textarea"
                  type="text"
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
                  placeholder="Room Name (e.g. my-cool-room)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
                <button className="primary-btn" onClick={joinRoom} disabled={isConnecting || !roomName || !hasCamera}>
                  {isConnecting ? <span className="spinner"></span> : "Join Room"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-interface fade-in">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-indicator online"></span>
                <span className="status-text">Connected via WebRTC Video</span>
              </div>
              <button onClick={leaveRoom} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}>Leave Room</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
