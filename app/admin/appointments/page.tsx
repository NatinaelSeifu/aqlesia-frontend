"use client";

import {useEffect, useState} from "react";
import {redirect} from "next/navigation";
import {useTranslations} from "next-intl";
import {format} from "date-fns";

import {DashboardHeader} from "../../../components/dashboard/dashboard-header";
import {Card, CardContent, CardHeader, CardTitle} from "../../../components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../../components/ui/tabs";
import {Input} from "../../../components/ui/input";
import {Button} from "../../../components/ui/button";
import {Calendar, Clock, RefreshCw, Search, CheckCircle2} from "lucide-react";

import {useToast} from "../../../components/ui/use-toast";
import {useAuth} from "../../../hooks/use-auth";
import {appointmentService} from "../../../lib/appointments";
import type {Appointment} from "../../../lib/appointments";
import AppointmentTable from "@/components/admin/AppointmentTable";

export default function AdminAppointmentsPage() {
  const {user, loading} = useAuth();
  const {toast} = useToast();
  const t = useTranslations();

  const [pageError, setPageError] = useState<string | null>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) redirect("/");
    if (!loading && user && user.role !== "admin" && user.role !== "manager") {
      redirect("/dashboard");
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "manager")) {
      loadAllAppointments();
      loadPendingAppointments();
    }
  }, [user]);

  const loadAllAppointments = async () => {
    try {
      setLoadingAll(true);
      setPageError(null);
      const appointments = await appointmentService.getAllAppointments();

      let list: Appointment[] = [];
      if (Array.isArray(appointments)) list = appointments;
      else if (appointments?.appointments) list = appointments.appointments;
      else if (appointments?.data) list = appointments.data;
      setAllAppointments(list);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("adminAppointments.errors.tryAgain");
      if (msg.includes("403") || msg.includes("Forbidden")) {
        setPageError(t("adminAppointments.errors.accessDenied", {role: user?.role}));
      } else {
        setPageError(t("adminAppointments.errors.loadAll", {message: msg}));
      }
      toast({title: t("adminAppointments.toasts.loadAllErrorTitle"), description: msg, variant: "destructive"});
    } finally {
      setLoadingAll(false);
    }
  };

  const loadPendingAppointments = async () => {
    try {
      setLoadingPending(true);
      const appointments = await appointmentService.getAllAppointments();
      let list: Appointment[] = [];
      if (Array.isArray(appointments)) list = appointments;
      else if (appointments?.appointments) list = appointments.appointments;
      else if (appointments?.data) list = appointments.data;
      setPendingAppointments(list.filter(a => a.status === "pending"));
    } catch (error) {
      toast({title: t("adminAppointments.toasts.loadPendingErrorTitle"), description: error instanceof Error ? error.message : t("adminAppointments.errors.tryAgain"), variant: "destructive"});
    } finally {
      setLoadingPending(false);
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      setActionLoading(id);
      await appointmentService.completeAppointment(id);
      toast({title: t("adminAppointments.toasts.completeSuccessTitle"), description: t("adminAppointments.toasts.completeSuccessDesc")});
      loadAllAppointments();
      loadPendingAppointments();
    } catch (error) {
      toast({title: t("adminAppointments.toasts.completeErrorTitle"), description: error instanceof Error ? error.message : t("adminAppointments.errors.tryAgain"), variant: "destructive"});
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      setActionLoading(id);
      await appointmentService.cancelAppointment(id);
      toast({title: t("adminAppointments.toasts.cancelSuccessTitle"), description: t("adminAppointments.toasts.cancelSuccessDesc")});
      loadAllAppointments();
      loadPendingAppointments();
    } catch (error) {
      toast({title: t("adminAppointments.toasts.cancelErrorTitle"), description: error instanceof Error ? error.message : t("adminAppointments.errors.tryAgain"), variant: "destructive"});
    } finally {
      setActionLoading(null);
    }
  };

  const isOverdue = (a: Appointment) => {
    if (a.status !== "pending") return false;
    const d = new Date(a.appointment_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d < today;
  };

  const getEffectiveStatus = (a: Appointment) => (isOverdue(a) ? "overdue" : a.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const filteredAll = allAppointments.filter(a =>
    a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.phone_number?.includes(searchTerm) ||
    getEffectiveStatus(a).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingAppointments.filter(a =>
    a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.user?.phone_number?.includes(searchTerm) ||
    getEffectiveStatus(a).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-white">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">{t("adminAppointments.header.title")}</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">{t("adminAppointments.header.subtitle")}</p>
        </div>

        {pageError && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded">
            <p className="font-semibold mb-1">{t("adminAppointments.errors.pageTitle")}</p>
            <p className="text-sm">{pageError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-purple-900">{t("adminAppointments.stats.totalTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-purple-200 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-purple-900">{allAppointments.length}</div>
              <p className="text-xs sm:text-sm text-purple-700 mt-1">{t("adminAppointments.stats.totalSub")}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-amber-900">{t("adminAppointments.stats.pendingTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-amber-200 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-amber-900">{pendingAppointments.length}</div>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                {t("adminAppointments.stats.pendingLine", {overdue: pendingAppointments.filter(isOverdue).length, pending: pendingAppointments.filter(a => !isOverdue(a)).length})}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-green-900">{t("adminAppointments.stats.completedTodayTitle")}</CardTitle>
              <div className="p-1.5 sm:p-2 bg-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <div className="text-2xl sm:text-3xl font-bold text-green-900">
                {allAppointments.filter(a => a.status === "completed" && format(new Date(a.appointment_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length}
              </div>
              <p className="text-xs sm:text-sm text-green-700 mt-1">{t("adminAppointments.stats.completedTodaySub")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 sm:mb-8 border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3 sm:p-6 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("adminAppointments.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <Tabs defaultValue="pending">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="bg-transparent border-none p-3 sm:p-6 w-full">
                <TabsTrigger value="pending" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 hover:bg-gray-100 transition-colors flex-1 sm:flex-none">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">{t("adminAppointments.tabs.pendingFull", {count: pendingAppointments.length})}</span>
                  <span className="sm:hidden">{t("adminAppointments.tabs.pendingShort", {count: pendingAppointments.length})}</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:!border-blue-600 data-[state=active]:shadow-sm border border-transparent px-3 sm:px-6 py-2 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base text-gray-600 ml-2 sm:ml-3 hover:bg-gray-100 transition-colors flex-1 sm:flex-none">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-3" />
                  <span className="hidden sm:inline">{t("adminAppointments.tabs.allFull", {count: allAppointments.length})}</span>
                  <span className="sm:hidden">{t("adminAppointments.tabs.allShort", {count: allAppointments.length})}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t("adminAppointments.sections.pendingTitle")}</h3>
                <Button onClick={loadPendingAppointments} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPending ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{t("common.refresh")}</span>
                </Button>
              </div>
              <AppointmentTable
                appointments={filteredPending}
                loading={loadingPending}
                showActions
                actionLoading={actionLoading}
                onComplete={handleCompleteAppointment}
                onCancel={handleCancelAppointment}
                getEffectiveStatus={getEffectiveStatus}
              />
            </TabsContent>

            <TabsContent value="all" className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justifyBetween items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t("adminAppointments.sections.allTitle")}</h3>
                <Button onClick={loadAllAppointments} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAll ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{t("common.refresh")}</span>
                </Button>
              </div>
              <AppointmentTable
                appointments={filteredAll}
                loading={loadingAll}
                showActions
                actionLoading={actionLoading}
                onComplete={handleCompleteAppointment}
                onCancel={handleCancelAppointment}
                getEffectiveStatus={getEffectiveStatus}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
