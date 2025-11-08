"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Users, MessageSquare, CalendarCheck, HelpCircle, User, LogOut, Church, ChevronDown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
// Removed DropdownMenu imports - using custom dropdown
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const getNavigationItems = () => {
    if (user.role === "admin") {
      return [
        { href: "/users", label: t("nav.users", {default: "Users"} as any) as unknown as string, icon: Users },
        { href: "/admin/appointments", label: t("admin.tabs.appointments"), icon: Calendar },
        { href: "/admin/communion", label: t("nav.communion"), icon: MessageSquare },
        { href: "/admin/available-dates", label: t("nav.availableDates"), icon: CalendarCheck },
        { href: "/admin/questions", label: t("nav.questions"), icon: HelpCircle },
      ]
    } else if (user.role === "manager") {
      return [
        { href: "/appointments", label: t("nav.appointments"), icon: Calendar },
        { href: "/admin/appointments", label: t("nav.manageAppointments"), icon: CalendarCheck },
        { href: "/communion", label: t("nav.communion"), icon: MessageSquare },
        { href: "/users", label: t("nav.users", {default: "Users"} as any) as unknown as string, icon: Users },
        { href: "/questions", label: t("nav.questions"), icon: HelpCircle },
      ]
    } else {
      return [
        { href: "/appointments", label: t("nav.appointments"), icon: Calendar },
        { href: "/communion", label: t("nav.communion"), icon: MessageSquare },
        { href: "/questions", label: t("nav.questions"), icon: HelpCircle },
      ]
    }
  }

  const navItems = getNavigationItems()
  const userInitials = `${user.name?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`.toUpperCase()

  return (
    <header className="border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile menu - now on the left */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-50">
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="left" className="w-80 bg-white">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-left">
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Church className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-xl font-bold text-gray-900">Aqlesia</span>
                        </div>
                      </Link>
                    </SheetTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </SheetHeader>
                
                {/* Mobile Navigation */}
                <nav className="mt-8 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <span className="text-gray-900">{item.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                  
                  {/* Mobile Profile Link */}
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-900">{t("nav.profile")}</span>
                    </div>
                  </Link>
                  
                  {/* Mobile Logout */}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t("common.logout")}</span>
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Logo and Brand - hidden on mobile when hamburger is present */}
            <Link href="/dashboard" className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Church className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Aqlesia</span>
            </Link>
          </div>

          {/* Center - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Help Button */}
            <Link href="/questions">
              <Button variant="ghost" size="icon" className="hidden md:flex text-gray-600 hover:text-gray-900">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </Link>

            {/* Desktop User Menu */}
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                className="gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm text-gray-900 font-medium">{user.name}</span>
                <ChevronDown className="hidden md:inline w-4 h-4 text-gray-600 ml-1" />
              </Button>
              
              {/* Custom Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-[9999] overflow-hidden">
                  <div className="absolute inset-0 bg-white rounded-lg shadow-2xl"></div>
                  <div className="relative">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{user.name} {user.lastname}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                        {(user.role === 'admin' || user.role === 'manager') && (
                          <span className="text-xs text-blue-600 font-medium capitalize">{user.role}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Profile Settings</span>
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button 
                      onClick={() => {
                        handleLogout()
                        setUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{t("common.logout")}</span>
                    </button>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
