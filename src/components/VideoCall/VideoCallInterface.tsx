import { useFriendsStore } from '#/store/useFriendsStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useEffect, useRef } from 'react'
import CallActions from './CallActions'
import { UserAvatar } from './UserAvatar'
import VideoControls from './VideoControls'

export function VideoCallInterface() {
  const {
    hasCamera,
    localStream,
    remoteStream,
    startCamera,
    pendingCallFriendId,
    callStatus,
  } = useVideoCallStore()

  const pendingCallFriend = useFriendsStore((state) =>
    state.friends.find((f) => f.id === pendingCallFriendId),
  );

  console.log("call status",callStatus)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  return (
    <section className="w-full h-full p-4 overflow-hidden relative">
      <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border border-zinc-800 ">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="video-player local-video"
        />

        {!hasCamera && (
          <div className="camera-prompt">
            <button className="primary-btn" onClick={startCamera}>
              Start Camera
            </button>
          </div>
        )}

        {/* calling state */}
        {callStatus === 'calling' && pendingCallFriend && (
          <div className=" absolute w-full h-full bg-black/50 backdrop-blur-md top-0 left-0 flex items-center justify-center">
            <UserAvatar {...pendingCallFriend} />
          </div>
        )}

        <VideoControls />
        <CallActions />
      </div>

      {remoteStream && (
        <div className="absolute top-8 right-8 z-50 bg-black/50 border border-black/20 max-w-60 rounded-2xl overflow-hidden shadow-black/20 shadow-sm">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-player aspect-video"
          />
        </div>
      )}
    </section>
  )
}
