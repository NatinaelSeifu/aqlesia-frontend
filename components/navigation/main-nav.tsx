"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { PermissionService } from "@/lib/permissions"
import type { UserRole } from "@/lib/permissions"
import { 
  Menu, 
  Users, 
  Calendar, 
  CalendarPlus, 
  MessageCircle, 
  User, 
  HelpCircle,
  LogOut,
  Home,
  Settings,
  Church,
  CalendarClock,
  X
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

interface MenuItem {
  title: string
  href: string
  icon: any
  show: boolean
  color: string
  onClick?: () => void
}

export function MainNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/")
    setOpen(false)
  }

  const closeMenu = () => setOpen(false)

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/")
  }

  const getMenuItems = () => {
    if (user.role === "admin") {
      // Admin menu - full access
      return [
        {
          title: "Aqlesia",
          href: "/dashboard",
          icon: Church,
          show: true,
          color: "bg-blue-50 text-blue-600"
        },
        {
          title: "Manage Users",
          href: "/users",
          icon: Users,
          show: true,
          color: "bg-red-50 text-red-600"
        },
        {
          title: "Manage Appointments",
          href: "/admin/appointments",
          icon: Calendar,
          show: true,
          color: "bg-purple-50 text-purple-600"
        },
        {
          title: "Manage Communion",
          href: "/admin/communion",
          icon: Settings,
          show: true,
          color: "bg-orange-50 text-orange-600"
        },
        {
          title: "Available Dates",
          href: "/admin/available-dates",
          icon: CalendarClock,
          show: true,
          color: "bg-green-50 text-green-600"
        },
        {
          title: "Questions",
          href: "/admin/questions",
          icon: HelpCircle,
          show: true,
          color: "bg-purple-50 text-purple-600"
        },
        {
          title: "Profile",
          href: "/profile",
          icon: User,
          show: true,
          color: "bg-gray-50 text-gray-600"
        }
      ]
    } else if (user.role === "manager") {
      // Manager menu - can schedule appointments and manage them
      return [
        {
          title: "Aqlesia",
          href: "/dashboard",
          icon: Church,
          show: true,
          color: "bg-blue-50 text-blue-600"
        },
        {
          title: "Appointments",
          href: "/appointments",
          icon: Calendar,
          show: true,
          color: "bg-purple-50 text-purple-600"
        },
        {
          title: "Manage Appointments",
          href: "/admin/appointments",
          icon: CalendarClock,
          show: true,
          color: "bg-green-50 text-green-600"
        },
        {
          title: "Available Dates",
          href: "/admin/available-dates",
          icon: CalendarPlus,
          show: true,
          color: "bg-blue-50 text-blue-600"
        },
        {
          title: "Communion",
          href: "/communion",
          icon: Church,
          show: true,
          color: "bg-indigo-50 text-indigo-600"
        },
        {
          title: "Manage Users",
          href: "/users",
          icon: Users,
          show: true,
          color: "bg-red-50 text-red-600"
        },
        {
          title: "Questions",
          href: "/questions",
          icon: HelpCircle,
          show: true,
          color: "bg-amber-50 text-amber-600"
        },
        {
          title: "Profile",
          href: "/profile",
          icon: User,
          show: true,
          color: "bg-gray-50 text-gray-600"
        }
      ]
    } else {
      // Regular user menu
      return [
        {
          title: "Aqlesia",
          href: "/dashboard",
          icon: Church,
          show: true,
          color: "bg-blue-50 text-blue-600"
        },
        {
          title: "Appointments",
          href: "/appointments",
          icon: Calendar,
          show: true,
          color: "bg-purple-50 text-purple-600"
        },
        {
          title: "Communion",
          href: "/communion",
          icon: Church,
          show: true,
          color: "bg-indigo-50 text-indigo-600"
        },
        {
          title: "Profile",
          href: "/profile",
          icon: User,
          show: true,
          color: "bg-gray-50 text-gray-600"
        },
        {
          title: "Questions",
          href: "/questions",
          icon: HelpCircle,
          show: true,
          color: "bg-amber-50 text-amber-600"
        }
      ]
    }
  }

  const menuItems = getMenuItems()

  const visibleMenuItems = menuItems.filter(item => item.show)

  return (
    <div className="flex items-center justify-between w-full bg-white">
      <div className="flex items-center space-x-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden hover:bg-gray-100">
              <Menu className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-white [&>button]:hidden">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-left">
                  <Link href="/dashboard" onClick={closeMenu}>
                    <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Church className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-900">Aqlesia</div>
                      </div>
                    </div>
                  </Link>
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="h-8 w-8 p-0 hover:bg-blue-100 rounded-md"
                >
                  <X className="h-5 w-5 text-slate-600 hover:text-blue-600" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
            </SheetHeader>
            
            {/* User Info */}
            <div className="py-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.name} {user.lastname}</p>
                  <p className="text-sm text-gray-600">{user.phone_number}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="py-6 space-y-1">
              {visibleMenuItems.map((item) => (
                item.onClick ? (
                  <button
                    key={item.title}
                    onClick={() => {
                      item.onClick!()
                      closeMenu()
                    }}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 text-gray-700"
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive(item.href) ? 'bg-blue-100' : item.color}`}>
                      <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
                    </div>
                    <span>{item.title}</span>
                  </Link>
                )
              ))}
            </nav>

          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {visibleMenuItems.map((item) => (
            item.onClick ? (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <div className={`p-1 rounded-md ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="hidden lg:block">{item.title}</span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`p-1 rounded-md ${isActive(item.href) ? 'bg-blue-100' : item.color}`}>
                  <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
                </div>
                <span className="hidden lg:block">{item.title}</span>
              </Link>
            )
          ))}
        </nav>

      </div>

      {/* Desktop User Menu */}
      <div className="hidden md:flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
        </div>
        <Button 
          onClick={handleLogout} 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
        >
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden lg:block">Logout</span>
        </Button>
      </div>

      {/* Mobile User Info with Logout */}
      <div className="md:hidden flex items-center space-x-2">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
        </div>
        <Button 
          onClick={handleLogout} 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 p-2 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
