"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../../hooks/use-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  RefreshCw,
  Grid3X3,
  List
} from "lucide-react"
import { MainNav } from "../../../../components/navigation/main-nav"
import { useToast } from "../../../../components/ui/use-toast"
import { Communion, communionService } from "../../../../lib/communion"
import { CommunionRequestCard } from "../../../../components/admin/communion-request-card"
import { format } from "date-fns"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function AdminCommunionCardsPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const t = useTranslations()
  
  // State management
  const [allCommunions, setAllCommunions] = useState<Communion[]>([])
  const [pendingCommunions, setPendingCommunions] = useState<Communion[]>([])
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingPending, setLoadingPending] = useState(true)
  
  // Pagination state
  const [allPage, setAllPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [allTotal, setAllTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const pageSize = 12 // Smaller page size for cards

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
        title: "Failed to load communion requests",
        description: error instanceof Error ? error.message : "Please try again later",
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
        title: "Failed to load pending requests",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setLoadingPending(false)
    }
  }

  const handleUpdate = () => {
    loadAllCommunions()
    loadPendingCommunions()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <MainNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t("adminCommunion.header.titleCard")}</h2>
              <p className="text-muted-foreground">{t("adminCommunion.header.subtitleCard")}</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin/communion">
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4 mr-2" />
                  {t("adminCommunion.views.tableView")}
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled>
                <Grid3X3 className="h-4 w-4 mr-2" />
                {t("adminCommunion.views.cardView")}
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("adminCommunion.stats.totalTitle")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTotal}</div>
              <p className="text-xs text-muted-foreground">{t("adminCommunion.stats.totalSub")}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("adminCommunion.stats.pendingTitle")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTotal}</div>
              <p className="text-xs text-muted-foreground">{t("adminCommunion.stats.pendingSub")}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("adminCommunion.stats.approvedTodayTitle")}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allCommunions.filter(c => 
                  c.status === 'approved' && 
                  c.approved_at && 
                  format(new Date(c.approved_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">{t("adminCommunion.stats.approvedTodaySub")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">{t("adminCommunion.tabs.pendingFull", { count: pendingTotal })}</TabsTrigger>
            <TabsTrigger value="all">{t("adminCommunion.tabs.allFull", { count: allTotal })}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t("adminCommunion.sections.pendingTitle")}</h3>
              <Button onClick={loadPendingCommunions} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("common.refresh")}
              </Button>
            </div>
            
            {loadingPending ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
              </div>
            ) : pendingCommunions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t("adminCommunion.table.emptyTitle")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCommunions.map((communion) => (
                  <CommunionRequestCard 
                    key={communion.id}
                    communion={communion} 
                    onUpdate={handleUpdate}
                    showActions={true}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination for pending */}
            {pendingTotal > pageSize && (
              <div className="flex justify-center space-x-2">
                <Button 
                  onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                  disabled={pendingPage === 1 || loadingPending}
                  variant="outline"
                >
                  {t("adminCommunion.pagination.previous")}
                </Button>
                <span className="flex items-center px-3 py-2">
                  {t("adminCommunion.pagination.pageOf", { page: pendingPage, totalPages: Math.ceil(pendingTotal / pageSize) })}
                </span>
                <Button 
                  onClick={() => setPendingPage(p => p + 1)}
                  disabled={pendingPage >= Math.ceil(pendingTotal / pageSize) || loadingPending}
                  variant="outline"
                >
                  {t("adminCommunion.pagination.next")}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t("adminCommunion.sections.allTitle")}</h3>
              <Button onClick={loadAllCommunions} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("common.refresh")}
              </Button>
            </div>
            
            {loadingAll ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
              </div>
            ) : allCommunions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t("adminCommunion.table.emptyTitle")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCommunions.map((communion) => (
                  <CommunionRequestCard 
                    key={communion.id}
                    communion={communion} 
                    onUpdate={handleUpdate}
                    showActions={true}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination for all */}
            {allTotal > pageSize && (
              <div className="flex justify-center space-x-2">
                <Button 
                  onClick={() => setAllPage(p => Math.max(1, p - 1))}
                  disabled={allPage === 1 || loadingAll}
                  variant="outline"
                >
                  {t("adminCommunion.pagination.previous")}
                </Button>
                <span className="flex items-center px-3 py-2">
                  {t("adminCommunion.pagination.pageOf", { page: allPage, totalPages: Math.ceil(allTotal / pageSize) })}
                </span>
                <Button 
                  onClick={() => setAllPage(p => p + 1)}
                  disabled={allPage >= Math.ceil(allTotal / pageSize) || loadingAll}
                  variant="outline"
                >
                  {t("adminCommunion.pagination.next")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
