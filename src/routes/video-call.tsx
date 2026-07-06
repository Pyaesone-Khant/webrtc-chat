import { VideoCall, FriendsList } from '#/components'
import { createFileRoute } from '@tanstack/react-router'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useFriendsStore } from '#/store/useFriendsStore'
import { Video, Menu } from 'lucide-react'

export const Route = createFileRoute('/video-call')({
  component: RouteComponent,
})

function RouteComponent() {
  const { roomName } = useVideoCallStore()
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useFriendsStore()
  
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 w-80 flex-shrink-0 border-r border-zinc-800 bg-zinc-900 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <FriendsList />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 shadow-sm z-20 sticky top-0">
          <button 
            className="p-2 -ml-2 text-zinc-300 hover:text-white rounded-md bg-zinc-800/50" 
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-semibold text-white">Video Call</span>
        </div>
        {roomName ? (
          <VideoCall />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center pt-20 md:pt-8">
            <Video size={48} className="mb-4 opacity-20" />
            <p>Select a friend from the menu to start a video call</p>
          </div>
        )}
      </div>
    </div>
  )
}
