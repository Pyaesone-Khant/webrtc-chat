import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'

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

  channel: RealtimeChannel | null
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

  channel: null,
  peerConnection: null,
  dataChannel: null,

  setRoomName: (val) => set({ roomName: val }),
  setMessageInput: (val) => set({ messageInput: val }),

  leaveRoom: () => {
    const { peerConnection, channel, dataChannel } = get()
    if (dataChannel) dataChannel.close()
    if (peerConnection) peerConnection.close()
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
    set({
      isConnected: false,
      isConnecting: false,
      roomName: '',
      chatMessages: [],
      peerConnection: null,
      dataChannel: null,
      channel: null
    })
  },

  joinRoom: () => {
    const { roomName } = get()
    if (!roomName) return

    set({ isConnecting: true })

    const myUserId = Math.random().toString(36).substring(2, 15)
    const channel = supabase.channel(`chat_${roomName}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: myUserId },
      },
    })

    set({ channel })

    channel
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Check if the joined presence is us
        const isMe = newPresences.some(p => p.id === myUserId)
        if (isMe) return // Don't create offer for ourselves

        const { initPeerConnection, setupDataChannelListeners } = get()
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        const dc = peerConnection.createDataChannel('chat-channel')
        set({ dataChannel: dc })
        setupDataChannelListeners()

        peerConnection.createOffer().then(offer => {
          return peerConnection.setLocalDescription(offer).then(() => {
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'offer', data: peerConnection.localDescription }
            })
          })
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
         const isMe = leftPresences.some(p => p.id === myUserId)
         if (isMe) return

         const { peerConnection, dataChannel } = get()
         if (dataChannel) dataChannel.close()
         if (peerConnection) peerConnection.close()
         set((state) => ({
           chatMessages: [...state.chatMessages, { sender: 'system', text: 'Peer has left the room.' }],
           peerConnection: null,
           dataChannel: null,
           isConnected: false
         }))
      })
      .on('broadcast', { event: 'signal' }, async (message) => {
        const { payload } = message
        const { initPeerConnection } = get()
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        if (payload.type === 'offer') {
          await peerConnection.setRemoteDescription(payload.data)
          const answer = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(answer)

          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', data: peerConnection.localDescription }
          })
        } else if (payload.type === 'answer') {
          await peerConnection.setRemoteDescription(payload.data)
        } else if (payload.type === 'ice-candidate') {
          await peerConnection.addIceCandidate(payload.data)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: myUserId })
        }
      })
  },

  initPeerConnection: () => {
    const { peerConnection } = get()
    if (peerConnection) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    pc.onicecandidate = (event) => {
      const { channel } = get()
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'ice-candidate', data: event.candidate }
        })
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
