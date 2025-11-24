"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../hooks/use-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Calendar,
  RefreshCw,
  Eye,
  Trash2,
  Phone,
  Search,
  User
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useToast } from "@/components/ui/use-toast"
import { Communion, UpdateCommunionStatusRequest, communionService } from "@/lib/communion"
import { format } from "date-fns"
import { useTranslations, useLocale } from "next-intl"
import { formatEthiopianDate } from "@/lib/date"

export default function AdminCommunionPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const t = useTranslations()
  const locale = useLocale()
  
  // State management
  const [allCommunions, setAllCommunions] = useState<Communion[]>([])
  const [pendingCommunions, setPendingCommunions] = useState<Communion[]>([])
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingPending, setLoadingPending] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pagination state
  const [allPage, setAllPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [allTotal, setAllTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    if (!loading && !user) {
      redirect("/")
    }
    
    if (!loading && user && user.role !== "admin") {
      redirect("/dashboard")
    }
  }, [user, loading])

  useEffect(() => {
    if (user && user.role === "admin") {
      loadAllCommunions()
      loadPendingCommunions()
    }
  }, [user, allPage, pendingPage])

  const loadAllCommunions = async () => {
    try {
      setLoadingAll(true)
      const response = await communionService.getAllCommunions(allPage, pageSize)
      setAllCommunions(response.communions)
      setAllTotal(response.total)
    } catch (error) {
      console.error('Failed to load all communions:', error)
      toast({
        title: t("adminCommunion.toasts.loadAllErrorTitle"),
        description: error instanceof Error ? error.message : t("adminCommunion.toasts.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setLoadingAll(false)
    }
  }

  const loadPendingCommunions = async () => {
    try {
      setLoadingPending(true)
      const response = await communionService.getPendingCommunions(pendingPage, pageSize)
      setPendingCommunions(response.communions)
      setPendingTotal(response.total)
    } catch (error) {
      console.error('Failed to load pending communions:', error)
      toast({
        title: t("adminCommunion.toasts.loadPendingErrorTitle"),
        description: error instanceof Error ? error.message : t("adminCommunion.toasts.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setLoadingPending(false)
    }
  }

  const handleStatusUpdate = async (communionId: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(communionId)
      const request: UpdateCommunionStatusRequest = { status }
      
      await communionService.updateCommunionStatus(communionId, request)
      
      toast({
        title: status === 'approved' ? t("adminCommunion.toasts.statusApprovedTitle") : t("adminCommunion.toasts.statusRejectedTitle"),
        description: status === 'approved' ? t("adminCommunion.toasts.statusApprovedDesc") : t("adminCommunion.toasts.statusRejectedDesc"),
        variant: status === 'approved' ? "default" : "destructive"
      })
      
      // Reload data
      loadAllCommunions()
      loadPendingCommunions()
    } catch (error) {
      console.error(`Failed to ${status} communion:`, error)
      toast({
        title: status === 'approved' ? t("adminCommunion.toasts.failedApproveTitle") : t("adminCommunion.toasts.failedRejectTitle"),
        description: error instanceof Error ? error.message : t("adminCommunion.toasts.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCommunion = async (communionId: string) => {
    try {
      setActionLoading(communionId)
      await communionService.deleteCommunion(communionId)
      
      toast({
        title: t("adminCommunion.toasts.deleteSuccessTitle"),
        description: t("adminCommunion.toasts.deleteSuccessDesc"),
        variant: "default"
      })
      
      // Reload data
      loadAllCommunions()
      loadPendingCommunions()
    } catch (error) {
      console.error('Failed to delete communion:', error)
      toast({
        title: t("adminCommunion.toasts.deleteErrorTitle"),
        description: error instanceof Error ? error.message : t("adminCommunion.toasts.tryAgain"),
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("adminCommunion.status.approved")}
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {t("adminCommunion.status.rejected")}
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            {t("adminCommunion.status.pending")}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const filteredAllCommunions = allCommunions.filter(communion =>
    communion.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    communion.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    communion.user?.phone_number?.includes(searchTerm) ||
    communion.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPendingCommunions = pendingCommunions.filter(communion =>
    communion.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    communion.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    communion.user?.phone_number?.includes(searchTerm) ||
    communion.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const CommunionTable = ({
    communions, 
    loading, 
    showActions = true 
  }: { 
    communions: Communion[], 
    loading: boolean,
    showActions?: boolean 
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t("adminCommunion.table.user")}</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px]">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t("adminCommunion.table.phone")}</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">{t("adminCommunion.table.date")}</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[80px]">{t("adminCommunion.table.status")}</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px] hidden sm:table-cell">{t("adminCommunion.table.requestedAt")}</TableHead>
            {showActions && <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">{t("adminCommunion.table.actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span className="text-gray-700">{t("adminCommunion.table.loading")}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : communions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium mb-2">{t("adminCommunion.table.emptyTitle")}</div>
                <div className="text-gray-400">{t("adminCommunion.table.emptyDesc")}</div>
              </TableCell>
            </TableRow>
          ) : (
            communions.map((communion) => (
              <TableRow key={communion.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                <TableCell className="font-medium text-gray-900 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{communion.user?.name || t("adminCommunion.table.unknownUser")}</p>
                    {communion.user?.lastname && (
                      <p className="truncate text-gray-600 text-xs">{communion.user.lastname}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs sm:text-sm">
                  <div className="flex items-center text-gray-700 min-w-0">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{communion.user?.phone_number || t("adminCommunion.table.na")}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700 text-xs sm:text-sm">
                  <span className="whitespace-nowrap">
                    {formatEthiopianDate(new Date(communion.communion_date), locale)}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(communion.status)}</TableCell>
                <TableCell className="text-gray-700 text-xs hidden sm:table-cell">
                  {formatEthiopianDate(new Date(communion.requested_at), locale)}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {communion.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={actionLoading === communion.id}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                                title={t("adminCommunion.tooltips.approve")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("adminCommunion.dialog.approve.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminCommunion.dialog.approve.desc", { name: communion.user?.name || '' })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleStatusUpdate(communion.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {t("adminCommunion.dialog.approve.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={actionLoading === communion.id}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                title={t("adminCommunion.tooltips.reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("adminCommunion.dialog.reject.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminCommunion.dialog.reject.desc", { name: communion.user?.name || '' })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleStatusUpdate(communion.id, 'rejected')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("adminCommunion.dialog.reject.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={actionLoading === communion.id}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                            title={t("adminCommunion.tooltips.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("adminCommunion.dialog.delete.title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("adminCommunion.dialog.delete.desc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCommunion(communion.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t("adminCommunion.dialog.delete.confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-white">
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">{t("adminCommunion.header.title")}</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">{t("adminCommunion.header.subtitle")}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-blue-900">{t("adminCommunion.stats.totalTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-blue-200 rounded-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-blue-900">{allTotal}</div>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">{t("adminCommunion.stats.totalSub")}</p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-amber-900">{t("adminCommunion.stats.pendingTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-amber-200 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-amber-900">{pendingTotal}</div>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">{t("adminCommunion.stats.pendingSub")}</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-green-900">{t("adminCommunion.stats.approvedTodayTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-green-900">
                {allCommunions.filter(c => 
                  c.status === 'approved' && 
                  c.approved_at && 
                  format(new Date(c.approved_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </div>
              <p className="text-xs sm:text-sm text-green-700 mt-1">{t("adminCommunion.stats.approvedTodaySub")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 sm:mb-8 border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3 sm:p-6 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("adminCommunion.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <Tabs defaultValue="pending">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="bg-transparent border-none p-3 sm:p-6 w-full">
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                >
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">{t("adminCommunion.tabs.pendingFull", { count: filteredPendingCommunions.length })}</span>
                  <span className="sm:hidden">{t("adminCommunion.tabs.pendingShort", { count: filteredPendingCommunions.length })}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 ml-2 sm:ml-3 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">{t("adminCommunion.tabs.allFull", { count: filteredAllCommunions.length })}</span>
                  <span className="sm:hidden">{t("adminCommunion.tabs.allShort", { count: filteredAllCommunions.length })}</span>
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="pending" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t("adminCommunion.sections.pendingTitle")}</h3>
                <Button 
                  onClick={loadPendingCommunions} 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPending ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t("common.refresh")}</span>
                </Button>
              </div>
            
              <CommunionTable 
                communions={filteredPendingCommunions} 
                loading={loadingPending}
                showActions={true}
              />
            
              {/* Pagination for pending */}
              {pendingTotal > pageSize && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 bg-white">
                  <div className="text-xs sm:text-sm text-gray-700 font-medium order-2 sm:order-1">
                    {t("adminCommunion.pagination.showing", {from: ((pendingPage - 1) * pageSize) + 1, to: Math.min(pendingPage * pageSize, pendingTotal), total: pendingTotal})}
                  </div>
                  <div className="flex items-center space-x-2 order-1 sm:order-2">
                    <button
                      onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                      disabled={pendingPage <= 1 || loadingPending}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md border ${
                        pendingPage <= 1 || loadingPending
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="hidden sm:inline">{t("adminCommunion.pagination.previous")}</span>
                      <span className="sm:hidden">{t("adminCommunion.pagination.previous")}</span>
                    </button>
                    <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-amber-600 text-white border border-amber-600 rounded-md">
                      {pendingPage}
                    </span>
                    <button
                      onClick={() => setPendingPage(p => p + 1)}
                      disabled={pendingPage >= Math.ceil(pendingTotal / pageSize) || loadingPending}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md border ${
                        pendingPage >= Math.ceil(pendingTotal / pageSize) || loadingPending
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {t("adminCommunion.pagination.next")}
                    </button>
                  </div>
                </div>
              )}
          </TabsContent>
          
            <TabsContent value="all" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t("adminCommunion.sections.allTitle")}</h3>
                <Button 
                  onClick={loadAllCommunions} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAll ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t("common.refresh")}</span>
                </Button>
              </div>
              
              <CommunionTable 
                communions={filteredAllCommunions} 
                loading={loadingAll}
                showActions={true}
              />
              
              {/* Pagination for all */}
              {allTotal > pageSize && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 bg-white">
                  <div className="text-xs sm:text-sm text-gray-700 font-medium order-2 sm:order-1">
                    {t("adminCommunion.pagination.showing", {from: ((allPage - 1) * pageSize) + 1, to: Math.min(allPage * pageSize, allTotal), total: allTotal})}
                  </div>
                  <div className="flex items-center space-x-2 order-1 sm:order-2">
                    <button
                      onClick={() => setAllPage(p => Math.max(1, p - 1))}
                      disabled={allPage <= 1 || loadingAll}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md border ${
                        allPage <= 1 || loadingAll
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="hidden sm:inline">{t("adminCommunion.pagination.previous")}</span>
                      <span className="sm:hidden">{t("adminCommunion.pagination.previous")}</span>
                    </button>
                    <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-blue-600 text-white border border-blue-600 rounded-md">
                      {allPage}
                    </span>
                    <button
                      onClick={() => setAllPage(p => p + 1)}
                      disabled={allPage >= Math.ceil(allTotal / pageSize) || loadingAll}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md border ${
                        allPage >= Math.ceil(allTotal / pageSize) || loadingAll
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {t("adminCommunion.pagination.next")}
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
