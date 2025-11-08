"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import type { ForgotPasswordRequest } from "@/lib/auth";
import { VerifyOTP } from "./verify-otp";
import { ResetPassword } from "./reset-password";
import {
	Phone,
	AlertCircle,
	CheckCircle,
	KeyRound,
	ArrowLeft,
	MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ForgotPasswordProps {
	onBack?: () => void;
	onSuccess?: () => void;
	onShowTelegramLink?: (phoneNumber: string) => void;
}

type FlowStep = "request" | "verify-otp" | "reset-password"

export function ForgotPassword({
	onBack,
	onSuccess,
	onShowTelegramLink,
}: ForgotPasswordProps) {
	const [step, setStep] = useState<FlowStep>("request");
	const [formData, setFormData] = useState<ForgotPasswordRequest>({
		phone_number: "",
	});
	const [resetToken, setResetToken] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const t = useTranslations();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);
		setMessage("");

		if (!formData.phone_number.trim()) {
			setError("ስልክ ሰክ ዘሩሪ");
			return;
		}

		try {
			setLoading(true);
			const response = await authService.forgotPassword(formData);
			setMessage(response.message);
			// Move to OTP verification step
			setStep("verify-otp");
		} catch (err) {
			setError(err instanceof Error ? err.message : "የፓስወርድ እርሳት ማግኘት ተስኖ");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (field: keyof ForgotPasswordRequest, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleOTPVerified = (token: string) => {
		setResetToken(token);
		setStep("reset-password");
	};

	const handleBackToRequest = () => {
		setStep("request");
		setError("");
		setMessage("");
	};

	const handleBackToOTP = () => {
		setStep("verify-otp");
		setError("");
	};

	const handleResendOTP = async () => {
		setError("");
		setMessage("");
		setLoading(true);

		try {
			const response = await authService.forgotPassword(formData);
			setMessage(response.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : "OTP resend failed");
		} finally {
			setLoading(false);
		}
	};

	const handleResetSuccess = () => {
		setSuccess(true);
		setTimeout(() => {
			onSuccess?.();
		}, 2000);
	};

	// Show different components based on the current step
	if (step === "verify-otp") {
		return (
			<VerifyOTP
				phoneNumber={formData.phone_number}
				onBack={handleBackToRequest}
				onSuccess={handleOTPVerified}
				onResendOTP={handleResendOTP}
			/>
		);
	}

	if (step === "reset-password" && resetToken) {
		return (
			<ResetPassword
				token={resetToken}
				onSuccess={handleResetSuccess}
				onError={(error) => {
					setError(error);
					setStep("verify-otp"); // Go back to OTP verification on error
				}}
			/>
		);
	}

	if (success) {
		return (
			<Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
				<CardContent className="p-8">
					<div className="text-center space-y-6">
						<div className="flex justify-center">
							<div className="p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full">
								<CheckCircle className="h-12 w-12 text-green-600" />
							</div>
						</div>
						<div>
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								{"Password Reset Successfully!"}
							</h3>
							<p className="text-gray-600 text-sm mb-2">{"Password has been reset successfully. You can now login with your new password."}</p>
							<p className="text-blue-600 text-sm font-medium">{"Redirecting to login page..."}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
			<CardHeader className="text-center bg-transparent border-b-0">
				<div className="flex justify-center mb-4">
					<div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
						<KeyRound className="h-6 w-6 text-white" />
					</div>
				</div>
				<CardTitle className="text-2xl font-bold text-gray-900">
					{t("auth.forgot.title")}
				</CardTitle>
				<CardDescription className="text-gray-600">
					{t("auth.forgot.desc")}
				</CardDescription>
			</CardHeader>
			<CardContent className="p-8">
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<Alert variant="destructive" className="border-red-200 bg-red-50">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription className="text-red-700">
								{error}
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="phone" className="text-gray-700 font-medium">
							{t("auth.phone")}
						</Label>
						<div className="relative">
							<Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
							<Input
								id="phone"
								type="tel"
								placeholder={t("auth.forgot.phonePlaceholder")}
								value={formData.phone_number}
								onChange={(e) => handleChange("phone_number", e.target.value)}
								className="pl-10 bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								required
							/>
						</div>
					</div>

					{/* Information about Telegram requirement */}
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<div className="flex items-start">
							<MessageCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
							<div>
								<h4 className="font-medium text-yellow-900 mb-1">
									{t("auth.forgot.telegramRequiredTitle")}
								</h4>
								<p className="text-yellow-800 text-sm mb-2">
									{t("auth.forgot.telegramInfo")}
								</p>
								{onShowTelegramLink && (
									<button
										type="button"
										onClick={() => onShowTelegramLink(formData.phone_number)}
										className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
									>
										{t("auth.forgot.telegramLink")}
									</button>
								)}
							</div>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 shadow-lg"
						disabled={loading}
					>
						<KeyRound className="h-4 w-4 mr-2" />
						{loading ? t("auth.forgot.sendingOtp") : t("auth.forgot.sendOtp")}
					</Button>
				</form>

				{onBack && (
					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={onBack}
							className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
						>
							<ArrowLeft className="h-4 w-4 mr-1 inline" />
							{t("auth.forgot.backToLogin")}
						</button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
