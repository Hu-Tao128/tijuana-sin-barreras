import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('tsb-theme')
document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light')
document.documentElement.lang = localStorage.getItem('tsb-language') === 'en' ? 'en' : 'es'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
