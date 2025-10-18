"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { 
  HelpCircle, 
  MessageSquare,
  Reply,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { questionsService, type Question, type QuestionStats, QuestionStatus, type QuestionsListResponse } from "@/lib/questions"
import { format } from "date-fns"

export default function AdminQuestionsPage() {
  const { user, loading } = useAuth()
  
  // State management
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  
  // Form states
  const [responseForm, setResponseForm] = useState({ admin_response: "" })

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
      loadData()
    }
  }, [user, currentPage, statusFilter])

  useEffect(() => {
    if (user && user.role === "admin") {
      loadStats()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoadingQuestions(true)
      setError("")
      console.log('Loading questions for admin...')
      
      const response = await questionsService.getQuestions({
        page: currentPage,
        page_size: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        include_user_names: true
      })
      
      console.log('Questions response:', response)
      
      // Handle if response is direct array vs paginated response
      if (Array.isArray(response)) {
        setQuestions(response)
        setTotalQuestions(response.length)
        setHasMore(false)
      } else {
        setQuestions(response.questions || [])
        setTotalQuestions(response.total || 0)
        setHasMore(response.has_more || false)
      }
    } catch (err) {
      console.error('Failed to load questions:', err)
      setError(err instanceof Error ? err.message : "Failed to load questions")
    } finally {
      setLoadingQuestions(false)
    }
  }

  const loadStats = async () => {
    try {
      console.log('Loading question stats...')
      const statsData = await questionsService.getQuestionStats()
      console.log('Stats response:', statsData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load stats:', err)
      // Don't set error for stats, it's not critical
    }
  }

  const handleRespondToQuestion = async () => {
    if (!selectedQuestion || !responseForm.admin_response.trim()) return

    try {
      setError("")
      await questionsService.respondToQuestion(selectedQuestion.id, { 
        admin_response: responseForm.admin_response 
      })
      setSuccess("Response submitted successfully!")
      setTimeout(() => setSuccess(""), 3000)
      setResponseDialogOpen(false)
      setSelectedQuestion(null)
      setResponseForm({ admin_response: "" })
      loadData()
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response")
    }
  }

  const handleUpdateQuestionStatus = async (questionId: string, status: QuestionStatus) => {
    try {
      setError("")
      await questionsService.updateQuestionStatus(questionId, status)
      setSuccess("Question status updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
      loadData()
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  const handleDeleteQuestion = async (question: Question) => {
    try {
      setError("")
      await questionsService.deleteQuestion(question.id)
      setSuccess("Question deleted successfully!")
      setTimeout(() => setSuccess(""), 3000)
      loadData()
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete question")
    }
  }

  const openResponseDialog = (question: Question) => {
    setSelectedQuestion(question)
    setResponseForm({ admin_response: "" })
    setResponseDialogOpen(true)
  }

  const openViewDialog = (question: Question) => {
    setSelectedQuestion(question)
    setViewDialogOpen(true)
  }

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.PENDING:
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case QuestionStatus.ANSWERED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Answered
          </Badge>
        )
      case QuestionStatus.CLOSED:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        )
      case QuestionStatus.CANCELLED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300">
            {status}
          </Badge>
        )
    }
  }

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
      <main className="container mx-auto px-4 py-8 bg-white">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-slate-800">Questions Management</h2>
          <p className="text-blue-600 max-w-2xl mx-auto">Manage and respond to user questions from the church community</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              <strong>Error:</strong> {error}
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">Debug Info</summary>
                <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono">
                  Current User Role: {user?.role || 'undefined'}<br/>
                  Loading State: {loadingQuestions ? 'true' : 'false'}<br/>
                  Questions Count: {questions.length}<br/>
                  API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'}
                </div>
              </details>
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-blue-900">Total</CardTitle>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-blue-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
                <p className="text-sm text-blue-700 mt-1">All questions</p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-amber-900">Pending</CardTitle>
                <div className="p-2 bg-amber-200 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
                <p className="text-sm text-amber-700 mt-1">Awaiting response</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-green-900">Answered</CardTitle>
                <div className="p-2 bg-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{stats.answered}</div>
                <p className="text-sm text-green-700 mt-1">Responses given</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-purple-900">Closed</CardTitle>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-purple-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{stats.closed}</div>
                <p className="text-sm text-purple-700 mt-1">Completed</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-red-900">Cancelled</CardTitle>
                <div className="p-2 bg-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{stats.cancelled}</div>
                <p className="text-sm text-red-700 mt-1">Cancelled</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="mb-8 border-blue-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div>
                  <Label htmlFor="status_filter" className="text-sm font-medium text-blue-700">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value as QuestionStatus | "all")
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="mt-1 !bg-transparent border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-black">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value={QuestionStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={QuestionStatus.ANSWERED}>Answered</SelectItem>
                      <SelectItem value={QuestionStatus.CLOSED}>Closed</SelectItem>
                      <SelectItem value={QuestionStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search" className="text-sm font-medium text-blue-700">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search questions..."
                      className="pl-10 !bg-transparent border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-black placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={loadData} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingQuestions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card className="border-blue-200 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-slate-800 text-xl">User Questions</CardTitle>
                <CardDescription className="text-blue-600">
                  Manage and respond to questions from church members
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingQuestions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-blue-600">Loading questions...</p>
                <p className="text-sm text-blue-500 mt-2">User: {user?.name} ({user?.role})</p>
              </div>
            ) : (
              <div className="bg-white border border-blue-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 border-b border-blue-200">
                      <TableHead className="font-semibold text-slate-800">User</TableHead>
                      <TableHead className="font-semibold text-slate-800">Question</TableHead>
                      <TableHead className="font-semibold text-slate-800">Status</TableHead>
                      <TableHead className="font-semibold text-slate-800">Date</TableHead>
                      <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <HelpCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                          <div className="text-slate-600 text-lg font-medium mb-2">No questions found</div>
                          <div className="text-blue-400">Try adjusting your filters</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question) => (
                        <TableRow key={question.id} className="hover:bg-blue-50 transition-colors border-b border-blue-100">
                          <TableCell className="font-medium text-slate-800">
                            {question.user_name || 'Unknown User'}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            <div className="max-w-md">
                              {question.question.length > 100 
                                ? `${question.question.substring(0, 100)}...`
                                : question.question
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(question.status)}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {format(new Date(question.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewDialog(question)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md"
                                title="View Question"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {question.status === QuestionStatus.PENDING && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openResponseDialog(question)}
                                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-md"
                                  title="Respond to Question"
                                >
                                  <Reply className="h-4 w-4" />
                                </Button>
                              )}

                              {question.status === QuestionStatus.ANSWERED && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateQuestionStatus(question.id, QuestionStatus.CLOSED)}
                                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-md"
                                  title="Close Question"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">Delete Question</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-600">
                                      Are you sure you want to delete this question? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-blue-300 text-blue-700 hover:bg-blue-50">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteQuestion(question)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {questions.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalQuestions)} of {totalQuestions} questions
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMore}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Question Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Question Details</DialogTitle>
              <DialogDescription className="text-blue-600">
                View question from {selectedQuestion?.user_name || 'Unknown User'}
              </DialogDescription>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedQuestion.status)}
                    <span className="text-sm text-blue-600">
                      {format(new Date(selectedQuestion.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-800 mb-2">Question:</h4>
                  <p className="text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {selectedQuestion.question}
                  </p>
                </div>
                
                {selectedQuestion.admin_response && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Response:
                    </h4>
                    <p className="text-slate-700 bg-green-50 p-3 rounded-lg border border-green-200">
                      {selectedQuestion.admin_response}
                    </p>
                    {selectedQuestion.responder_name && (
                      <p className="text-sm text-green-600 mt-2">
                        - {selectedQuestion.responder_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setViewDialogOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Close
              </Button>
              {selectedQuestion && selectedQuestion.status === QuestionStatus.PENDING && (
                <Button onClick={() => {
                  setViewDialogOpen(false)
                  openResponseDialog(selectedQuestion)
                }} className="bg-green-600 hover:bg-green-700 text-white">
                  Respond to Question
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Response Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Respond to Question</DialogTitle>
              <DialogDescription className="text-blue-600">
                Provide a response to {selectedQuestion?.user_name || 'the user'}'s question
              </DialogDescription>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Question:</h4>
                  <p className="text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {selectedQuestion.question}
                  </p>
                </div>
                <div>
                  <Label htmlFor="admin_response" className="text-sm font-medium text-blue-700">Your Response</Label>
                  <Textarea
                    id="admin_response"
                    value={responseForm.admin_response}
                    onChange={(e) => setResponseForm({ admin_response: e.target.value })}
                    className="mt-1 bg-white border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-black placeholder:text-blue-400 rounded-lg"
                    placeholder="Type your response here..."
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-blue-500 mt-1">
                    {responseForm.admin_response.length}/2000 characters
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setResponseDialogOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Cancel
              </Button>
              <Button onClick={handleRespondToQuestion} className="bg-green-600 hover:bg-green-700 text-white">
                Submit Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
