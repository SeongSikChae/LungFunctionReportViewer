import React from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { SpirometryResultsManager } from "@/components/settings/SpirometryResultsManager"

export const SettingsPage: React.FC = () => {
  return (
    <AppLayout title="설정">
      <SpirometryResultsManager />
    </AppLayout>
  )
}
