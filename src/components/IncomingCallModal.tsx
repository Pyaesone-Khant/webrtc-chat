import { useChatStore } from '#/store/useChatStore'
import { useNotificationStore } from '#/store/useNotificationStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useNavigate } from '@tanstack/react-router'
import { MessageSquare, Phone, PhoneOff } from 'lucide-react'
import { useEffect } from 'react'

export function IncomingCallModal() {
  const { incomingCall, setIncomingCall, sendCallResponse } =
    useNotificationStore()
  const { setRoomName: setChatRoomName, joinRoom: joinChatRoom } =
    useChatStore()
  const { setRoomName: setVideoRoomName } = useVideoCallStore()
  const navigate = useNavigate()

  // Play a ringing sound when modal is shown
  useEffect(() => {
    let ctx: AudioContext | null = null
    let intervalId: number | undefined

    if (incomingCall) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
        ctx = new AudioContextClass()

        const playRing = () => {
          if (!ctx) return
          const osc1 = ctx.createOscillator()
          const osc2 = ctx.createOscillator()
          const gain = ctx.createGain()

          osc1.frequency.value = 440 // A4
          osc2.frequency.value = 480 // Slightly detuned for classic phone sound

          osc1.connect(gain)
          osc2.connect(gain)
          gain.connect(ctx.destination)

          const now = ctx.currentTime

          // Classic double-ring pattern
          // Ring 1
          gain.gain.setValueAtTime(0, now)
          gain.gain.linearRampToValueAtTime(0.1, now + 0.05)
          gain.gain.setValueAtTime(0.1, now + 0.35)
          gain.gain.linearRampToValueAtTime(0, now + 0.4)

          // Ring 2
          gain.gain.setValueAtTime(0, now + 0.6)
          gain.gain.linearRampToValueAtTime(0.1, now + 0.65)
          gain.gain.setValueAtTime(0.1, now + 0.95)
          gain.gain.linearRampToValueAtTime(0, now + 1.0)

          osc1.start(now)
          osc2.start(now)
          osc1.stop(now + 1.1)
          osc2.stop(now + 1.1)
        }

        playRing()
        intervalId = window.setInterval(playRing, 3000) // Repeat every 3 seconds
      } catch (err) {
        console.warn('Audio ringing not supported or blocked by browser', err)
      }
    }

    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId)
      if (ctx) ctx.close().catch(() => {})
    }
  }, [incomingCall])

  if (!incomingCall) return null

  const handleAccept = () => {
    sendCallResponse(incomingCall.caller.id, true)

    if (incomingCall.type === 'chat') {
      setChatRoomName(incomingCall.roomName)
      navigate({ to: '/' }).then(() => {
        joinChatRoom()
      })
    } else {
      setVideoRoomName(incomingCall.roomName)
      navigate({ to: '/video-call' })
    }

    setIncomingCall(null)
  }

  const handleDecline = () => {
    sendCallResponse(incomingCall.caller.id, false)
    setIncomingCall(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
          <img
            src={
              incomingCall.caller.avatar_url ||
              `https://ui-avatars.com/api/?name=${incomingCall.caller.full_name || incomingCall.caller.email}`
            }
            alt={incomingCall.caller.full_name}
            className="w-24 h-24 rounded-full border-4 border-zinc-800 relative z-10"
          />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {incomingCall.caller.full_name || incomingCall.caller.email}
        </h3>
        <p className="text-zinc-400 mb-8 flex items-center gap-2 justify-center">
          {incomingCall.type === 'chat' ? (
            <MessageSquare size={16} />
          ) : (
            <Phone size={16} />
          )}
          Incoming{' '}
          {incomingCall.type === 'chat' ? 'Chat Request' : 'Video Call'}...
        </p>

        <div className="flex gap-4 w-full">
          <button
            onClick={handleDecline}
            className="flex-1 py-3 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <PhoneOff size={20} /> Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all font-semibold flex items-center justify-center gap-2"
          >
            <Phone
              size={20}
              className={incomingCall.type === 'video' ? '' : 'hidden'}
            />
            <MessageSquare
              size={20}
              className={incomingCall.type === 'chat' ? '' : 'hidden'}
            />
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
