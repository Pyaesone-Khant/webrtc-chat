import { useNotificationStore } from '#/store/useNotificationStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useNavigate } from '@tanstack/react-router'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import './VideoCall.css'
import { VideoCallInterface } from './VideoCallInterface'

export function VideoCall() {
  const {
    roomName,
    isConnected,
    isConnecting,
    callStatus,
    pendingCallFriendId,
    hasCamera,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    setCallStatus,
    startCamera,
    stopCamera,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
  } = useVideoCallStore()
  const navigate = useNavigate()

  const handleLeave = () => {
    leaveRoom()
    stopCamera()
    navigate({ to: '/' })
  }

  const handleCallNow = () => {
    if (pendingCallFriendId && roomName) {
      useNotificationStore
        .getState()
        .sendCall(pendingCallFriendId, roomName, 'video')
      setCallStatus('calling')
      joinRoom()
    }
  }

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

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

  // Automatically start camera
  // Auto-join room ONLY IF it's not a pending call that needs confirmation
  useEffect(() => {
    if (roomName && !isConnected && !isConnecting && !hasCamera) {
      startCamera().then(() => {
        if (!pendingCallFriendId && !callStatus) {
          // If there's no pending friend ID (meaning they accepted an incoming call) we auto join
          joinRoom()
        }
      })
    }
  }, [
    roomName,
    isConnected,
    isConnecting,
    hasCamera,
    startCamera,
    joinRoom,
    pendingCallFriendId,
    callStatus,
  ])

  if (callStatus === 'declined') {
    return (
      <div className="video-container h-full w-full flex items-center justify-center fade-in">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">Call Declined</h3>
          <button
            onClick={handleLeave}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-none px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Return to Friends
          </button>
        </div>
      </div>
    )
  }

  const isPreviewState = pendingCallFriendId !== null && callStatus === null

  return (
    <section className="fade-in flex-1 flex h-full w-full overflow-hidden">
      <VideoCallInterface />
    </section>
  )

  return (
    <div className="fade-in">
      <VideoCallInterface />
      <div className="video-glass-panel">
        <div className="video-grid">
          <div className="video-wrapper local-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-player local-video"
            />
            <div className="video-label">You</div>
            {!hasCamera && (
              <div className="camera-prompt">
                <button className="primary-btn" onClick={startCamera}>
                  Start Camera
                </button>
              </div>
            )}
            {hasCamera && (
              <div
                className="local-controls"
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                  zIndex: 10,
                }}
              >
                <button
                  onClick={toggleAudio}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')
                  }
                >
                  {isAudioEnabled ? (
                    <Mic size={20} />
                  ) : (
                    <MicOff size={20} color="#ef4444" />
                  )}
                </button>
                <button
                  onClick={toggleVideo}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')
                  }
                >
                  {isVideoEnabled ? (
                    <Video size={20} />
                  ) : (
                    <VideoOff size={20} color="#ef4444" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="video-wrapper remote-wrapper">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-player remote-video"
            />
            <div className="video-label">Them</div>
            {!isConnected && (
              <div className="camera-prompt overlay text-center">
                <p>
                  {isPreviewState
                    ? 'Ready to call?'
                    : callStatus === 'calling'
                      ? 'Waiting for them to answer...'
                      : 'Waiting for connection...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {isPreviewState ? (
          <div className="mt-6 flex justify-center gap-6">
            <button
              onClick={handleLeave}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border-none px-8 py-3 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2 text-lg"
            >
              <PhoneOff size={24} /> Cancel
            </button>
            <button
              onClick={handleCallNow}
              disabled={!hasCamera}
              className="bg-green-600 hover:bg-green-700 text-white border-none px-8 py-3 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50 text-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            >
              <Phone size={24} /> Call Now
            </button>
          </div>
        ) : callStatus === 'calling' ? (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleLeave}
              className="bg-red-500 hover:bg-red-600 text-white border-none px-8 py-3 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2 text-lg"
            >
              <PhoneOff size={24} /> Cancel Call
            </button>
          </div>
        ) : isConnected || callStatus === 'accepted' ? (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleLeave}
              className="bg-red-500 hover:bg-red-600 text-white border-none px-8 py-3 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2 text-lg"
            >
              <PhoneOff size={24} /> End Call
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
