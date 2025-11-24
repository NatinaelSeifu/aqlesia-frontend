"use client";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Phone, User} from "lucide-react";
import {useTranslations} from "next-intl";
import {format} from "date-fns";
import type {Appointment} from "@/lib/appointments";

export default function AppointmentTable({
  appointments,
  loading,
  showActions = true,
  actionLoading,
  onComplete,
  onCancel,
  getEffectiveStatus,
}: {
  appointments: Appointment[];
  loading: boolean;
  showActions?: boolean;
  actionLoading: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  getEffectiveStatus: (a: Appointment) => string;
}) {
  const t = useTranslations();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t("adminAppointments.table.user")}</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px]">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t("adminAppointments.table.phone")}</span>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[120px]">{t("adminAppointments.table.date")}</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[80px]">{t("adminAppointments.table.status")}</TableHead>
            <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px] hidden sm:table-cell">{t("adminAppointments.table.bookedAt")}</TableHead>
            {showActions && <TableHead className="font-semibold text-gray-900 text-xs sm:text-sm min-w-[100px]">{t("adminAppointments.table.actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-gray-700">{t("adminAppointments.table.loading")}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium mb-2">{t("adminAppointments.table.emptyTitle")}</div>
                <div className="text-gray-400">{t("adminAppointments.table.emptyDesc")}</div>
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                <TableCell className="font-medium text-gray-900 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{appointment.user?.name || t("adminAppointments.table.unknownUser")}</p>
                    {appointment.user?.lastname && (
                      <p className="truncate text-gray-600 text-xs">{appointment.user.lastname}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-700 text-xs sm:text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{appointment.user?.phone_number || t("adminAppointments.table.na")}</p>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(appointment.appointment_date), 'MMM d, yy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${
                    getEffectiveStatus(appointment) === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' :
                    getEffectiveStatus(appointment) === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300' :
                    getEffectiveStatus(appointment) === 'overdue' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300' :
                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
                  }`}>
                    <span className="flex items-center space-x-1">
                      {getEffectiveStatus(appointment) === 'completed' ? (
                        <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : getEffectiveStatus(appointment) === 'cancelled' ? (
                        <XCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : getEffectiveStatus(appointment) === 'overdue' ? (
                        <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : (
                        <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                      )}
                      <span className="capitalize text-xs">{getEffectiveStatus(appointment)}</span>
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 text-xs hidden sm:table-cell">
                  {format(new Date(appointment.created_at), 'MMM d, yy')}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {appointment.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === appointment.id}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                                title={t("adminAppointments.tooltips.complete")}
                              >
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("adminAppointments.dialog.complete.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminAppointments.dialog.complete.desc", {name: appointment.user?.name})}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onComplete(appointment.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {t("adminAppointments.dialog.complete.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === appointment.id}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                title={t("adminAppointments.tooltips.cancel")}
                              >
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("adminAppointments.dialog.cancel.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("adminAppointments.dialog.cancel.desc", {name: appointment.user?.name})}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onCancel(appointment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("adminAppointments.dialog.cancel.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
