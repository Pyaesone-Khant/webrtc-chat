import { VideoCall } from '#/components'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/video-call')({
  component: RouteComponent,
})

function RouteComponent() {
  return <VideoCall />
}
