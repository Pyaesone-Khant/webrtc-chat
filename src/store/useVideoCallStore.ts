import type { RealtimeChannel } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../utils/supabase'

interface VideoCallState {
  roomName: string
  isConnected: boolean
  isConnecting: boolean
  hasCamera: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean

  channel: RealtimeChannel | null
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

  channel: null,
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
    const { localStream, peerConnection, channel } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      channel: null,
      hasCamera: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isConnected: false,
      isConnecting: false,
      roomName: ''
    })
  },

  leaveRoom: () => {
    const { peerConnection, channel } = get()
    if (peerConnection) peerConnection.close()
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }

    set({
      peerConnection: null,
      channel: null,
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

    set({ isConnecting: true })

    const myUserId = Math.random().toString(36).substring(2, 15)
    const channel = supabase.channel(`video_${roomName}`, {
      config: {
        broadcast: { ack: false },
        presence: { key: myUserId },
      },
    })
    set({ channel })

    channel
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const isMe = newPresences.some(p => p.id === myUserId)
        if (isMe) return

        const { initPeerConnection } = get()
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

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

        alert('Peer has left the room.')
        const { peerConnection } = get()
        if (peerConnection) peerConnection.close()
        set({
          peerConnection: null,
          remoteStream: null,
          isConnected: false
        })
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

    set({ peerConnection: pc })
  }
}))
