import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Admin } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  admin: Admin | null
  isAuthenticated: boolean
  isAdmin: boolean
  _hasHydrated: boolean  // ← TAMBAH INI

  setToken: (token: string) => void
  setUser: (user: User) => void
  setAdmin: (admin: Admin) => void
  setHasHydrated: (val: boolean) => void  // ← TAMBAH INI
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
      _hasHydrated: false,  // ← TAMBAH INI

      setToken: (token) => set({ token, isAuthenticated: true }),
      setUser: (user) => set({ user, isAdmin: false }),
      setAdmin: (admin) => set({ admin, isAdmin: true }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),  // ← TAMBAH INI
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
      onRehydrateStorage: () => (state) => {  // ← TAMBAH INI
        state?.setHasHydrated(true)
      },
    }
  )
)