import { create } from 'zustand'

export type ChatMessage = {
  sender: 'you' | 'them'
  text: string
}

interface ChatState {
  localConnection: string
  remoteConnection: string
  chatMessages: ChatMessage[]
  messageInput: string
  isConnected: boolean
  setupStep: number
  isGathering: boolean
  
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null

  // Actions
  setLocalConnection: (val: string) => void
  setRemoteConnection: (val: string) => void
  setMessageInput: (val: string) => void
  setSetupStep: (val: number) => void

  initPeerConnection: () => void
  setupDataChannelListeners: () => void
  createOffer: () => Promise<void>
  createAnswer: () => Promise<void>
  acceptAnswer: () => Promise<void>
  sendMsg: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  localConnection: '',
  remoteConnection: '',
  chatMessages: [],
  messageInput: '',
  isConnected: false,
  setupStep: 1,
  isGathering: false,

  peerConnection: null,
  dataChannel: null,

  setLocalConnection: (val) => set({ localConnection: val }),
  setRemoteConnection: (val) => set({ remoteConnection: val }),
  setMessageInput: (val) => set({ messageInput: val }),
  setSetupStep: (val) => set({ setupStep: val }),

  initPeerConnection: () => {
    const { peerConnection } = get()
    if (peerConnection) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

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
    dataChannel.onopen = () => set({ isConnected: true })
  },

  createOffer: async () => {
    set({ isGathering: true })
    const { initPeerConnection } = get()
    initPeerConnection()

    const { peerConnection, setupDataChannelListeners } = get()
    if (!peerConnection) {
      set({ isGathering: false })
      return
    }

    const dc = peerConnection.createDataChannel('chat-channel')
    set({ dataChannel: dc })
    setupDataChannelListeners()

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    set({ setupStep: 1 })
  },

  createAnswer: async () => {
    set({ isGathering: true })
    const { initPeerConnection } = get()
    initPeerConnection()
    
    const { peerConnection, remoteConnection } = get()
    if (!peerConnection) {
      set({ isGathering: false })
      return
    }

    try {
      const offerObj = JSON.parse(remoteConnection)
      await peerConnection.setRemoteDescription(offerObj)

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
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
