import { useAuthStore } from '#/store/useAuthStore'
import { useChatStore } from '#/store/useChatStore'
import type { Profile } from '#/store/useFriendsStore'
import { useFriendsStore } from '#/store/useFriendsStore'
import { useNotificationStore } from '#/store/useNotificationStore'
import { useVideoCallStore } from '#/store/useVideoCallStore'
import { useNavigate } from '@tanstack/react-router'
import { Check, MessageSquare, Search, UserPlus, Video, X } from 'lucide-react'
import { useEffect } from 'react'

export function FriendsList() {
  const {
    friends,
    friendRequests,
    isLoading,
    fetchFriendsAndRequests,
    searchEmail,
    setSearchEmail,
    searchUserByEmail,
    searchResult,
    isSearching,
    clearSearch,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    toggleSidebar,
  } = useFriendsStore()

  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { sendCall } = useNotificationStore()

  useEffect(() => {
    fetchFriendsAndRequests()
  }, [fetchFriendsAndRequests])

  const startChat = (friend: Profile) => {
    if (!user) return
    const room = [user.id, friend.id].sort().join('_')
    useChatStore.setState({ roomName: room, callStatus: 'calling' })
    sendCall(friend.id, room, 'chat')
    toggleSidebar()

    navigate({ to: '/' }).then(() => {
      useChatStore.getState().joinRoom()
    })
  }

  const startVideoCall = (friend: Profile) => {
    if (!user) return
    const room = [user.id, friend.id].sort().join('_')
    useVideoCallStore.setState({
      roomName: room,
      pendingCallFriendId: friend.id,
      callStatus: null,
    })
    toggleSidebar()
    navigate({ to: '/video-call' })
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 border-r border-zinc-800 font-sans">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Friends</h2>
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white"
          onClick={() => toggleSidebar()}
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-4 border-b border-zinc-800">
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && searchUserByEmail()}
          />
          <button
            onClick={searchUserByEmail}
            disabled={!searchEmail.trim() || isSearching}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={
                  searchResult.avatar_url ||
                  `https://ui-avatars.com/api/?name=${searchResult.full_name || searchResult.email}`
                }
                alt={searchResult.full_name}
                className="w-8 h-8 rounded-full border border-zinc-700 flex-shrink-0"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">
                  {searchResult.full_name || 'No Name'}
                </div>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => sendFriendRequest(searchResult.id)}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                title="Send Friend Request"
              >
                <UserPlus size={16} />
              </button>
              <button
                onClick={clearSearch}
                className="p-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Pending Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900 sticky top-0">
              Pending Requests ({friendRequests.length})
            </div>
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 mx-2 my-1 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={
                      req.sender.avatar_url ||
                      `https://ui-avatars.com/api/?name=${req.sender.full_name || req.sender.email}`
                    }
                    alt={req.sender.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-sm font-medium text-white truncate">
                    {req.sender.full_name || req.sender.email}
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    title="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900 sticky top-0">
          My Friends ({friends.length})
        </div>

        {isLoading ? (
          <div className="p-4 text-zinc-500 text-sm text-center">
            Loading...
          </div>
        ) : friends.length === 0 ? (
          <div className="p-4 text-zinc-500 text-sm text-center">
            No friends yet. Add someone!
          </div>
        ) : (
          <div className="flex flex-col">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 group"
              >
                <img
                  src={
                    friend.avatar_url ||
                    `https://ui-avatars.com/api/?name=${friend.full_name || friend.email}`
                  }
                  alt={friend.full_name}
                  className="w-10 h-10 rounded-full border border-zinc-700"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">
                    {friend.full_name || 'No Name'}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {friend.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startChat(friend)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                    title="Chat"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    onClick={() => startVideoCall(friend)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                    title="Video Call"
                  >
                    <Video size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
