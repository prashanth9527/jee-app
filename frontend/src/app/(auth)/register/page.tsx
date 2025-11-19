/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import DynamicHead from '@/components/DynamicHead';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicLogo from '@/components/DynamicLogo';
import type { GoogleUser } from '@/lib/google-auth';

interface Stream {
  id: string;
  name: string;
  description: string;
  code: string;
  _count: {
    subjects: number;
    users: number;
  };
}

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  faviconUrl?: string;
  siteKeywords?: string;
  ogImage?: string;
  companyName?: string;
}

function RegisterForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [streamId, setStreamId] = useState('');
	const [referralCode, setReferralCode] = useState('');
	const [streams, setStreams] = useState<Stream[]>([]);
	const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);
	const [validatingCode, setValidatingCode] = useState(false);
	const [codeValid, setCodeValid] = useState<boolean | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [isRegistering, setIsRegistering] = useState(false);
	const [agreeToTerms, setAgreeToTerms] = useState(false);

	// Fetch available streams and system settings
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [streamsRes, settingsRes] = await Promise.all([
					api.get('/streams'),
					api.get('/system-settings').catch(() => ({ data: { siteTitle: 'JEE Master', siteDescription: 'Comprehensive JEE preparation platform' } }))
				]);
				setStreams(streamsRes.data);
				setSystemSettings(settingsRes.data);
			} catch { // error
				console.error('Error fetching data:', error);
				setError('Failed to load registration form. Please refresh the page.');
				setSystemSettings({ siteTitle: 'JEE Master', siteDescription: 'Comprehensive JEE preparation platform' });
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Check for referral code in URL
	useEffect(() => {
		if (searchParams) {
			const ref = searchParams.get('ref');
			if (ref) {
				setReferralCode(ref);
				validateReferralCode(ref);
			}
		}
	}, [searchParams]);

	const validateReferralCode = async (code: string) => {
		if (!code) return;
		
		try {
			setValidatingCode(true);
			const response = await api.get(`/referrals/validate/${code}`);
			setCodeValid(response.data.valid);
		} catch { // error
			setCodeValid(false);
		} finally {
			setValidatingCode(false);
		}
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsRegistering(true);
		
		// Validate required fields
		if (!fullName.trim()) {
			setError('Full name is required');
			setIsRegistering(false);
			return;
		}
		
		if (!email.trim()) {
			setError('Email address is required');
			setIsRegistering(false);
			return;
		}
		
		if (!phone.trim()) {
			setError('Phone number is required');
			setIsRegistering(false);
			return;
		}
		
		if (!password.trim()) {
			setError('Password is required');
			setIsRegistering(false);
			return;
		}
		
		if (!streamId) {
			setError('Please select a stream');
			setIsRegistering(false);
			return;
		}

		if (!agreeToTerms) {
			setError('Please agree to the Terms & Conditions to continue');
			setIsRegistering(false);
			return;
		}

		try {
			const registrationData: any = { email, fullName, phone, password, streamId };
			if (referralCode && codeValid) {
				registrationData.referralCode = referralCode;
			}
			
			const response = await api.post('/auth/start-registration', registrationData);
			// Redirect to email verification page
			router.push(`/verify-email?email=${encodeURIComponent(email)}&userId=${response.data.id}`);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Registration failed');
		} finally {
			setIsRegistering(false);
		}
	};

	const handleGoogleSuccess = async (googleUser: GoogleUser) => {
		setError(null);

		try {
			// First try to login (in case user already exists)
			let response;
			try {
				response = await api.post('/auth/google/login', {
					googleId: googleUser.id,
					email: googleUser.email,
					name: googleUser.name,
					picture: googleUser.picture
				});
			} catch (loginError: any) {
				// If login fails, try registration
				if (!streamId) {
					setError('Please select a stream before registering with Google');
					return;
				}
				
				if (!agreeToTerms) {
					setError('Please agree to the Terms & Conditions before registering with Google');
					return;
				}
				
				response = await api.post('/auth/google/register', {
					googleId: googleUser.id,
					email: googleUser.email,
					name: googleUser.name,
					picture: googleUser.picture,
					streamId: streamId
				});
			}

			const { data } = response;
			if (data.access_token && data.user) {
				setOk(true);
				// Redirect based on user role
				setTimeout(() => {
					if (data.user.role === 'ADMIN') {
						router.push('/admin');
					} else if (data.user.role === 'EXPERT') {
						router.push('/expert');
					} else {
						router.push('/student');
					}
				}, 1000);
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Google authentication failed');
			setOk(false);
		}
	};

	const handleGoogleError = (error: Error) => {
		setError('Google authentication failed: ' + error.message);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
					<p className="mt-4 text-gray-900 dark:text-gray-100">Loading registration form...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<DynamicFavicon 
				faviconUrl={systemSettings?.faviconUrl}
				siteTitle={systemSettings?.siteTitle}
			/>
			<DynamicHead 
				title={`Register - ${systemSettings?.siteTitle || 'JEE App'} | Create Your Account`}
				description={`Join ${systemSettings?.siteTitle || 'JEE App'} and start your JEE preparation journey with our comprehensive platform. Access practice tests, study materials, and personalized learning.`}
				keywords={`${systemSettings?.siteTitle || 'JEE App'} register, sign up, JEE preparation, create account, student registration, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
				canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/register`}
				ogImage={systemSettings?.ogImage ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImage}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-register.jpg`}
				structuredData={{
				"@context": "https://schema.org",
				"@type": "WebPage",
				"name": `${systemSettings?.siteTitle || 'JEE App'} Registration`,
				"description": "Create your account and start your JEE preparation journey with our comprehensive platform",
				"url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/register`,
				"dateModified": "2024-12-01",
				"publisher": {
					"@type": "Organization",
					"name": systemSettings?.companyName || systemSettings?.siteTitle || 'JEE App'
				}
				}}
			/>
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
				<div className="max-w-6xl w-full space-y-6">
					{/* Header */}
					<div className="text-center">
						<div className="flex justify-center items-center mb-8">
							<DynamicLogo 
								systemSettings={systemSettings} 
								size="lg"
								showText={true}
								className="justify-center"
							/>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Create your account
						</h2>
						<p className="mt-2 text-sm text-gray-700 dark:text-gray-100">
							Start your JEE preparation journey today
						</p>
						
						{/* Free Trial Highlight */}
						<div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg">
							<div className="flex items-center justify-center mb-2">
								<span className="text-2xl mr-2">🎉</span>
								<h3 className="text-lg font-bold text-green-800 dark:text-green-200">Free Trial Available</h3>
							</div>
							<p className="text-sm text-green-700 dark:text-green-300 font-medium">
								New users get a complimentary trial to explore our platform and experience the full potential of our AI learning tools.
							</p>
						</div>
					</div>

					{/* Referral Code Alert */}
					{referralCode && (
						<div className={`p-4 rounded-lg border ${
							codeValid === true ? 'bg-green-50 dark:bg-green-900 border-green-500 dark:border-green-700 text-green-800 dark:text-green-200' :
							codeValid === false ? 'bg-red-50 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200' :
							'bg-orange-50 dark:bg-orange-900 border-orange-500 dark:border-orange-700 text-orange-800 dark:text-orange-200'
						}`}>
							<div className="flex items-center space-x-2">
								<span className="text-sm font-medium">
									{validatingCode ? 'Validating referral code...' :
									 codeValid === true ? '✅ Valid referral code!' :
									 codeValid === false ? '❌ Invalid referral code' :
									 '🔍 Referral code detected'}
								</span>
							</div>
							{codeValid === true && (
								<p className="text-sm mt-1">
									You&apos;ll get 50% discount on first month subscription when you register!
								</p>
							)}
						</div>
					)}

					{/* Main Content - Side by Side Layout */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Left Side - Registration Form */}
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
							<form onSubmit={onSubmit} className="space-y-4">
								{/* Personal Information Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Full Name */}
									<div>
										<label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Full Name <span className="text-red-500">*</span>
										</label>
										<input 
											id="fullName"
											name="fullName"
											type="text"
											required
											className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
											placeholder="Enter your full name"
											value={fullName} 
											onChange={e => setFullName(e.target.value)}
										/>
									</div>

									{/* Phone */}
									<div>
										<label htmlFor="phone" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Phone Number <span className="text-red-500">*</span>
										</label>
										<input 
											id="phone"
											name="phone"
											type="tel"
											required
											className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
											placeholder="10-digit mobile number"
											value={phone} 
											onChange={e => setPhone(e.target.value)}
										/>
									</div>
								</div>

								{/* Email and Password Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Email */}
									<div>
										<label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Email Address <span className="text-red-500">*</span>
										</label>
										<input 
											id="email"
											name="email"
											type="email"
											required
											className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
											placeholder="Enter your email"
											value={email} 
											onChange={e => setEmail(e.target.value)}
										/>
									</div>

									{/* Password */}
									<div>
										<label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Password <span className="text-red-500">*</span>
										</label>
										<div className="relative">
											<input 
												id="password"
												name="password"
												type={showPassword ? "text" : "password"}
												required
												minLength={6}
												className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
												placeholder="Create strong password"
												value={password}
												onChange={e => setPassword(e.target.value)}
											/>
											<button
												type="button"
												className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
													</svg>
												) : (
													<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												)}
											</button>
										</div>
									</div>
								</div>

								{/* Stream and Referral Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Stream Selection */}
									<div>
										<label htmlFor="stream" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Select Stream <span className="text-red-500">*</span>
										</label>
										<select
											id="stream"
											name="stream"
											required
											className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
											value={streamId}
											onChange={(e) => setStreamId(e.target.value)}
										>
											<option value="">Choose your stream</option>
											{streams.map((stream) => (
												<option key={stream.id} value={stream.id}>
													{stream.name} ({stream.code})
												</option>
											))}
										</select>
									</div>

									{/* Referral Code */}
									<div>
										<label htmlFor="referralCode" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
											Referral Code <span className="text-gray-600 dark:text-gray-400 font-normal">(Optional)</span>
										</label>
										<input 
											id="referralCode"
											name="referralCode"
											type="text"
											className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
											placeholder="Enter referral code"
											value={referralCode} 
											onChange={e => {
												setReferralCode(e.target.value);
												if (e.target.value) {
													validateReferralCode(e.target.value);
												} else {
													setCodeValid(null);
												}
											}}
										/>
									</div>
								</div>

								{/* Stream Info (when selected) */}
								{streamId && (
									<div className="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg">
										<p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
											{streams.find(s => s.id === streamId)?.description}
										</p>
										<div className="mt-1 flex items-center space-x-4 text-xs text-gray-700 dark:text-gray-300">
											<span className="flex items-center">
												<span className="text-orange-600 dark:text-orange-400 mr-1">📚</span>
												{streams.find(s => s.id === streamId)?._count.subjects} Subjects
											</span>
											<span className="flex items-center">
												<span className="text-orange-600 dark:text-orange-400 mr-1">👥</span>
												{streams.find(s => s.id === streamId)?._count.users} Students
											</span>
										</div>
									</div>
								)}

								{/* Info Text */}
								<div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
									<p className="flex items-center mb-1">
										<span className="mr-2">📧</span>
										OTP will be sent to your email and phone for verification
									</p>
									<p className="flex items-center">
										<span className="mr-2">🔒</span>
										Password must be at least 6 characters long
									</p>
								</div>

								{/* Terms & Conditions Checkbox */}
								<div className="flex items-start">
									<div className="flex items-center h-5">
										<input
											id="agreeToTerms"
											name="agreeToTerms"
											type="checkbox"
											required
											checked={agreeToTerms}
											onChange={(e) => setAgreeToTerms(e.target.checked)}
											className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded"
										/>
									</div>
									<div className="ml-3 text-sm">
										<label htmlFor="agreeToTerms" className="text-gray-700 dark:text-gray-300">
											I agree to the{' '}
											<Link 
												href="/terms" 
												target="_blank" 
												rel="noopener noreferrer"
												className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors underline"
											>
												Terms & Conditions
											</Link>
											{' '}and{' '}
											<Link 
												href="/privacy" 
												target="_blank" 
												rel="noopener noreferrer"
												className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors underline"
											>
												Privacy Policy
											</Link>
											<span className="text-red-500 ml-1">*</span>
										</label>
									</div>
								</div>

								{/* Error Message */}
								{error && (
									<div className="p-3 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
										<p className="text-red-900 dark:text-red-100 text-sm font-semibold">{error}</p>
									</div>
								)}

								{ok && (
									<div className="p-3 bg-green-50 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
										<p className="text-green-900 dark:text-green-100 text-sm font-semibold">Registration successful! Redirecting to login...</p>
									</div>
								)}

								{/* Submit Button */}
								<button 
									type="submit"
									disabled={ok || isRegistering}
									className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								>
									{isRegistering ? (
										<>
											<span className="mr-2">⏳</span>
											Registering...
										</>
									) : ok ? (
										'Registration Successful...'
									) : (
										'Create Account'
									)}
								</button>
							</form>

							{/* Login Link */}
							<div className="mt-4 text-center">
								<p className="text-sm text-gray-700 dark:text-gray-300">
									Already have an account?{' '}
									<Link href="/login" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors">
										Sign in here
									</Link>
								</p>
							</div>
						</div>

						{/* Right Side - Social Login & Features */}
						<div className="space-y-6">
							{/* Google Sign-In */}
							<div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-2xl shadow-2xl p-8 border-2 border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 transform hover:scale-[1.02]">
								<div className="text-center mb-4">
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quick & Secure Registration</h3>
									<p className="text-sm text-gray-900 dark:text-white">Register with your Google account</p>
								</div>
								<GoogleSignInButton
									onSuccess={handleGoogleSuccess}
									onError={handleGoogleError}
									disabled={ok}
								/>
								<div className="mt-4 text-center">
									<p className="text-xs text-gray-800 dark:text-white">
										🔒 Your data is protected with Google's security
									</p>
								</div>
							</div>

							{/* Referral Bonus Info */}
							{referralCode && codeValid === true && (
								<div className="bg-green-50 dark:bg-green-900 border border-green-500 dark:border-green-700 rounded-xl p-4">
									<h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
										<span className="text-lg mr-2">🎁</span>
										Referral Bonus
									</h3>
									<ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
										<li className="flex items-center">
											<svg className="w-3 h-3 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											50% discount on first month subscription for you
										</li>
										<li className="flex items-center">
											<svg className="w-3 h-3 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											one month free subscription for your referrer
										</li>
										<li className="flex items-center">
											<svg className="w-3 h-3 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											Start practicing immediately!
										</li>
									</ul>
								</div>
							)}

							{/* Features Preview */}
							<div className="bg-orange-50 dark:bg-orange-900 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
								<h3 className="text-sm font-semibold text-orange-900 dark:text-white mb-4 text-center">What You Get</h3>
								<div className="grid grid-cols-3 gap-4 text-xs">
									<div className="text-center">
										<div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 border border-orange-300 dark:border-orange-700 rounded-full flex items-center justify-center mx-auto mb-2">
											<span className="text-orange-600 dark:text-orange-200 text-xl">📝</span>
										</div>
										<div className="font-bold text-gray-900 dark:text-white text-sm">50K+ Questions</div>
										<div className="text-gray-900 dark:text-white">Practice Tests</div>
									</div>
									<div className="text-center">
										<div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 border border-orange-300 dark:border-orange-700 rounded-full flex items-center justify-center mx-auto mb-2">
											<span className="text-orange-600 dark:text-orange-200 text-xl">🤖</span>
										</div>
										<div className="font-bold text-gray-900 dark:text-white text-sm">AI-Powered</div>
										<div className="text-gray-900 dark:text-white">Smart Learning</div>
									</div>
									<div className="text-center">
										<div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 border border-orange-300 dark:border-orange-700 rounded-full flex items-center justify-center mx-auto mb-2">
											<span className="text-orange-600 dark:text-orange-200 text-xl">📊</span>
										</div>
										<div className="font-bold text-gray-900 dark:text-white text-sm">Analytics</div>
										<div className="text-gray-900 dark:text-white">Track Progress</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Back to Home */}
					<div className="text-center mt-8">
						<Link href="/" className="text-sm text-gray-900 dark:text-gray-100 font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
							← Back to homepage
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}

export default function RegisterPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
					<p className="mt-4 text-gray-900 dark:text-gray-100">Loading registration form...</p>
				</div>
			</div>
		}>
			<RegisterForm />
		</Suspense>
	);
}