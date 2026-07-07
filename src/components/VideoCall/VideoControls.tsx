import { useVideoCallStore } from '#/store/useVideoCallStore'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Button } from '../common'

export default function VideoControls() {
  const { toggleAudio, toggleVideo, isAudioEnabled, isVideoEnabled } =
    useVideoCallStore()

  return (
    <div className="absolute bottom-4 left-4 flex flex-row gap-2 z-10">
      <Button onClick={toggleAudio} size="icon" variant="icon">
        {isAudioEnabled ? (
          <Mic size={20} />
        ) : (
          <MicOff size={20} color="#ef4444" />
        )}
      </Button>
      <Button onClick={toggleVideo} variant="icon" size="icon">
        {isVideoEnabled ? (
          <Video size={20} />
        ) : (
          <VideoOff size={20} color="#ef4444" />
        )}
      </Button>
    </div>
  )
}
