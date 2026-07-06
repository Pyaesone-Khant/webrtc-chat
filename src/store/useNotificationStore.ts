import type { RealtimeChannel } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import { useAuthStore } from './useAuthStore'
import type { Profile } from './useFriendsStore'

export interface IncomingCall {
  caller: Profile
  roomName: string
  type: 'chat' | 'video'
}

interface NotificationState {
  channel: RealtimeChannel | null
  incomingCall: IncomingCall | null

  initializeNotifications: () => void
  cleanupNotifications: () => void
  setIncomingCall: (call: IncomingCall | null) => void

  sendCall: (friendId: string, roomName: string, type: 'chat' | 'video') => Promise<void>
  sendCallResponse: (callerId: string, accepted: boolean) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  channel: null,
  incomingCall: null,

  initializeNotifications: () => {
    const { user } = useAuthStore.getState()
    if (!user) return

    const { channel: existingChannel } = get()
    if (existingChannel) {
      existingChannel.unsubscribe()
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase.channel(`user_${user.id}`, {
      config: { broadcast: { ack: false } }
    })

    channel.on('broadcast', { event: 'incoming_call' }, async (message) => {
      const { callerId, roomName, type } = message.payload

      // Fetch caller profile info to display
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', callerId)
        .single()

      if (callerProfile) {
        set({ incomingCall: { caller: callerProfile, roomName, type } })
      }
    })

    channel.on('broadcast', { event: 'call_response' }, (message) => {
      const { accepted } = message.payload
      // We will dispatch a custom DOM event so the specific chat/video store can react
      window.dispatchEvent(new CustomEvent('call_response_received', { detail: { accepted } }))
    })

    channel.subscribe()
    set({ channel })
  },

  cleanupNotifications: () => {
    const { channel } = get()
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
    set({ channel: null, incomingCall: null })
  },

  setIncomingCall: (call) => set({ incomingCall: call }),

  sendCall: async (friendId, roomName, type) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    // We send a broadcast to the friend's personal channel
    const friendChannel = supabase.channel(`user_${friendId}`)
    friendChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await friendChannel.send({
          type: 'broadcast',
          event: 'incoming_call',
          payload: { callerId: user.id, roomName, type }
        })
        supabase.removeChannel(friendChannel) // Cleanup temp channel reference
      }
    })
  },

  sendCallResponse: async (callerId, accepted) => {
    // Reply back to caller's personal channel
    const callerChannel = supabase.channel(`user_${callerId}`)
    callerChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await callerChannel.send({
          type: 'broadcast',
          event: 'call_response',
          payload: { accepted }
        })
        supabase.removeChannel(callerChannel)
      }
    })
  }
}))
