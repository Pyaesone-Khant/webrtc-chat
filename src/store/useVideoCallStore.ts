import { create } from 'zustand'

interface VideoCallState {
  roomName: string
  isConnected: boolean
  isConnecting: boolean
  hasCamera: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  
  socket: WebSocket | null
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null

  // Actions
  setRoomName: (val: string) => void
  startCamera: () => Promise<void>
  stopCamera: () => void
  toggleVideo: () => void
  toggleAudio: () => void
  
  joinRoom: () => void
  leaveRoom: () => void
  initPeerConnection: () => void
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  roomName: '',
  isConnected: false,
  isConnecting: false,
  hasCamera: false,
  isVideoEnabled: true,
  isAudioEnabled: true,

  socket: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,

  setRoomName: (val) => set({ roomName: val }),

  startCamera: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      set({ localStream: stream, hasCamera: true, isVideoEnabled: true, isAudioEnabled: true })
    } catch (err) {
      console.error('Error accessing media devices.', err)
      alert('Could not access camera/microphone. Please allow permissions.')
    }
  },

  stopCamera: () => {
    const { localStream, peerConnection, socket } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    if (socket) {
      socket.close()
    }
    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      socket: null,
      hasCamera: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isConnected: false,
      isConnecting: false,
      roomName: ''
    })
  },

  leaveRoom: () => {
    const { peerConnection, socket } = get()
    if (peerConnection) peerConnection.close()
    if (socket) socket.close()
    
    set({
      peerConnection: null,
      socket: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      roomName: ''
    })
  },

  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled)
      set({ isVideoEnabled: !isVideoEnabled })
    }
  },

  toggleAudio: () => {
    const { localStream, isAudioEnabled } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !isAudioEnabled)
      set({ isAudioEnabled: !isAudioEnabled })
    }
  },

  joinRoom: () => {
    const { roomName, hasCamera } = get()
    if (!roomName) return
    if (!hasCamera) {
      alert("Please start the camera first!")
      return
    }

    const ws = new WebSocket(`ws://${window.location.hostname}:8080`)
    set({ socket: ws, isConnecting: true })

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', room: roomName }))
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      const { socket, initPeerConnection } = get()

      if (msg.type === 'peer-joined') {
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        
        socket?.send(JSON.stringify({
          type: 'signal',
          payload: { type: 'offer', data: peerConnection.localDescription }
        }))
      } else if (msg.type === 'signal') {
        const { payload } = msg
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        if (payload.type === 'offer') {
          await peerConnection.setRemoteDescription(payload.data)
          const answer = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(answer)
          
          socket?.send(JSON.stringify({
            type: 'signal',
            payload: { type: 'answer', data: peerConnection.localDescription }
          }))
        } else if (payload.type === 'answer') {
          await peerConnection.setRemoteDescription(payload.data)
        } else if (payload.type === 'ice-candidate') {
          await peerConnection.addIceCandidate(payload.data)
        }
      } else if (msg.type === 'peer-left') {
        alert('Peer has left the room.')
        const { peerConnection } = get()
        if (peerConnection) peerConnection.close()
        set({
          peerConnection: null,
          remoteStream: null,
          isConnected: false
        })
      }
    }
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
        return { remoteStream: new MediaStream(stream.getTracks()) }
      })
    }

    pc.onicecandidate = (event) => {
      const { socket } = get()
      if (event.candidate && socket && socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: 'signal',
          payload: { type: 'ice-candidate', data: event.candidate }
        }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        set({ isConnected: true, isConnecting: false })
      }
    }

    set({ peerConnection: pc })
  }
}))
