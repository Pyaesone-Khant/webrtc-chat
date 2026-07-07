import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import { useAuthStore } from './useAuthStore'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string
}

export interface FriendRequest {
  id: string
  sender: Profile
}

interface FriendsState {
  friends: Profile[]
  friendRequests: FriendRequest[]
  searchResult: Profile | null
  isSearching: boolean
  isLoading: boolean
  searchEmail: string
  isSidebarOpen: boolean

  toggleSidebar: () => void
  setSearchEmail: (val: string) => void
  searchUserByEmail: () => Promise<void>
  clearSearch: () => void
  fetchFriendsAndRequests: () => Promise<void>
  sendFriendRequest: (friendId: string) => Promise<void>
  acceptRequest: (requestId: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  friendRequests: [],
  searchResult: null,
  isSearching: false,
  isLoading: false,
  searchEmail: '',
  isSidebarOpen: false,

  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
  setSearchEmail: (val) => set({ searchEmail: val, searchResult: null }),

  clearSearch: () => set({ searchEmail: '', searchResult: null, isSearching: false }),

  searchUserByEmail: async () => {
    const { searchEmail } = get()
    const { user } = useAuthStore.getState()
    if (!user || !searchEmail.trim()) return

    if (searchEmail.trim() === user.email) {
      alert("You cannot search yourself.")
      return
    }

    set({ isSearching: true, searchResult: null })

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim())
      .single()

    if (error || !data) {
      alert('User not found.')
    } else {
      set({ searchResult: data })
    }

    set({ isSearching: false })
  },

  fetchFriendsAndRequests: async () => {
    set({ isLoading: true })
    const { user } = useAuthStore.getState()
    if (!user) {
      set({ friends: [], friendRequests: [], isLoading: false })
      return
    }

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, status, user_id, friend_id, sender:profiles!friendships_user_id_fkey(*), receiver:profiles!friendships_friend_id_fkey(*)')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error('Error fetching friends:', error.message)
    } else {
      const friendsList: Profile[] = []
      const requestsList: FriendRequest[] = []

      friendships.forEach((f: any) => {
        if (f.status === 'accepted') {
          // Add the other person to friends list
          const friendProfile = f.user_id === user.id ? f.receiver : f.sender
          friendsList.push(friendProfile)
        } else if (f.status === 'pending') {
          // If I am the receiver, it's an incoming request
          if (f.friend_id === user.id) {
            requestsList.push({
              id: f.id,
              sender: f.sender
            })
          }
        }
      })

      set({ friends: friendsList, friendRequests: requestsList })
    }

    set({ isLoading: false })
  },

  sendFriendRequest: async (friendId: string) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    const { error } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: friendId, status: 'pending' }
      ])

    if (error) {
      if (error.code === '23505') {
        alert('Friend request already sent or you are already friends.')
      } else {
        console.error('Error sending friend request:', error.message)
        alert('Failed to send request.')
      }
    } else {
      get().clearSearch()
      alert('Friend request sent!')
      get().fetchFriendsAndRequests() // Refresh to potentially show it on our side if we need to see outgoing (though we don't display outgoing yet)
    }
  },

  acceptRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (error) {
      console.error('Error accepting request:', error.message)
    } else {
      get().fetchFriendsAndRequests()
    }
  },

  rejectRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Error rejecting request:', error.message)
    } else {
      get().fetchFriendsAndRequests()
    }
  }
}))
