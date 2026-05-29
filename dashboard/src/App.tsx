import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './contexts/AuthContext'
import { AppSettingsProvider } from './contexts/AppSettingsContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { Configuracion, Home, Login, Mapa, Reports, Rutas } from './pages'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppSettingsProvider>
          <ProfileProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="mapa" element={<Mapa />} />
              <Route path="rutas" element={<Rutas />} />
              <Route path="reportes" element={<Reports />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ProfileProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
