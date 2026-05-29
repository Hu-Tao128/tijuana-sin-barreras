import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translations, type Language } from '../i18n/translations'

const LANGUAGE_KEY = 'tsb-language'
const THEME_KEY = 'tsb-theme'

type AppSettingsContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

function readLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  return stored === 'en' ? 'en' : 'es'
}

function readDarkMode(): boolean {
  return localStorage.getItem(THEME_KEY) === 'dark'
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage)
  const [darkMode, setDarkModeState] = useState(readDarkMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    document.documentElement.lang = language
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode, language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }, [])

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[language] as Record<string, unknown>
      let text = getNested(dict, key) ?? getNested(translations.es as Record<string, unknown>, key) ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, darkMode, setDarkMode, t }),
    [language, setLanguage, darkMode, setDarkMode, t],
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  }
  return ctx
}
