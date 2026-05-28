import type { ReactNode } from 'react'
import './DashboardLayout.css'

type DashboardLayoutProps = {
  title: string
  children: ReactNode
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-layout__header">
        <p className="dashboard-layout__eyebrow">Tijuana Sin Barreras</p>
        <h1>{title}</h1>
      </header>
      <main className="dashboard-layout__main">{children}</main>
    </div>
  )
}
