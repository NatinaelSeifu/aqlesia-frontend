"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Calendar, Users, Settings, FileText, MessageCircle } from "lucide-react"

interface AdminNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      description: "Dashboard overview and statistics",
    },
    {
      id: "appointments",
      label: "All Appointments",
      icon: Calendar,
      description: "Manage all system appointments",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage registered users",
    },
    {
      id: "communion",
      label: "Communion Management",
      icon: MessageCircle,
      description: "Manage communion requests and approvals",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      description: "Generate system reports",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration",
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-3 ${isActive ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => onTabChange(item.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className="h-4 w-4" />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
