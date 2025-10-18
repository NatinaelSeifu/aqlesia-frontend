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
import { useAuth } from "@/hooks/use-auth";
import { Phone, Lock, AlertCircle, Key } from "lucide-react";

interface LoginFormProps {
	onSuccess?: () => void;
	onSwitchToRegister?: () => void;
	onForgotPassword?: () => void;
}

export function LoginForm({
	onSuccess,
	onSwitchToRegister,
	onForgotPassword,
}: LoginFormProps) {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { login, loading } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			await login({ phone_number: phoneNumber, password });
			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent overflow-hidden">
			<CardHeader className="text-center bg-transparent border-b-0">
				<CardTitle className="text-2xl font-bold text-gray-900">
					{"Welcome Back"}
				</CardTitle>
				<CardDescription className="text-gray-600">
					{"Sign in to your Aqlesia account"}
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
							{"ስልክ"}
						</Label>
						<div className="relative">
							<Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
							<Input
								id="phone"
								type="tel"
								placeholder="+251912345678 or 0912345678"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								className="pl-10 bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password" className="text-gray-700 font-medium">
							{"ፓስወርድ"}
						</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
							<Input
								id="password"
								type="password"
								placeholder="ፓስወርድዎን ያስገቡ"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10 bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500"
								required
							/>
						</div>
						{onForgotPassword && (
							<div className="text-right">
								<button
									type="button"
									onClick={onForgotPassword}
									className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
								>
									{"ፓስወርድ ረሱ?"}
								</button>
							</div>
						)}
					</div>

					<Button
						type="submit"
						className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 shadow-lg"
						disabled={loading}
					>
						<Key className="h-4 w-4 mr-2" />
						{loading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-sm text-gray-600">
						{"Don't have an account? "}
						<button
							type="button"
							onClick={onSwitchToRegister}
							className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
						>
							{"Sign up"}
						</button>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
