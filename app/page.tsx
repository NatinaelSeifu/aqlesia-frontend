"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { TelegramLink } from "@/components/auth/telegram-link";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type AuthView = "login" | "register" | "forgot-password" | "telegram-link";

export default function HomePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, loading } = useAuth();
	const t = useTranslations();

	// Get initial view from URL or default to login
	const getInitialView = (): AuthView => {
		const viewParam = searchParams.get("view");
		if (
			viewParam &&
			["login", "register", "forgot-password", "telegram-link"].includes(
				viewParam
			)
		) {
			return viewParam as AuthView;
		}
		return "login";
	};

	const [currentView, setCurrentView] = useState<AuthView>(getInitialView());
	const [phoneNumber, setPhoneNumber] = useState(
		searchParams.get("phone") || ""
	);

	// Update URL when view changes
	const updateURL = (view: AuthView, phone?: string) => {
		const params = new URLSearchParams();
		params.set("view", view);
		if (phone) {
			params.set("phone", phone);
		}
		const newURL = `${window.location.pathname}?${params.toString()}`;
		window.history.replaceState(null, "", newURL);
	};

	// Helper to change view and update URL
	const changeView = (view: AuthView, phone?: string) => {
		setCurrentView(view);
		updateURL(view, phone);
		if (phone) setPhoneNumber(phone);
	};

	useEffect(() => {
		if (!loading && user) {
			router.push("/dashboard");
		}
	}, [user, loading, router]);

	// Sync with URL changes
	useEffect(() => {
		const newView = getInitialView();
		const phoneParam = searchParams.get("phone") || "";
		if (newView !== currentView || phoneParam !== phoneNumber) {
			setCurrentView(newView);
			setPhoneNumber(phoneParam);
		}
	}, [searchParams]);

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (user) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const handleLoginSuccess = () => {
		router.push("/dashboard");
	};

	const handleForgotPassword = () => {
		changeView("forgot-password");
	};

	const handleBackToLogin = () => {
		changeView("login");
	};

	const handleForgotPasswordSuccess = () => {
		// After successful password reset, return to login view
		changeView("login")
	};

	const handleShowTelegramLink = (phone?: string) => {
		changeView("telegram-link", phone);
	};

	const handleTelegramLinkSuccess = () => {
		// Don't auto-navigate - let user choose next action
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex">
			{/* Left side - Clean Virgin Mary Background */}
			<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
				{/* Background Image */}
				<div className="absolute inset-0">
					<Image
						src="/virgin-marry.png"
						alt={t("home.maryAlt")}
						fill
						className="object-cover"
						priority
					/>
				</div>
			</div>

			{/* Right side - Auth Forms */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
				<div className="w-full max-w-md">

					{currentView === "login" && (
						<LoginForm
							onSuccess={handleLoginSuccess}
							onSwitchToRegister={() => changeView("register")}
							onForgotPassword={handleForgotPassword}
						/>
					)}
					{currentView === "register" && (
						<RegisterForm
							onSuccess={() => changeView("login")}
							onSwitchToLogin={() => changeView("login")}
						/>
					)}
					{currentView === "forgot-password" && (
						<ForgotPassword
							onBack={handleBackToLogin}
							onSuccess={handleForgotPasswordSuccess}
							onShowTelegramLink={handleShowTelegramLink}
						/>
					)}
					{currentView === "telegram-link" && (
						<TelegramLink
							phoneNumber={phoneNumber}
							onBack={handleBackToLogin}
							onSuccess={handleTelegramLinkSuccess}
							onReturnToForgotPassword={() =>
								changeView("forgot-password", phoneNumber)
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
