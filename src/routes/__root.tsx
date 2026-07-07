import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { IncomingCallModal } from '../components/IncomingCallModal'
import { useAuthStore } from '../store/useAuthStore'

import { useNotificationStore } from '#/store/useNotificationStore'
import { useEffect } from 'react'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session, isLoading, initializeAuth, signInWithGoogle } =
    useAuthStore()

  const { initializeNotifications, cleanupNotifications } =
    useNotificationStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (session?.user) {
      initializeNotifications()
    } else {
      cleanupNotifications()
    }
  }, [session, initializeNotifications, cleanupNotifications])

  let content = children

  if (isLoading) {
    content = (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white font-sans">
        Loading...
      </div>
    )
  } else if (!session) {
    content = (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="text-center p-10 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800">
          <h1 className="text-3xl font-bold mb-4 bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Welcome to WebRTC App
          </h1>
          <p className="text-zinc-400 mb-8">
            Please sign in to start chatting and video calling.
          </p>
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center w-full px-5 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  } else {
    content = children
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {content}
        <IncomingCallModal />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
