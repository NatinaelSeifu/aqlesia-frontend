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
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	MessageCircle,
	Mail,
	Phone,
	MessageSquare,
	Calendar as CalendarIcon,
	Info,
	Church,
	Heart,
	Users,
	Star,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useToast } from "@/components/ui/use-toast";
import {
	Communion,
	CreateCommunionRequest,
	communionService,
} from "@/lib/communion";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

export default function CommunionPage() {
	const { user, loading } = useAuth();
	const { toast } = useToast();
	const t = useTranslations();

	// State for communion request
	const [communionDate, setCommunionDate] = useState<Date | undefined>(
		undefined
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userCommunions, setUserCommunions] = useState<Communion[]>([]);
	const [loadingCommunions, setLoadingCommunions] = useState(true);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	// Load user communions
	useEffect(() => {
		if (user) {
			loadUserCommunions();
		}
	}, [user]);

	useEffect(() => {
		if (!loading && !user) {
			redirect("/");
		}
	}, [user, loading]);

	const loadUserCommunions = async () => {
		try {
			setLoadingCommunions(true);
			const response = await communionService.getUserCommunions();
			setUserCommunions(response.communions);
			// Reset to first page when reloading data
			setCurrentPage(1);
		} catch (error) {
			console.error("Failed to load communions:", error);
			toast({
				title: t("communion.toasts.loadErrorTitle"),
				description: error instanceof Error ? error.message : t("communion.toasts.tryAgain"),
				variant: "destructive",
			});
		} finally {
			setLoadingCommunions(false);
		}
	};

	// Pagination calculations
	const totalPages = Math.ceil(userCommunions.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentCommunions = userCommunions.slice(startIndex, endIndex);

	const goToPage = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const goToPreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const goToNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	const handleSubmitCommunion = async () => {
		if (!communionDate) {
			toast({
				title: t("communion.toasts.dateRequiredTitle"),
				description: t("communion.toasts.dateRequiredDesc"),
				variant: "destructive",
			});
			return;
		}

		// Convert date to YYYY-MM-DD format
		const formattedDate = format(communionDate, "yyyy-MM-dd");

		try {
			setIsSubmitting(true);
			const request: CreateCommunionRequest = {
				communion_date: formattedDate,
			};

			await communionService.createCommunion(request);
			toast({
				title: t("communion.toasts.submitSuccessTitle"),
				description: t("communion.toasts.submitSuccessDesc"),
				variant: "default",
			});

			// Reset form and reload communions
			setCommunionDate(undefined);
			loadUserCommunions();
		} catch (error) {
			console.error("Failed to submit communion request:", error);
			toast({
				title: t("communion.toasts.submitErrorTitle"),
				description: error instanceof Error ? error.message : t("communion.toasts.tryAgain"),
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="min-h-screen bg-white">
			<DashboardHeader />

			{/* Main Content */}
			<main className="container mx-auto px-6 py-12 bg-white min-h-screen max-w-4xl">
				<div className="mb-12 text-center">
					<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
						<Church className="h-10 w-10 text-white" />
					</div>
					<h1 className="text-4xl font-light mb-4 text-gray-900">
						{t("communion.header.title")}
					</h1>
					<p className="text-gray-600 text-lg max-w-xl mx-auto leading-relaxed">
						{t("communion.header.subtitle")}
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
					{/* Request Communion Card */}
					<Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center space-x-3 text-gray-900 text-lg">
								<div className="p-2 bg-blue-100 rounded-lg">
									<CalendarIcon className="h-5 w-5 text-blue-600" />
								</div>
								<span>{t("communion.request.title")}</span>
							</CardTitle>
								<CardDescription className="text-gray-600">
									{t("communion.request.desc")}
								</CardDescription>
						</CardHeader>
						<CardContent className="p-6">
							<div className="space-y-6">
								<div className="text-center">
									<Label className="text-sm font-medium text-gray-700 mb-4 block">
										{t("communion.request.lastTakenLabel")}
									</Label>
									<div className="border border-gray-300 rounded-xl p-4 bg-gray-50 inline-block">
										<Calendar
											mode="single"
											selected={communionDate}
											onSelect={setCommunionDate}
											disabled={(date) => {
												// Disable future dates
												return date > new Date();
											}}
											className="mx-auto scale-90 text-gray-900 [&_button]:text-gray-900 [&_button:hover]:bg-blue-100 [&_button[aria-selected='true']]:bg-blue-600 [&_button[aria-selected='true']]:text-white"
										/>
									</div>
									{communionDate && (
										<div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 inline-block">
											<p className="text-sm text-blue-800 font-medium">
												✓ {t("communion.request.selectedPrefix")} {format(communionDate, "MMMM d, yyyy")}
											</p>
										</div>
									)}
								</div>
								<div className="text-center">
									<div className="inline-flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-left max-w-sm">
										<Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
										<p className="text-xs text-amber-700">
											{t("communion.request.onlyPastInfo")}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
						<CardFooter className="p-6 pt-0">
							<div className="flex flex-col gap-3 w-full">
								<Button
									onClick={handleSubmitCommunion}
									disabled={!communionDate || isSubmitting}
									className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 font-medium"
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
											{t("communion.request.submitting")}
										</>
									) : (
										<>
											<Heart className="h-4 w-4 mr-2" />
											{t("communion.request.submitButton")}
										</>
									)}
								</Button>
								{communionDate && (
									<Button
										variant="outline"
										onClick={() => setCommunionDate(undefined)}
										disabled={isSubmitting}
										className="border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
										size="sm"
									>
										{t("communion.request.clearSelection")}
									</Button>
								)}
							</div>
						</CardFooter>
					</Card>

					{/* User's Communion History */}
					<Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center space-x-3 text-gray-900 text-lg">
								<div className="p-2 bg-gray-100 rounded-lg">
									<MessageSquare className="h-5 w-5 text-gray-600" />
								</div>
								<span>{t("communion.history.title")}</span>
							</CardTitle>
								<CardDescription className="text-gray-600">
									{t("communion.history.desc")}
								</CardDescription>
						</CardHeader>
						<CardContent className="p-6">
							{loadingCommunions ? (
								<div className="py-8 flex flex-col items-center justify-center">
									<div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-3"></div>
									<p className="text-gray-500 text-sm">{t("communion.history.loading")}</p>
								</div>
							) : userCommunions.length === 0 ? (
								<div className="text-center py-8">
									<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
										<MessageSquare className="h-6 w-6 text-gray-400" />
									</div>
									<p className="text-gray-600 mb-1 text-sm">{t("communion.history.emptyTitle")}</p>
									<p className="text-xs text-gray-500">
										{t("communion.history.emptyDesc")}
									</p>
								</div>
							) : (
								<>
									{/* Pagination Info */}
									{userCommunions.length > itemsPerPage && (
										<div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
											<p className="text-sm text-gray-600">
												Showing {startIndex + 1}-
												{Math.min(endIndex, userCommunions.length)} of{" "}
																	{userCommunions.length} {t("communion.history.requests")}
											</p>
															<div className="text-xs text-gray-500">
																{t("communion.pagination.pageOf", {current: currentPage, total: totalPages})}
															</div>
										</div>
									)}

									{/* Communion List */}
									<div className="space-y-3">
										{currentCommunions.map((communion) => {
											const isApproved = communion.status === "approved";
											const isRejected = communion.status === "rejected";
											const isPending = communion.status === "pending";

											return (
												<div
													key={communion.id}
													className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow"
												>
													<div className="flex justify-between items-start mb-2">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<CalendarIcon className="h-3 w-3 text-gray-500" />
																<p className="font-medium text-gray-900 text-sm">
																	{new Date(
																		communion.communion_date
																	).toLocaleDateString("en-US", {
																		year: "numeric",
																		month: "long",
																		day: "numeric",
																	})}
																</p>
															</div>
															<p className="text-xs text-gray-500">
																{t("communion.history.requested")}{" "}
																{new Date(
																	communion.requested_at
																).toLocaleDateString("en-US", {
																	month: "short",
																	day: "numeric",
																})}
															</p>
														</div>
														<div
															className={`px-2 py-1 rounded-md text-xs font-medium ${
																isApproved
																	? "bg-green-100 text-green-700"
																	: isRejected
																	? "bg-red-100 text-red-700"
																	: "bg-amber-100 text-amber-700"
															}`}
														>
															{isApproved && "✓ "}
															{isRejected && "✗ "}
															{isPending && "⏳ "}
															{t(`communion.status.${communion.status}`)}
														</div>
													</div>
													{communion.status !== "pending" &&
														communion.approved_by && (
															<div className="pt-2 border-t border-gray-100">
																<p className="text-xs text-gray-500">
																{communion.status === "approved" ? t("communion.history.approved") : t("communion.history.rejected")} {t("communion.history.byName", {name: communion.approved_by.name})}
																</p>
															</div>
														)}
												</div>
											);
										})}
									</div>

									{/* Pagination Controls */}
									{totalPages > 1 && (
										<div className="mt-6 pt-4 border-t border-gray-100">
											<div className="flex items-center justify-center space-x-2">
												{/* Previous Button */}
												<Button
													variant="ghost"
													size="sm"
													onClick={goToPreviousPage}
													disabled={currentPage === 1}
													className="h-8 w-8 p-0 text-black hover:text-black disabled:text-gray-400 border-none bg-transparent hover:bg-transparent"
												>
													<ChevronLeft className="h-4 w-4" />
												</Button>

												{/* Page Numbers */}
												<div className="flex space-x-1">
													{Array.from(
														{ length: totalPages },
														(_, i) => i + 1
													).map((pageNumber) => {
														const isCurrentPage = pageNumber === currentPage;
														const showPage =
															pageNumber === 1 ||
															pageNumber === totalPages ||
															Math.abs(pageNumber - currentPage) <= 1;

														if (!showPage) {
															if (pageNumber === 2 && currentPage > 4) {
																return (
																	<span
																		key={pageNumber}
																		className="px-2 py-1 text-gray-400 text-sm"
																	>
																		...
																	</span>
																);
															}
															if (
																pageNumber === totalPages - 1 &&
																currentPage < totalPages - 3
															) {
																return (
																	<span
																		key={pageNumber}
																		className="px-2 py-1 text-gray-400 text-sm"
																	>
																		...
																	</span>
																);
															}
															return null;
														}

														return (
															<Button
																key={pageNumber}
																variant={isCurrentPage ? "default" : "ghost"}
																size="sm"
																onClick={() => goToPage(pageNumber)}
																className={`h-8 w-8 p-0 text-sm ${
																	isCurrentPage
																		? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
																		: "text-black hover:text-black border-none bg-transparent hover:bg-transparent"
																}`}
															>
																{pageNumber}
															</Button>
														);
													})}
												</div>

												{/* Next Button */}
												<Button
													variant="ghost"
													size="sm"
													onClick={goToNextPage}
													disabled={currentPage === totalPages}
													className="h-8 w-8 p-0 text-black hover:text-black disabled:text-gray-400 border-none bg-transparent hover:bg-transparent"
												>
													<ChevronRight className="h-4 w-4" />
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</CardContent>
						<CardFooter className="p-6 pt-0">
							<Button
								variant="default"
								className="w-full bg-green-500 hover:bg-green-600 text-black hover:text-black text-sm transition-colors border-none"
								onClick={loadUserCommunions}
								disabled={loadingCommunions}
								size="sm"
							>
								<RefreshCw
									className={`h-3 w-3 mr-2 text-black ${
										loadingCommunions ? "animate-spin" : ""
									}`}
								/>
											{loadingCommunions ? t("common.refreshing") : t("common.refresh")}
							</Button>
						</CardFooter>
					</Card>
				</div>
			</main>
		</div>
	);
}
