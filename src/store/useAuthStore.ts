import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../utils/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean

  initializeAuth: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  initializeAuth: () => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user || null, isLoading: false })
    })

    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null, isLoading: false })
    })
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error('Error logging in:', error.message)
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  }
}))
