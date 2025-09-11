/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import DynamicHead from '@/components/DynamicHead';
import type { GoogleUser } from '@/lib/google-auth';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
}

export default function LoginPage() {
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [otpCode, setOtpCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'emailCode'>('email');
	const [otpSent, setOtpSent] = useState(false);
	const [emailOtpSent, setEmailOtpSent] = useState(false);
	const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
	const [pageLoading, setPageLoading] = useState(true);

	// Fetch system settings
	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await api.get('/system-settings');
				setSystemSettings(response.data);
			} catch {
				setSystemSettings({ 
					siteTitle: 'JEE Master', 
					siteDescription: 'Comprehensive JEE preparation platform' 
				});
			} finally {
				setPageLoading(false);
			}
		};

		fetchSettings();
	}, []);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			let response;
			
			if (loginMethod === 'email') {
				response = await api.post('/auth/login', { email, password });
			} else if (loginMethod === 'phone') {
				// Phone OTP login
				if (!otpSent) {
					// Send OTP first
					await api.post('/auth/send-login-otp', { phone });
					setOtpSent(true);
					setLoading(false);
					return;
				} else {
					// Verify OTP and login
					response = await api.post('/auth/login', { phone, otpCode });
				}
			} else if (loginMethod === 'emailCode') {
				// Email Code login
				if (!emailOtpSent) {
					// Send email OTP first
					await api.post('/auth/send-email-login-otp', { email });
					setEmailOtpSent(true);
					setLoading(false);
					return;
				} else {
					// Verify email OTP and login
					response = await api.post('/auth/login', { email, otpCode });
				}
			}
			
			if (response && response.data.access_token && response.data.user) {
				login(response.data.access_token, response.data.user);
				
				// Check if user needs profile completion
				if (response.data.user.needsProfileCompletion) {
					window.location.href = '/profile/complete';
					return;
				}
				
				// Redirect based on user role
				if (response.data.user.role === 'ADMIN') {
					window.location.href = '/admin';
				} else if (response.data.user.role === 'EXPERT') {
					window.location.href = '/expert';
				} else {
					window.location.href = '/student';
				}
			} else if (!otpSent && !emailOtpSent) {
				setError('Invalid response from server');
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSuccess = async (googleUser: GoogleUser) => {
		setLoading(true);
		setError(null);

		try {
			const response = await api.post('/auth/google/login', {
				googleId: googleUser.id,
				email: googleUser.email,
				name: googleUser.name,
				picture: googleUser.picture
			});

			const { data } = response;
			if (data.access_token && data.user) {
				login(data.access_token, data.user);
				
				// Check if user needs profile completion
				if (data.user.needsProfileCompletion) {
					window.location.href = '/profile/complete';
					return;
				}
				
				// Redirect based on user role
				if (data.user.role === 'ADMIN') {
					window.location.href = '/admin';
				} else if (data.user.role === 'EXPERT') {
					window.location.href = '/expert';
				} else {
					window.location.href = '/student';
				}
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Google login failed');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleError = (error: Error) => {
		setError('Google authentication failed: ' + error.message);
	};

	const switchLoginMethod = (method: 'email' | 'phone' | 'emailCode') => {
		setLoginMethod(method);
		setError(null);
		setOtpSent(false);
		setEmailOtpSent(false);
		setOtpCode('');
		setPhone('');
		setEmail('');
		setPassword('');
	};

	if (pageLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
					<p className="mt-4 text-gray-900">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<DynamicHead 
				title="Sign In"
				description="Sign in to your JEE Master account and continue your preparation journey"
			/>
			<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
					{/* Header */}
					<div className="text-center">
						<div className="flex justify-center items-center mb-6">
							<Link href="/" className="flex-1">
								<span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
									{systemSettings?.siteTitle || 'JEE Master'}
								</span>
							</Link>
						</div>
						<h2 className="mt-6 text-3xl font-bold text-gray-900">
							Welcome back
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							Sign in to continue your JEE preparation
						</p>
					</div>

				{/* Login Form */}
				<div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
					{/* Login Method Toggle */}
					<div className="flex mb-6 bg-gray-100 rounded-lg p-1">
						<button
							type="button"
							onClick={() => switchLoginMethod('email')}
							className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
								loginMethod === 'email'
									? 'bg-white text-orange-600 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Email & Password
						</button>
						<button
							type="button"
							onClick={() => switchLoginMethod('phone')}
							className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
								loginMethod === 'phone'
									? 'bg-white text-orange-600 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Phone OTP
						</button>
						<button
							type="button"
							onClick={() => switchLoginMethod('emailCode')}
							className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
								loginMethod === 'emailCode'
									? 'bg-white text-orange-600 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							Email Code
						</button>
					</div>

					<form onSubmit={onSubmit} className="space-y-6">
						{loginMethod === 'email' && (
							<>
								{/* Email */}
								<div>
									<label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
										Email Address
									</label>
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
										placeholder="Enter your email"
										value={email}
										onChange={e => setEmail(e.target.value)}
									/>
								</div>

								{/* Password */}
								<div>
									<label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
										Password
									</label>
									<div className="relative">
										<input
											id="password"
											name="password"
											type={showPassword ? "text" : "password"}
											autoComplete="current-password"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12 text-gray-900 bg-white"
											placeholder="Enter your password"
											value={password}
											onChange={e => setPassword(e.target.value)}
										/>
										<button
											type="button"
											className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-800"
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? (
												<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
												</svg>
											) : (
												<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
											)}
										</button>
									</div>
								</div>
							</>
						)}

						{loginMethod === 'phone' && (
							<>
								{/* Phone Number */}
								<div>
									<label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
										Phone Number
									</label>
									<input
										id="phone"
										name="phone"
										type="tel"
										autoComplete="tel"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
										placeholder="Enter your phone number"
										value={phone}
										onChange={e => setPhone(e.target.value)}
										disabled={otpSent}
									/>
								</div>

								{/* OTP Code */}
								{otpSent && (
									<div>
										<label htmlFor="otpCode" className="block text-sm font-semibold text-gray-900 mb-2">
											OTP Code
										</label>
										<input
											id="otpCode"
											name="otpCode"
											type="text"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
											placeholder="Enter 6-digit OTP"
											value={otpCode}
											onChange={e => setOtpCode(e.target.value)}
											maxLength={6}
										/>
										<p className="mt-2 text-sm text-gray-600">
											OTP sent to {phone}. Didn't receive?{' '}
											<button
												type="button"
												onClick={() => {
													setOtpSent(false);
													setOtpCode('');
												}}
												className="text-orange-600 hover:text-orange-500 font-medium"
											>
												Resend
											</button>
										</p>
									</div>
								)}
							</>
						)}

						{loginMethod === 'emailCode' && (
							<>
								{/* Email for Code */}
								<div>
									<label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
										Email Address
									</label>
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
										placeholder="Enter your email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										disabled={emailOtpSent}
									/>
								</div>

								{/* Email OTP Code */}
								{emailOtpSent && (
									<div>
										<label htmlFor="otpCode" className="block text-sm font-semibold text-gray-900 mb-2">
											Verification Code
										</label>
										<input
											id="otpCode"
											name="otpCode"
											type="text"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
											placeholder="Enter 6-digit code"
											value={otpCode}
											onChange={e => setOtpCode(e.target.value)}
											maxLength={6}
										/>
										<p className="mt-2 text-sm text-gray-600">
											Code sent to {email}. Didn't receive?{' '}
											<button
												type="button"
												onClick={() => {
													setEmailOtpSent(false);
													setOtpCode('');
												}}
												className="text-orange-600 hover:text-orange-500 font-medium"
											>
												Resend
											</button>
										</p>
									</div>
								)}
							</>
						)}

						{/* Remember Me & Forgot Password - Only for email/password login */}
						{loginMethod === 'email' && (
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<input
										id="remember-me"
										name="remember-me"
										type="checkbox"
										className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
									/>
									<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 font-medium">
										Remember me
									</label>
								</div>

								<div className="text-sm">
									<Link href="/forgot-password" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
										Forgot your password?
									</Link>
								</div>
							</div>
						)}

						{/* Error Message */}
						{error && (
							<div className="p-4 bg-red-50 border border-red-300 rounded-lg">
								<p className="text-red-900 text-sm font-semibold">{error}</p>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						>
							{loading ? (
								<>
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									{loginMethod === 'phone' && !otpSent ? 'Sending OTP...' : 
									 loginMethod === 'emailCode' && !emailOtpSent ? 'Sending Code...' : 'Signing in...'}
								</>
							) : (
								loginMethod === 'phone' && !otpSent ? 'Send OTP' : 
								loginMethod === 'emailCode' && !emailOtpSent ? 'Send Code' : 'Sign in'
							)}
						</button>
			</form>

					{/* Register Link */}
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-700">
							Don&apos;t have an account?{' '}
							<Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
								Create one here
							</Link>
						</p>
					</div>
				</div>

				{/* Divider */}
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t-2 border-gradient-to-r from-orange-200 via-blue-200 to-orange-200"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-4 py-2 bg-gradient-to-r from-orange-50 to-blue-50 text-gray-700 font-semibold rounded-full border border-gray-200 shadow-sm">
							✨ Or continue with
						</span>
					</div>
				</div>

				{/* Google Sign-In */}
				<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 transform hover:scale-[1.02]">
					<div className="text-center mb-4">
						<h3 className="text-lg font-bold text-gray-800 mb-2">Quick & Secure Login</h3>
						<p className="text-sm text-gray-600">Sign in with your Google account</p>
					</div>
					<GoogleSignInButton
						onSuccess={handleGoogleSuccess}
						onError={handleGoogleError}
						disabled={loading}
					/>
					<div className="mt-4 text-center">
						<p className="text-xs text-gray-500">
							🔒 Your data is protected with Google's security
						</p>
					</div>
				</div>

				{/* Quick Access Info */}
				<div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
					<h3 className="text-sm font-semibold text-orange-900 mb-4 text-center">Quick Access</h3>
					<div className="grid grid-cols-3 gap-4 text-xs">
						<div className="text-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mx-auto mb-2">
								<span className="text-orange-600 text-xl">👨‍🎓</span>
							</div>
							<div className="font-bold text-gray-900 text-sm">Students</div>
							<div className="text-gray-700">Practice & Learn</div>
						</div>
						<div className="text-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mx-auto mb-2">
								<span className="text-orange-600 text-xl">👨‍🏫</span>
							</div>
							<div className="font-bold text-gray-900 text-sm">Experts</div>
							<div className="text-gray-700">Create Content</div>
						</div>
						<div className="text-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mx-auto mb-2">
								<span className="text-orange-600 text-xl">⚙️</span>
							</div>
							<div className="font-bold text-gray-900 text-sm">Admins</div>
							<div className="text-gray-700">Manage Platform</div>
						</div>
					</div>
				</div>

				{/* Features Preview */}
				<div className="text-center">
					<p className="text-sm text-gray-600 mb-4 font-medium">Join thousands of successful JEE aspirants</p>
					<div className="flex justify-center space-x-6 text-sm">
						<div className="flex items-center">
							<div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
							<span className="text-gray-900 font-semibold">50K+ Questions</span>
						</div>
						<div className="flex items-center">
							<div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
							<span className="text-gray-900 font-semibold">AI-Powered</span>
						</div>
						<div className="flex items-center">
							<div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
							<span className="text-gray-900 font-semibold">25K+ Students</span>
						</div>
					</div>
				</div>

				{/* Back to Home */}
				<div className="text-center">
					<Link href="/" className="text-sm text-gray-800 font-medium hover:text-orange-600 transition-colors">
						← Back to homepage
					</Link>
				</div>
				</div>
		</div>
		</>
	);
} 
