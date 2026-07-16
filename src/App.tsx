import React from "react"
import { BrowserRouter, Route, Switch } from "react-router-dom"
import { DashboardPage } from "@/pages/DashboardPage"
import { ExamDatePage } from "@/pages/ExamDatePage"
import { SettingsPage } from "@/pages/SettingsPage"

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "")

const App: React.FC = () => {
  return (
    <BrowserRouter basename={routerBasename || undefined}>
      <Switch>
        <Route exact path="/" component={DashboardPage} />
        <Route path="/exam/:date" component={ExamDatePage} />
        <Route exact path="/settings" component={SettingsPage} />
        <Route component={DashboardPage} />
      </Switch>
    </BrowserRouter>
  )
}

export default App
