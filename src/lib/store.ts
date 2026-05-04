import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EffectKey = 'particles' | 'pulse' | 'wave' | 'ripple' | 'aurora' | 'neon' | 'meteor' | 'breathing' | 'shimmer' | 'orbit'

export interface EffectColor {
  name: string
  value: string
  glow: string
}

export interface CartItem {
  productId: string
  productName: string
  productPrice: number
  quantity: number
  productStock: number
  productCategory: string
  productBrand: string
}

interface AppState {
  userId: string | null
  username: string | null
  membershipLevel: string
  points: number
  walletBalance: number
  checkInStreak: number
  isNewUser: boolean
  newUserDaysLeft: number
  currentView: string
  globalEffect: EffectKey | null
  globalEffectColor: EffectColor
  showAuthDialog: boolean
  cart: CartItem[]
  buttonColor: string
  appBackgroundColor: string
  isDeveloper: boolean
  isPrimaryDeveloper: boolean
  isDeveloperManager: boolean
  isFrozen: boolean
  frozenReason: string | null
  isBanned: boolean
  bannedReason: string | null
  isHighRisk: boolean
  highRiskReason: string | null
  emailVerified: boolean
  chatFriendId: string | null
  chatFriendName: string | null
  setChatFriend: (id: string, name: string) => void
  setUserId: (id: string | null) => void
  setUsername: (name: string | null) => void
  setMembershipLevel: (level: string) => void
  setPoints: (points: number) => void
  setWalletBalance: (balance: number) => void
  setCheckInStreak: (streak: number) => void
  setIsNewUser: (val: boolean) => void
  setNewUserDaysLeft: (days: number) => void
  setIsDeveloper: (val: boolean) => void
  setIsPrimaryDeveloper: (val: boolean) => void
  setIsDeveloperManager: (val: boolean) => void
  setIsFrozen: (val: boolean) => void
  setFrozenReason: (reason: string | null) => void
  setIsBanned: (val: boolean) => void
  setBannedReason: (reason: string | null) => void
  setIsHighRisk: (val: boolean) => void
  setHighRiskReason: (reason: string | null) => void
  setEmailVerified: (val: boolean) => void
  setCurrentView: (view: string) => void
  setGlobalEffect: (effect: EffectKey | null) => void
  setGlobalEffectColor: (color: EffectColor) => void
  setShowAuthDialog: (val: boolean) => void
  setButtonColor: (color: string) => void
  setAppBackgroundColor: (color: string) => void
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: null,
      membershipLevel: 'copper',
      points: 0,
      walletBalance: 0,
      checkInStreak: 0,
      isNewUser: true,
      newUserDaysLeft: 2,
      currentView: 'home',
      globalEffect: null,
      globalEffectColor: { name: '翡翠绿', value: '#10b981', glow: '#34d399' },
      showAuthDialog: false,
      cart: [],
      buttonColor: '#10b981',
      appBackgroundColor: '#ffffff',
      isDeveloper: false,
      isPrimaryDeveloper: false,
      isDeveloperManager: false,
      isFrozen: false,
      frozenReason: null,
      isBanned: false,
      bannedReason: null,
      isHighRisk: false,
      highRiskReason: null,
      emailVerified: false,
      chatFriendId: null,
      chatFriendName: null,

      setChatFriend: (id, name) => set({ chatFriendId: id, chatFriendName: name }),
      setUserId: (id) => set({ userId: id }),
      setUsername: (name) => set({ username: name }),
      setMembershipLevel: (level) => set({ membershipLevel: level }),
      setPoints: (points) => set({ points }),
      setWalletBalance: (balance) => set({ walletBalance: balance }),
      setCheckInStreak: (streak) => set({ checkInStreak: streak }),
      setIsNewUser: (val) => set({ isNewUser: val }),
      setNewUserDaysLeft: (days) => set({ newUserDaysLeft: days }),
      setIsDeveloper: (val) => set({ isDeveloper: val }),
      setIsPrimaryDeveloper: (val) => set({ isPrimaryDeveloper: val }),
      setIsDeveloperManager: (val) => set({ isDeveloperManager: val }),
      setIsFrozen: (val) => set({ isFrozen: val }),
      setFrozenReason: (reason) => set({ frozenReason: reason }),
      setIsBanned: (val) => set({ isBanned: val }),
      setBannedReason: (reason) => set({ bannedReason: reason }),
      setIsHighRisk: (val) => set({ isHighRisk: val }),
      setHighRiskReason: (reason) => set({ highRiskReason: reason }),
      setEmailVerified: (val) => set({ emailVerified: val }),
      setCurrentView: (view) => set({ currentView: view }),
      setGlobalEffect: (effect) => set({ globalEffect: effect }),
      setGlobalEffectColor: (color) => set({ globalEffectColor: color }),
      setShowAuthDialog: (val) => set({ showAuthDialog: val }),
      setButtonColor: (color) => set({ buttonColor: color }),
      setAppBackgroundColor: (color) => set({ appBackgroundColor: color }),

      addToCart: (item) => {
        const { cart } = get()
        const existing = cart.find(c => c.productId === item.productId)
        if (existing) {
          const newQty = Math.min(existing.quantity + 1, item.productStock)
          set({
            cart: cart.map(c =>
              c.productId === item.productId
                ? { ...c, quantity: newQty }
                : c
            ),
          })
        } else {
          set({ cart: [...cart, { ...item, quantity: 1 }] })
        }
      },

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter(c => c.productId !== productId) })
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ cart: get().cart.filter(c => c.productId !== productId) })
        } else {
          set({
            cart: get().cart.map(c =>
              c.productId === productId ? { ...c, quantity } : c
            ),
          })
        }
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)
      },

      getCartCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0)
      },

      logout: () => {
        localStorage.removeItem('userId')
        set({
          userId: null,
          username: null,
          membershipLevel: 'copper',
          points: 0,
          walletBalance: 0,
          checkInStreak: 0,
          isNewUser: true,
          newUserDaysLeft: 2,
          isDeveloper: false,
          isPrimaryDeveloper: false,
          isDeveloperManager: false,
          isFrozen: false,
          frozenReason: null,
          isBanned: false,
          bannedReason: null,
          isHighRisk: false,
          highRiskReason: null,
          emailVerified: false,
          chatFriendId: null,
          chatFriendName: null,
          currentView: 'home',
          globalEffect: null,
          globalEffectColor: { name: '翡翠绿', value: '#10b981', glow: '#34d399' },
          showAuthDialog: false,
          cart: [],
          buttonColor: '#10b981',
          appBackgroundColor: '#ffffff',
        })
      },

      refreshUser: async () => {
        const { userId } = get()
        if (!userId) return
        try {
          const res = await fetch(`/api/users/${userId}?t=${Date.now()}`)
          if (res.ok) {
            const data = await res.json()
            set({
              username: data.username,
              membershipLevel: data.membershipLevel || 'copper',
              points: data.points || 0,
              walletBalance: data.walletBalance || 0,
              checkInStreak: data.checkInStreak || 0,
              isNewUser: data.isNewUser ?? true,
              newUserDaysLeft: data.newUserDaysLeft ?? 7,
              isDeveloper: data.isDeveloper ?? false,
              isPrimaryDeveloper: data.isPrimaryDeveloper ?? false,
              isDeveloperManager: data.isDeveloperManager ?? false,
              isFrozen: data.isFrozen ?? false,
              frozenReason: data.frozenReason ?? null,
              isBanned: data.isBanned ?? false,
              bannedReason: data.bannedReason ?? null,
              isHighRisk: data.isHighRisk ?? false,
              highRiskReason: data.highRiskReason ?? null,
              emailVerified: data.emailVerified ?? false,
            })
          } else if (res.status === 404) {
            localStorage.removeItem('userId')
            set({
              userId: null,
              username: null,
              membershipLevel: 'copper',
              points: 0,
              walletBalance: 0,
              checkInStreak: 0,
              isNewUser: true,
              newUserDaysLeft: 2,
              currentView: 'home',
              showAuthDialog: true,
            })
          }
        } catch {
          // silently fail
        }
      },
    }),
    {
      name: 'member-store',
      partialize: (state) => ({
        cart: state.cart,
        globalEffect: state.globalEffect,
        globalEffectColor: state.globalEffectColor,
        buttonColor: state.buttonColor,
        appBackgroundColor: state.appBackgroundColor,
      }),
    }
  )
)
