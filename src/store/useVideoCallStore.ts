import { create } from 'zustand'

interface VideoCallState {
  localConnection: string
  remoteConnection: string
  isConnected: boolean
  setupStep: number
  isGathering: boolean
  hasCamera: boolean
  
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null

  // Actions
  setRemoteConnection: (val: string) => void
  setSetupStep: (val: number) => void

  startCamera: () => Promise<void>
  stopCamera: () => void
  initPeerConnection: () => void
  createOffer: () => Promise<void>
  createAnswer: () => Promise<void>
  acceptAnswer: () => Promise<void>
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  localConnection: '',
  remoteConnection: '',
  isConnected: false,
  setupStep: 1,
  isGathering: false,
  hasCamera: false,

  peerConnection: null,
  localStream: null,
  remoteStream: null,

  setRemoteConnection: (val) => set({ remoteConnection: val }),
  setSetupStep: (val) => set({ setupStep: val }),

  startCamera: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      set({ localStream: stream, hasCamera: true })
    } catch (err) {
      console.error('Error accessing media devices.', err)
      alert('Could not access camera/microphone. Please allow permissions.')
    }
  },

  stopCamera: () => {
    const { localStream, peerConnection } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      hasCamera: false,
      isConnected: false,
      localConnection: '',
      remoteConnection: '',
      setupStep: 1,
    })
  },

  initPeerConnection: () => {
    const { peerConnection, localStream } = get()
    if (peerConnection) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    pc.ontrack = (event) => {
      set((state) => {
        let stream = state.remoteStream
        if (!stream) stream = new MediaStream()
        stream.addTrack(event.track)
        // Clone stream reference so React/Zustand detects change
        return { remoteStream: new MediaStream(stream.getTracks()) }
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate === null) {
        set({
          localConnection: JSON.stringify(pc.localDescription),
          isGathering: false
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        set({ isConnected: true })
      }
    }

    set({ peerConnection: pc })
  },

  createOffer: async () => {
    const { hasCamera } = get()
    if (!hasCamera) {
      alert("Please start the camera first!")
      return
    }

    set({ isGathering: true })
    const { initPeerConnection } = get()
    initPeerConnection()

    const { peerConnection } = get()
    if (!peerConnection) {
      set({ isGathering: false })
      return
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    set({ setupStep: 1 })
  },

  createAnswer: async () => {
    const { hasCamera, remoteConnection } = get()
    if (!hasCamera) {
      alert("Please start the camera first!")
      return
    }

    set({ isGathering: true })
    const { initPeerConnection } = get()
    initPeerConnection()

    const { peerConnection } = get()
    if (!peerConnection) {
      set({ isGathering: false })
      return
    }

    try {
      const offerObj = JSON.parse(remoteConnection)
      await peerConnection.setRemoteDescription(offerObj)

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      set({ setupStep: 2 })
    } catch (e) {
      console.error("Invalid offer string", e)
      alert("Invalid offer string!")
      set({ isGathering: false })
    }
  },

  acceptAnswer: async () => {
    const { peerConnection, remoteConnection } = get()
    if (!peerConnection) return

    try {
      const answerObj = JSON.parse(remoteConnection)
      await peerConnection.setRemoteDescription(answerObj)
    } catch (e) {
      console.error("Invalid answer string", e)
      alert("Invalid answer string!")
    }
  }
}))
