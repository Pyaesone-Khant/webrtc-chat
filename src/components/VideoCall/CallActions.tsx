import { useNotificationStore } from '#/store/useNotificationStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useNavigate } from '@tanstack/react-router'
import { Phone, PhoneOff, X } from 'lucide-react'
import { Button } from '../common'

export default function CallActions() {
  const {
    leaveRoom,
    stopCamera,
    pendingCallFriendId,
    roomName,
    setCallStatus,
    joinRoom,
    hasCamera,
    callStatus,
    isConnected,
  } = useVideoCallStore()

  const navigate = useNavigate()

  const handleLeave = () => {
    leaveRoom()
    stopCamera()
    navigate({ to: '/' })
  }

  const handleCallNow = () => {
    if (pendingCallFriendId && roomName) {
      useNotificationStore
        .getState()
        .sendCall(pendingCallFriendId, roomName, 'video')
      setCallStatus('calling')
      joinRoom()
    }
  }

  const isPreviewState = pendingCallFriendId !== null && callStatus === null

  return (
    <div className="flex justify-center gap-3 absolute bottom-4">
      {isPreviewState ? (
        <>
          <Button
            onClick={handleLeave}
            size="icon"
            variant="danger"
            className="rounded-full size-14"
            title="Cancel"
          >
            <X size={24} />
          </Button>
          <Button
            onClick={handleCallNow}
            size="icon"
            variant="icon"
            className=" bg-green-600 hover:bg-green-700 size-14"
            disabled={!hasCamera}
            title="Call Now"
          >
            <Phone size={20} />
          </Button>
        </>
      ) : callStatus === 'calling' ? (
        <>
          <Button onClick={handleLeave} variant="danger">
            <PhoneOff size={16} /> End Call
          </Button>
        </>
      ) : callStatus === 'declined' ? (
        <div>Decline</div>
      ) : isConnected || callStatus === 'accepted' ? (
        <>
          <Button onClick={handleLeave} variant="danger">
            <PhoneOff size={16} /> End Call
          </Button>
        </>
      ) : null}
    </div>
  )
}
