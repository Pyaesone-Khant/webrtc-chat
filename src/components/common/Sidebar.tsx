import { cn } from '#/utils/cn'
import { FriendsList } from '../FriendsList'

export function Sidebar({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <>
      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <FriendsList />
      </div>

      {/* Desktop Push Sidebar */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300 ease-in-out overflow-hidden',
          isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0',
        )}
      >
        <div className="w-80 h-full">
          <FriendsList />
        </div>
      </div>
    </>
  )
}
