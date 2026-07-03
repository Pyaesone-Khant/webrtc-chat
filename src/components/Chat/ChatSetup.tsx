import { useChatStore } from '#/store/useChatStore'

export function ChatSetup() {
  const {
    localConnection,
    remoteConnection,
    setupStep,
    isGathering,
    setRemoteConnection,
    setSetupStep,
    createOffer,
    createAnswer,
    acceptAnswer,
  } = useChatStore()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localConnection)
  }

  return (
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
            <h3>Start a New Chat</h3>
            <p>Generate an offer and share the connection string with your friend.</p>
            <button className="primary-btn" onClick={createOffer} disabled={isGathering}>
              {isGathering ? <span className="spinner"></span> : "Generate Offer"}
            </button>
            {localConnection && !isGathering && (
              <div className="connection-string-box">
                <label>Your Connection String (Send this to Peer B):</label>
                <div className="textarea-wrapper">
                  <textarea readOnly value={localConnection} rows={4} />
                  <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {setupStep === 2 && (
          <div className="step-card fade-in">
            <h3>Join an Existing Chat</h3>
            <p>Paste the offer from Peer A to generate your answer.</p>
            <textarea
              className="input-textarea"
              rows={4}
              placeholder="Paste Peer A's offer here..."
              value={remoteConnection}
              onChange={(e) => setRemoteConnection(e.target.value)}
            />
            <button className="primary-btn" onClick={createAnswer} disabled={isGathering}>
              {isGathering ? <span className="spinner"></span> : "Generate Answer"}
            </button>
            {localConnection && !isGathering && (
              <div className="connection-string-box">
                <label>Your Answer String (Send this back to Peer A):</label>
                <div className="textarea-wrapper">
                  <textarea readOnly value={localConnection} rows={4} />
                  <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
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
  )
}
