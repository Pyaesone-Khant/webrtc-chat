import { VideoCall } from '#/components'
import { Layout } from '#/components/common/Layout'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { createFileRoute } from '@tanstack/react-router'
import { Video } from 'lucide-react'

export const Route = createFileRoute('/video-call')({
  component: RouteComponent,
})

function RouteComponent() {
  const { roomName } = useVideoCallStore()

  console.log('room name: ', roomName)

  return (
    <Layout>
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        {roomName ? (
          <VideoCall />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-zinc-900">
            <Video size={48} className="mb-4 opacity-20" />
            <p>Select a friend from the menu to start a video call</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
