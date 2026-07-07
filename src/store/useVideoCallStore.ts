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
  callStatus: 'calling' | 'declined' | 'accepted' | null
  pendingCallFriendId: string | null
  myUserId: string | null

  channel: RealtimeChannel | null
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null

  // Actions
  setRoomName: (val: string) => void
  setPendingCallFriendId: (id: string | null) => void
  setCallStatus: (status: 'calling' | 'declined' | 'accepted' | null) => void
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
  callStatus: null,
  pendingCallFriendId: null,
  myUserId: null,

  channel: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,

  setRoomName: (val) => set({ roomName: val }),
  setPendingCallFriendId: (val) => set({ pendingCallFriendId: val }),
  setCallStatus: (val) => {
    if (val === 'declined') {
      const { localStream, peerConnection } = get()
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (peerConnection) {
        peerConnection.close()
      }
    }
    set({ callStatus: val })
  },

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
      isConnected: false,
      isConnecting: false
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
      roomName: '',
      callStatus: null,
      pendingCallFriendId: null
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
    set({ myUserId })

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
              payload: { type: 'offer', data: peerConnection.localDescription, senderId: myUserId }
            })
          })
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const isMe = leftPresences.some(p => p.id === myUserId)
        if (isMe) return

        alert('Peer has left the call.')
        const { leaveRoom, stopCamera } = get()
        leaveRoom()
        stopCamera()
      })
      .on('broadcast', { event: 'signal' }, async (message) => {
        const { payload } = message
        if (payload.senderId === myUserId) return

        const { initPeerConnection } = get()
        initPeerConnection()
        const { peerConnection } = get()
        if (!peerConnection) return

        try {
          if (payload.type === 'offer') {
            const offerCollision = peerConnection.signalingState !== 'stable'
            const isPolite = myUserId < payload.senderId

            if (offerCollision && !isPolite) {
              return // Ignore the offer if we are not polite
            }

            if (offerCollision) {
              await Promise.all([
                peerConnection.setLocalDescription({ type: 'rollback' }),
                peerConnection.setRemoteDescription(payload.data)
              ])
            } else {
              await peerConnection.setRemoteDescription(payload.data)
            }

            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'answer', data: peerConnection.localDescription, senderId: myUserId }
            })
          } else if (payload.type === 'answer') {
            if (peerConnection.signalingState === 'have-local-offer') {
              await peerConnection.setRemoteDescription(payload.data)
            }
          } else if (payload.type === 'ice-candidate') {
            await peerConnection.addIceCandidate(payload.data)
          }
        } catch (err) {
          console.error('Error handling signaling message:', err)
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
      set({ remoteStream: event.streams[0] })
    }

    pc.onicecandidate = (event) => {
      const { channel, myUserId } = get()
      if (event.candidate && channel && myUserId) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'ice-candidate', data: event.candidate, senderId: myUserId }
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
