import { create } from 'zustand'

export type ChatMessage = {
  sender: 'you' | 'them' | 'system'
  text: string
}

interface ChatState {
  roomName: string
  chatMessages: ChatMessage[]
  messageInput: string
  isConnected: boolean
  isConnecting: boolean

  socket: WebSocket | null
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null

  // Actions
  setRoomName: (val: string) => void
  setMessageInput: (val: string) => void

  joinRoom: () => void
  leaveRoom: () => void
  initPeerConnection: () => void
  setupDataChannelListeners: () => void
  sendMsg: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  roomName: '',
  chatMessages: [],
  messageInput: '',
  isConnected: false,
  isConnecting: false,

  socket: null,
  peerConnection: null,
  dataChannel: null,

  setRoomName: (val) => set({ roomName: val }),
  setMessageInput: (val) => set({ messageInput: val }),

  leaveRoom: () => {
    const { peerConnection, socket, dataChannel } = get()
    if (dataChannel) dataChannel.close()
    if (peerConnection) peerConnection.close()
    if (socket) socket.close()
    set({
      isConnected: false,
      isConnecting: false,
      roomName: '',
      chatMessages: [],
      peerConnection: null,
      dataChannel: null,
      socket: null
    })
  },

  joinRoom: () => {
    const { roomName } = get()
    if (!roomName) return

    const ws = new WebSocket(`ws://${window.location.hostname}:8080`)
    set({ socket: ws, isConnecting: true })

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', room: roomName }))
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      const { socket, initPeerConnection, setupDataChannelListeners } = get()

      if (msg.type === 'peer-joined') {
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        const dc = peerConnection.createDataChannel('chat-channel')
        set({ dataChannel: dc })
        setupDataChannelListeners()

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
        const { peerConnection, dataChannel } = get()
        if (dataChannel) dataChannel.close()
        if (peerConnection) peerConnection.close()
        set((state) => ({
          chatMessages: [...state.chatMessages, { sender: 'system', text: 'Peer has left the room.' }],
          peerConnection: null,
          dataChannel: null,
          isConnected: false
        }))
      }
    }
  },

  initPeerConnection: () => {
    const { peerConnection } = get()
    if (peerConnection) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

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

    pc.ondatachannel = (event) => {
      set({ dataChannel: event.channel })
      const { setupDataChannelListeners } = get()
      setupDataChannelListeners()
    }

    set({ peerConnection: pc })
  },

  setupDataChannelListeners: () => {
    const { dataChannel } = get()
    if (!dataChannel) return

    dataChannel.onmessage = (event) => {
      set((state) => ({
        chatMessages: [...state.chatMessages, { sender: 'them', text: event.data }]
      }))
    }
    dataChannel.onopen = () => set({ isConnected: true, isConnecting: false })
  },

  sendMsg: () => {
    const { dataChannel, messageInput, chatMessages } = get()
    if (dataChannel && dataChannel.readyState === 'open' && messageInput.trim()) {
      dataChannel.send(messageInput)
      set({
        chatMessages: [...chatMessages, { sender: 'you', text: messageInput }],
        messageInput: ''
      })
    }
  }
}))
