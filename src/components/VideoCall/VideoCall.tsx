import { useEffect, useRef } from 'react'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import './VideoCall.css'

export function VideoCall() {
  const {
    localConnection,
    remoteConnection,
    isConnected,
    setupStep,
    isGathering,
    hasCamera,
    localStream,
    remoteStream,
    setRemoteConnection,
    setSetupStep,
    startCamera,
    stopCamera,
    createOffer,
    createAnswer,
    acceptAnswer,
  } = useVideoCallStore()

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localConnection)
  }

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
            <div className="setup-tabs">
              <button 
                className={`tab-btn ${setupStep === 1 ? 'active' : ''}`}
                onClick={() => setSetupStep(1)}
              >
                1. Host (Offer)
              </button>
              <button 
                className={`tab-btn ${setupStep === 2 ? 'active' : ''}`}
                onClick={() => setSetupStep(2)}
              >
                2. Join (Answer)
              </button>
              <button 
                className={`tab-btn ${setupStep === 3 ? 'active' : ''}`}
                onClick={() => setSetupStep(3)}
              >
                3. Connect
              </button>
            </div>

            <div className="setup-content">
              {setupStep === 1 && (
                <div className="step-card fade-in">
                  <h3>Start a New Call</h3>
                  <p>Generate an offer and share the connection string.</p>
                  <button className="primary-btn" onClick={createOffer} disabled={isGathering || !hasCamera}>
                    {isGathering ? <span className="spinner"></span> : "Generate Offer"}
                  </button>
                  {localConnection && !isGathering && (
                    <div className="connection-string-box">
                      <label>Your Connection String (Send this to Peer B):</label>
                      <div className="textarea-wrapper">
                        <textarea readOnly value={localConnection} rows={4} />
                        <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                           Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {setupStep === 2 && (
                <div className="step-card fade-in">
                  <h3>Join an Existing Call</h3>
                  <p>Paste the offer from Peer A to generate your answer.</p>
                  <textarea
                    className="input-textarea"
                    rows={4}
                    placeholder="Paste Peer A's offer here..."
                    value={remoteConnection}
                    onChange={(e) => setRemoteConnection(e.target.value)}
                  />
                  <button className="primary-btn" onClick={createAnswer} disabled={isGathering || !hasCamera}>
                    {isGathering ? <span className="spinner"></span> : "Generate Answer"}
                  </button>
                  {localConnection && !isGathering && (
                    <div className="connection-string-box">
                      <label>Your Answer String (Send this back to Peer A):</label>
                      <div className="textarea-wrapper">
                        <textarea readOnly value={localConnection} rows={4} />
                        <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                           Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {setupStep === 3 && (
                <div className="step-card fade-in">
                  <h3>Complete Connection</h3>
                  <p>Paste the answer from Peer B to finalize the connection.</p>
                  <textarea
                    className="input-textarea"
                    rows={4}
                    placeholder="Paste Peer B's answer here..."
                    value={remoteConnection}
                    onChange={(e) => setRemoteConnection(e.target.value)}
                  />
                  <button className="primary-btn success-btn" onClick={acceptAnswer}>Accept Answer & Connect</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-interface fade-in">
            <div className="chat-header">
              <span className="status-indicator online"></span>
              <span className="status-text">Connected via WebRTC Video</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
