import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth } from '../services/firebase'
import { signInWithEmail, signInWithGoogle, signOutUser } from '../services/auth'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle()
  }, [])

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password)
  }, [])

  const signOut = useCallback(async () => {
    await signOutUser()
  }, [])

  const value = useMemo(
    () => ({ user, loading, signInGoogle, signInEmail, signOut }),
    [user, loading, signInGoogle, signInEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
