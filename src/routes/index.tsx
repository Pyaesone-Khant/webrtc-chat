import { Chat } from '#/components'
import { Layout } from '#/components/common/Layout'
import { useChatStore } from '#/store/useChatStore'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { roomName } = useChatStore()

  return (
    <Layout>
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {roomName ? (
          <Chat />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center pt-20 md:pt-8">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a friend from the menu to start chatting</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
