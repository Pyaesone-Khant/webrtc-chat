import { useAuthStore } from '#/store/useAuthStore'
import { useChatStore } from '#/store/useChatStore'
import { useFriendsStore } from '#/store/useFriendsStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuthStore()

  const { isSidebarOpen, toggleSidebar } = useFriendsStore()

  useEffect(() => {
    const handleCallResponse = (e: Event) => {
      const customEvent = e as CustomEvent
      const { accepted } = customEvent.detail
      const { setCallStatus: setChatCallStatus } = useChatStore.getState()
      const { setCallStatus: setVideoCallStatus } = useVideoCallStore.getState()

      if (accepted) {
        setChatCallStatus('accepted')
        setVideoCallStatus('accepted')
      } else {
        setChatCallStatus('declined')
        setVideoCallStatus('declined')
      }
    }

    window.addEventListener('call_response_received', handleCallResponse)
    return () =>
      window.removeEventListener('call_response_received', handleCallResponse)
  }, [])

  return (
    <main className="flex flex-col h-screen bg-zinc-900">
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            className="p-2 -ml-2 text-zinc-300 hover:text-white rounded-md bg-zinc-800/50"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/">
            <h1 className="text-xl font-bold text-white tracking-tight">
              WebRTC<span className="text-blue-500">App</span>
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-zinc-700"
              />
            )}
          </div>
          <button
            onClick={signOut}
            className="px-3 py-1.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors border border-zinc-700"
          >
            Sign Out
          </button>
        </div>
      </header>
      <section className="flex-1 flex w-full overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
        <div className="flex-1 flex min-w-0 overflow-hidden">{children}</div>
      </section>
    </main>
  )
}
