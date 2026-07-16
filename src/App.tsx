import React from "react"
import { BrowserRouter, Route, Switch } from "react-router-dom"
import { DashboardPage } from "@/pages/DashboardPage"
import { ExamDatePage } from "@/pages/ExamDatePage"
import { SettingsPage } from "@/pages/SettingsPage"

const App: React.FC = () => {
  return (
    <BrowserRouter>
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
