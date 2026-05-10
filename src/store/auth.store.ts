import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Admin } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  admin: Admin | null
  isAuthenticated: boolean
  isAdmin: boolean
  _hasHydrated: boolean

  setToken: (token: string) => void
  setUser: (user: User) => void
  setAdmin: (admin: Admin) => void
  setHasHydrated: (val: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      admin: null,
      isAuthenticated: false,
      isAdmin: false,
      _hasHydrated: false,

      setToken: (token) => set({ token, isAuthenticated: true }),
      setUser: (user) => set({ user, isAdmin: false }),
      setAdmin: (admin) => set({ admin, isAdmin: true }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      logout: () => set({
        token: null,
        user: null,
        admin: null,
        isAuthenticated: false,
        isAdmin: false,
      }),
    }),
    {
      name: 'cakrana-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { 
        state?.setHasHydrated(true)
      },
    }
  )
)