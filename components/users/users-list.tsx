"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { apiService } from "@/lib/api"
import { PermissionService } from "@/lib/permissions"
import type { User } from "@/lib/auth"
import type { UserRole } from "@/lib/permissions"
import { Users, Search, Trash2, Eye, Phone, Calendar, AlertCircle, Shield, UserCircle, Briefcase, GraduationCap, Heart, RefreshCw, Settings, CheckCircle, Clock, XCircle, Check, X } from "lucide-react"

interface UserListResponse {
  users: User[]
  total: number
  page: number
  page_size: number
}

export function UsersList() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError("") // Clear previous errors
      const data = await apiService.getUsers(currentPage, pageSize)
      console.log('Users API response:', data) // Debug log
      
      // Handle different response formats for paginated data
      let response: UserListResponse
      if (data && data.users && Array.isArray(data.users)) {
        // Direct response format
        response = {
          users: data.users,
          total: data.total || 0,
          page: data.page || currentPage,
          page_size: data.page_size || pageSize
        }
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated response (legacy)
        response = {
          users: data,
          total: data.length,
          page: 1,
          page_size: data.length
        }
      } else {
        // Empty response
        response = {
          users: [],
          total: 0,
          page: currentPage,
          page_size: pageSize
        }
      }
      
      console.log('Processed users response:', response)
      setUsers(response.users)
      setTotalUsers(response.total)
      setTotalPages(Math.ceil(response.total / response.page_size))
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err instanceof Error ? err.message : "Failed to load users")
      setUsers([]) // Set to empty array on error
      setTotalUsers(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await apiService.deleteUser(userToDelete.id)
      // Reload the current page to get updated data
      await loadUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    }
  }

  const handleStatusUpdate = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      setUpdatingUserId(userId)
      setError("") // Clear any previous errors
      await apiService.updateUserStatus(userId, status)
      // Reload the current page to get updated data
      await loadUsers()
      setUpdatingUserId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status")
      setUpdatingUserId(null)
    }
  }

  // Pagination helpers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getVisiblePageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }
    
    rangeWithDots.push(...range)
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }
    
    return rangeWithDots
  }

  const filteredUsers = (users || []).filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number?.includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
            <Settings className="h-3 w-3 mr-1" />
            Manager
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <UserCircle className="h-3 w-3 mr-1" />
            User
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "INACTIVE":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  if (!currentUser || !PermissionService.canManageUsers(currentUser.role as UserRole)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{"You don't have permission to view this page."}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-blue-900">Total Users</CardTitle>
            <div className="p-2 bg-blue-200 rounded-lg">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{totalUsers}</div>
            <p className="text-sm text-blue-700 mt-1">Total registered users</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-green-900">Current Page</CardTitle>
            <div className="p-2 bg-green-200 rounded-lg">
              <Shield className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{(users || []).filter(u => u.role === 'admin').length}</div>
            <p className="text-sm text-green-700 mt-1">Admins on this page</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-purple-900">Page {currentPage} of {totalPages}</CardTitle>
            <div className="p-2 bg-purple-200 rounded-lg">
              <UserCircle className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{(users || []).length}</div>
            <p className="text-sm text-purple-700 mt-1">Users on this page</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-gray-200 shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-gray-900 text-xl">All Users</CardTitle>
              <CardDescription className="text-gray-600">Complete list of system users with management actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users by name, phone, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button 
              onClick={loadUsers} 
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">ስልክ</TableHead>
                    <TableHead className="font-semibold text-gray-900">Role</TableHead>
                    <TableHead className="font-semibold text-gray-900">የስራ አይነት</TableHead>
                    <TableHead className="font-semibold text-gray-900">የአጋር ስም</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <TableCell className="font-medium text-gray-900">{`${user.name} ${user.lastname}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {user.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-gray-700">{user.job_title || "—"}</TableCell>
                      <TableCell className="text-gray-700">{user.partner_name || "—"}</TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {PermissionService.canViewUser(currentUser.role as UserRole, user.id, currentUser.id) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedUser(user)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md bg-white">
                                <DialogHeader>
                                  <DialogTitle className="text-gray-900">User Details</DialogTitle>
                                  <DialogDescription className="text-gray-600">Detailed information about the user</DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                                      <p className="text-gray-900">{`${selectedUser.name} ${selectedUser.lastname}`}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">ስልክ</label>
                                      <p className="text-gray-900">{selectedUser.phone_number}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Role</label>
                                      <p className="capitalize text-gray-900">{selectedUser.role}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Status</label>
                                      <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                                    </div>
                                    {selectedUser.job_title && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          የስራ አይነት
                                        </label>
                                        <p className="text-gray-900">{selectedUser.job_title}</p>
                                      </div>
                                    )}
                                    {selectedUser.education && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          የትምህርት ደረጃ
                                        </label>
                                        <p className="text-gray-900">{selectedUser.education}</p>
                                      </div>
                                    )}
                                    {selectedUser.marriage_status && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          Marriage Status
                                        </label>
                                        <p className="capitalize text-gray-900">{selectedUser.marriage_status}</p>
                                      </div>
                                    )}
                                    {selectedUser.partner_name && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          የአጋር ስም
                                        </label>
                                        <p className="text-gray-900">{selectedUser.partner_name}</p>
                                      </div>
                                    )}
                                    {selectedUser.telegram_id && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">
                                          Telegram
                                        </label>
                                        <p className="text-gray-900">{selectedUser.telegram_id}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Approve/Reject buttons for pending users */}
                          {user.status === "PENDING" && PermissionService.canManageUsers(currentUser.role as UserRole) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(user.id, "ACTIVE")}
                                disabled={updatingUserId === user.id}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                                title="Approve User"
                              >
                                {updatingUserId === user.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(user.id, "INACTIVE")}
                                disabled={updatingUserId === user.id}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                title="Reject User"
                              >
                                {updatingUserId === user.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}

                          {PermissionService.canDeleteUsers(currentUser.role as UserRole) &&
                            user.id !== currentUser.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(user)
                                  setDeleteDialogOpen(true)
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500 text-lg font-medium mb-2">No users found</div>
                  <div className="text-gray-400">Try adjusting your search criteria</div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-700 font-medium">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1)
                    }
                  }}
                  disabled={currentPage <= 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md border ${
                    currentPage <= 1
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Previous
                </button>
                
                {getVisiblePageNumbers().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-sm text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (typeof page === 'number') {
                            handlePageChange(page)
                          }
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-md border ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    if (currentPage < totalPages) {
                      handlePageChange(currentPage + 1)
                    }
                  }}
                  disabled={currentPage >= totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md border ${
                    currentPage >= totalPages
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-900">
                <strong>User: </strong>
                {`${userToDelete.name} ${userToDelete.lastname}`}
              </p>
              <p className="text-sm text-gray-900 mt-1">
                <strong>Phone: </strong>
                {userToDelete.phone_number}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
