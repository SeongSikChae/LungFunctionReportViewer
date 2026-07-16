import React, { useMemo } from "react"
import { NavLink } from "react-router-dom"
import { Activity, CalendarDays, LayoutDashboard, Settings } from "lucide-react"
import { STATIC_NAV_ITEMS } from "@/config/navigation"
import { useSpirometryResults } from "@/lib/spirometryStorage"

function iconFor(label: string) {
  if (label === "대시보드") return LayoutDashboard
  if (label === "설정") return Settings
  return CalendarDays
}

export const SidebarBrand: React.FC = () => (
  <div className="flex h-14 w-56 shrink-0 items-center gap-2 border-r px-4">
    <Activity className="size-5 shrink-0 text-foreground" />
    <p className="truncate text-sm font-semibold tracking-tight">
      폐기능 검사 결과
    </p>
  </div>
)

export const AppSidebar: React.FC = () => {
  const results = useSpirometryResults()
  const navItems = useMemo(() => {
    const examItems = results
      .map((result) => result.examDate)
      .sort()
      .map((date) => ({
        to: `/exam/${date}`,
        label: date,
        exact: false,
      }))

    return [
      STATIC_NAV_ITEMS[0],
      ...examItems,
      STATIC_NAV_ITEMS[1],
    ]
  }, [results])

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = iconFor(item.label)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              exact={item.exact}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeClassName="bg-accent text-accent-foreground font-medium"
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
