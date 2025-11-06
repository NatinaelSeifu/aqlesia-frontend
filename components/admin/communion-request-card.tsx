"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  User,
  Calendar,
  Clock,
  Phone,
  Trash2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Communion, UpdateCommunionStatusRequest, communionService } from "@/lib/communion"
import { format } from "date-fns"

interface CommunionRequestCardProps {
  communion: Communion
  onUpdate: () => void
  showActions?: boolean
}

export function CommunionRequestCard({ 
  communion, 
  onUpdate, 
  showActions = true 
}: CommunionRequestCardProps) {
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState(false)

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true)
      const request: UpdateCommunionStatusRequest = { status }
      
      await communionService.updateCommunionStatus(communion.id, request)
      
      toast({
        title: `Communion request ${status}`,
        description: `The communion request has been ${status} successfully.`,
        variant: status === 'approved' ? "default" : "destructive"
      })
      
      onUpdate()
    } catch (error) {
      console.error(`Failed to ${status} communion:`, error)
      toast({
        title: `Failed to ${status} request`,
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await communionService.deleteCommunion(communion.id)
      
      toast({
        title: "Communion request deleted",
        description: "The communion request has been deleted successfully.",
        variant: "default"
      })
      
      onUpdate()
    } catch (error) {
      console.error('Failed to delete communion:', error)
      toast({
        title: "Failed to delete request",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className={`transition-colors ${
      communion.status === 'approved' ? 'border-green-200 bg-green-50/30' : 
      communion.status === 'rejected' ? 'border-red-200 bg-red-50/30' : 
      'border-yellow-200 bg-yellow-50/30'
    }`}>
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <CardTitle className="text-base sm:text-lg flex items-center space-x-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {communion.user?.name || 'Unknown User'}
              {communion.user?.lastname && ` ${communion.user.lastname}`}
            </span>
          </CardTitle>
          <div className="self-start sm:self-center">
            {getStatusBadge(communion.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{communion.user?.phone_number || 'No phone'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              Communion: {format(new Date(communion.communion_date), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              Requested: {format(new Date(communion.requested_at), 'MMM d, yy')}
            </span>
          </div>
          
          {communion.status !== 'pending' && communion.approved_by && (
            <div className="flex items-start space-x-2 text-xs">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="min-w-0">
                {communion.status === 'approved' ? 'Approved' : 'Rejected'} by: {communion.approved_by.name}
                {communion.approved_at && (
                  <span className="block sm:inline">
                    {" "}{format(new Date(communion.approved_at), 'MMM d, yyyy')}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0 pt-3 border-t">
            {communion.status === 'pending' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={actionLoading}
                      className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Communion Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to approve this communion request from {communion.user?.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleStatusUpdate('approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Communion Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reject this communion request from {communion.user?.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleStatusUpdate('rejected')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Communion Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this communion request? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
