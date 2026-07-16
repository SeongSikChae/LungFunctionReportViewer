import React from "react"
import { AppSidebar, SidebarBrand } from "@/components/layout/AppSidebar"

interface AppLayoutProps {
  title: string
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-stretch border-b bg-card">
        <SidebarBrand />
        <div className="flex min-w-0 flex-1 items-center px-6">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
