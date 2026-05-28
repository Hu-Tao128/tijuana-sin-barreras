import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'tsb-profile-photo'

type ProfileContextValue = {
  photoUrl: string | null
  setPhoto: (dataUrl: string | null) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    if (photoUrl) {
      localStorage.setItem(STORAGE_KEY, photoUrl)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [photoUrl])

  const setPhoto = useCallback((dataUrl: string | null) => {
    setPhotoUrl(dataUrl)
  }, [])

  const value = useMemo(() => ({ photoUrl, setPhoto }), [photoUrl, setPhoto])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile debe usarse dentro de ProfileProvider')
  }
  return context
}
