"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
	HelpCircle,
	Plus,
	Edit,
	Trash2,
	Clock,
	CheckCircle,
	XCircle,
	MessageCircle,
	RefreshCw,
	User,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	questionsService,
	type Question,
	type QuestionStats,
	QuestionStatus,
	type QuestionsListResponse,
} from "@/lib/questions";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";

export default function QuestionsPage() {
	const { user, loading } = useAuth();

	// State management
	const [questions, setQuestions] = useState<Question[]>([]);
	const [stats, setStats] = useState<QuestionStats | null>(null);
	const [loadingQuestions, setLoadingQuestions] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const pageSize = 3;

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
		null
	);

	// Form states
	const [createForm, setCreateForm] = useState({ question: "" });
	const [editForm, setEditForm] = useState({ question: "" });

	useEffect(() => {
		if (!loading && !user) {
			redirect("/");
		}
	}, [user, loading]);

	useEffect(() => {
		if (user) {
			loadData();
		}
	}, [user]);

	const loadData = async (page: number = currentPage) => {
		try {
			setLoadingQuestions(true);
			setError("");
			const [questionsData, statsData] = await Promise.all([
				questionsService.getMyQuestionsPaginated(page, pageSize),
				questionsService.getMyQuestionStats(),
			]);
			setQuestions(questionsData.questions);
			setStats(statsData);
			setCurrentPage(questionsData.page);
			setTotalPages(Math.ceil(questionsData.total / pageSize));
			setHasMore(questionsData.has_more);
			console.log("Pagination debug:", {
				questions: questionsData.questions.length,
				total: questionsData.total,
				page: questionsData.page,
				totalPages: Math.ceil(questionsData.total / pageSize),
				hasMore: questionsData.has_more,
			});
		} catch (err) {
			console.error("Failed to load questions:", err);
			setError(err instanceof Error ? err.message : "Failed to load questions");
			setQuestions([]); // Ensure questions is always an array
		} finally {
			setLoadingQuestions(false);
		}
	};

	const handleCreateQuestion = async () => {
		if (!createForm.question.trim()) {
			setError("Please enter a question");
			return;
		}

		try {
			setError("");
			await questionsService.createQuestion({ question: createForm.question });
			setSuccess("Question submitted successfully!");
			setTimeout(() => setSuccess(""), 3000);
			setCreateDialogOpen(false);
			setCreateForm({ question: "" });
			loadData();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit question"
			);
		}
	};

	const handleEditQuestion = async () => {
		if (!selectedQuestion || !editForm.question.trim()) return;

		try {
			setError("");
			await questionsService.updateMyQuestion(selectedQuestion.id, {
				question: editForm.question,
			});
			setSuccess("Question updated successfully!");
			setTimeout(() => setSuccess(""), 3000);
			setEditDialogOpen(false);
			setSelectedQuestion(null);
			setEditForm({ question: "" });
			loadData();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to update question"
			);
		}
	};

	const handleDeleteQuestion = async (question: Question) => {
		try {
			setError("");
			await questionsService.deleteMyQuestion(question.id);
			setSuccess("Question deleted successfully!");
			setTimeout(() => setSuccess(""), 3000);
			loadData();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete question"
			);
		}
	};

	const openEditDialog = (question: Question) => {
		setSelectedQuestion(question);
		setEditForm({ question: question.question });
		setEditDialogOpen(true);
	};

	const handlePageChange = async (page: number) => {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			await loadData(page);
		}
	};

	const getStatusBadge = (status: QuestionStatus) => {
		switch (status) {
			case QuestionStatus.PENDING:
				return (
					<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
						<Clock className="h-3 w-3 mr-1" />
						Pending
					</Badge>
				);
			case QuestionStatus.ANSWERED:
				return (
					<Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
						<CheckCircle className="h-3 w-3 mr-1" />
						Answered
					</Badge>
				);
			case QuestionStatus.CLOSED:
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
						<XCircle className="h-3 w-3 mr-1" />
						Closed
					</Badge>
				);
			case QuestionStatus.CANCELLED:
				return (
					<Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
						<XCircle className="h-3 w-3 mr-1" />
						Cancelled
					</Badge>
				);
			default:
				return (
					<Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300">
						{status}
					</Badge>
				);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="min-h-screen bg-white">
			<DashboardHeader />

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8 bg-white">
				<div className="mb-8 text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-4">
						<HelpCircle className="h-8 w-8 text-white" />
					</div>
					<h2 className="text-3xl font-bold mb-2 text-slate-800">
						My Questions
					</h2>
					<p className="text-blue-600 max-w-2xl mx-auto">
						Ask questions and get answers from the church administration
					</p>
				</div>

				{/* Alerts */}
				{error && (
					<Alert
						variant="destructive"
						className="mb-6 border-red-200 bg-red-50"
					>
						<AlertDescription className="text-red-700">
							{error}
						</AlertDescription>
					</Alert>
				)}

				{success && (
					<Alert className="mb-6 border-green-200 bg-green-50">
						<AlertDescription className="text-green-700">
							{success}
						</AlertDescription>
					</Alert>
				)}

				{/* Stats Cards */}
				{stats && (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-base font-semibold text-blue-900">
									Total Questions
								</CardTitle>
								<div className="p-2 bg-blue-200 rounded-lg">
									<HelpCircle className="h-5 w-5 text-blue-700" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900">
									{stats.total}
								</div>
								<p className="text-sm text-blue-700 mt-1">
									Questions submitted
								</p>
							</CardContent>
						</Card>

						<Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-base font-semibold text-amber-900">
									Pending
								</CardTitle>
								<div className="p-2 bg-amber-200 rounded-lg">
									<Clock className="h-5 w-5 text-amber-700" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-amber-900">
									{stats.pending}
								</div>
								<p className="text-sm text-amber-700 mt-1">Awaiting response</p>
							</CardContent>
						</Card>

						<Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-base font-semibold text-green-900">
									Answered
								</CardTitle>
								<div className="p-2 bg-green-200 rounded-lg">
									<CheckCircle className="h-5 w-5 text-green-700" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900">
									{stats.answered}
								</div>
								<p className="text-sm text-green-700 mt-1">
									Received responses
								</p>
							</CardContent>
						</Card>

						<Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-base font-semibold text-purple-900">
									Closed
								</CardTitle>
								<div className="p-2 bg-purple-200 rounded-lg">
									<XCircle className="h-5 w-5 text-purple-700" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-900">
									{stats.closed}
								</div>
								<p className="text-sm text-purple-700 mt-1">
									Completed questions
								</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-semibold text-slate-800">
						Your Questions
					</h3>
					<div className="flex gap-3">
						<Button
							onClick={() => loadData(currentPage)}
							className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg"
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${
									loadingQuestions ? "animate-spin" : ""
								}`}
							/>
							Refresh
						</Button>

						<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
							<DialogTrigger asChild>
								<Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg">
									<Plus className="h-4 w-4 mr-2" />
									Ask Question
								</Button>
							</DialogTrigger>
							<DialogContent className="bg-white">
								<DialogHeader>
									<DialogTitle className="text-slate-800">
										Ask a Question
									</DialogTitle>
									<DialogDescription className="text-blue-600">
										Submit your question and get an answer from the church
										administration.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<Label
											htmlFor="create_question"
											className="text-sm font-medium text-blue-700"
										>
											Your Question
										</Label>
										<Textarea
											id="create_question"
											value={createForm.question}
											onChange={(e) =>
												setCreateForm({ question: e.target.value })
											}
											className="mt-1 bg-transparent border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder:text-blue-500 rounded-lg"
											placeholder="Type your question here..."
											rows={4}
											maxLength={1000}
										/>
										<p className="text-xs text-blue-500 mt-1">
											{createForm.question.length}/1000 characters
										</p>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={() => setCreateDialogOpen(false)}
										className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 border-0 font-medium shadow-sm"
									>
										Cancel
									</Button>
									<Button
										onClick={handleCreateQuestion}
										className="bg-amber-600 hover:bg-amber-700 text-white"
									>
										Submit Question
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* Questions List */}
				<div className="space-y-4">
					{loadingQuestions ? (
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : !questions || questions.length === 0 ? (
						<Card className="border-blue-200 shadow-sm bg-white">
							<CardContent className="flex flex-col items-center justify-center py-16">
								<HelpCircle className="h-16 w-16 text-blue-400 mb-4" />
								<h3 className="text-xl font-semibold text-slate-700 mb-2">
									No questions yet
								</h3>
								<p className="text-blue-600 text-center mb-6">
									you can ask any question for ቀሲስ, so ቀሲስ will answer it.
								</p>
								<Button
									onClick={() => setCreateDialogOpen(true)}
									className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
								>
									<Plus className="h-4 w-4 mr-2" />
									Ask Your First Question
								</Button>
							</CardContent>
						</Card>
					) : (
						questions.map((question) => (
							<Card
								key={question.id}
								className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-blue-50"
							>
								<CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-lg">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl shadow-sm">
												<MessageCircle className="h-6 w-6 text-amber-600" />
											</div>
											<div>
												<div className="flex items-center gap-3 mb-1">
													{getStatusBadge(question.status)}
													<div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
														<Clock className="h-3 w-3" />
														{format(
															new Date(question.created_at),
															"MMM d, yyyy"
														)}
													</div>
												</div>
											</div>
										</div>
										{question.status === QuestionStatus.PENDING && (
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openEditDialog(question)}
													className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent className="bg-white">
														<AlertDialogHeader>
															<AlertDialogTitle className="text-red-600">
																Delete Question
															</AlertDialogTitle>
															<AlertDialogDescription className="text-slate-600">
																Are you sure you want to delete this question?
																This action cannot be undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 border-0 font-medium shadow-sm">
																Cancel
															</AlertDialogCancel>
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
										)}
									</div>
								</CardHeader>
								<CardContent className="p-6">
									<div className="space-y-6">
										<div>
											<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
												<MessageCircle className="h-4 w-4 text-amber-600" />
												Your Question:
											</h4>
											<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
												<p className="text-blue-900 leading-relaxed">
													{question.question}
												</p>
											</div>
										</div>

										{question.admin_response && (
											<div>
												<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
													<CheckCircle className="h-4 w-4 text-green-600" />
													Response:
												</h4>
												<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 shadow-sm">
													<p className="text-green-900 leading-relaxed">
														{question.admin_response}
													</p>
													{question.responder_name && (
														<div className="mt-3 pt-3 border-t border-green-200">
															<p className="text-sm font-medium text-green-700 flex items-center gap-1">
																<User className="h-3 w-3" />
																{question.responder_name}
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>

				{/* Pagination */}
				{questions && questions.length > 0 && (
					<div className="mt-4 text-center">
						<p className="text-sm text-slate-600 mb-2">
							Page {currentPage} of {totalPages} | Total Questions Available:{" "}
							{totalPages * pageSize} | Current Page: {questions.length} items
						</p>
					</div>
				)}
				{questions && totalPages > 1 && (
					<div className="mt-8">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => handlePageChange(currentPage - 1)}
										className={
											currentPage <= 1
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>

								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<PaginationItem key={page}>
											<PaginationLink
												onClick={() => handlePageChange(page)}
												isActive={currentPage === page}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									)
								)}

								<PaginationItem>
									<PaginationNext
										onClick={() => handlePageChange(currentPage + 1)}
										className={
											currentPage >= totalPages
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}

				{/* Edit Dialog */}
				<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
					<DialogContent className="bg-white">
						<DialogHeader>
							<DialogTitle className="text-slate-800">
								Edit Question
							</DialogTitle>
							<DialogDescription className="text-blue-600">
								Update your question. You can only edit pending questions.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label
									htmlFor="edit_question"
									className="text-sm font-medium text-blue-700"
								>
									Your Question
								</Label>
								<Textarea
									id="edit_question"
									value={editForm.question}
									onChange={(e) => setEditForm({ question: e.target.value })}
									className="mt-1 bg-transparent border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder:text-blue-500 rounded-lg"
									placeholder="Type your question here..."
									rows={4}
									maxLength={1000}
								/>
								<p className="text-xs text-blue-500 mt-1">
									{editForm.question.length}/1000 characters
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={() => setEditDialogOpen(false)}
								className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 border-0 font-medium shadow-sm"
							>
								Cancel
							</Button>
							<Button
								onClick={handleEditQuestion}
								className="bg-blue-600 hover:bg-blue-700 text-white"
							>
								Update Question
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
}
