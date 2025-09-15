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
		const ref = searchParams.get('ref');
		if (ref) {
			setReferralCode(ref);
			validateReferralCode(ref);
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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
					<p className="mt-4 text-gray-900">Loading registration form...</p>
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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
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
						<h2 className="text-3xl font-bold text-gray-900">
							Create your account
						</h2>
						<p className="mt-2 text-sm text-gray-600">
							Start your JEE preparation journey today
						</p>
					</div>

				{/* Referral Code Alert */}
			{referralCode && (
					<div className={`p-4 rounded-lg border ${
						codeValid === true ? 'bg-green-50 border-green-500 text-green-800' :
						codeValid === false ? 'bg-red-50 border-red-500 text-red-800' :
						'bg-orange-50 border-orange-500 text-orange-800'
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
								You&apos;ll get 3 days free subscription when you register!
						</p>
					)}
				</div>
			)}

				{/* Registration Form */}
				<div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
					<form onSubmit={onSubmit} className="space-y-6">
						{/* Full Name */}
						<div>
							<label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
								Full Name <span className="text-red-500">*</span>
							</label>
							<input 
								id="fullName"
								name="fullName"
								type="text"
								required
								className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
								placeholder="Enter your full name"
								value={fullName} 
								onChange={e => setFullName(e.target.value)}
							/>
						</div>

						{/* Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
								Email Address <span className="text-red-500">*</span>
							</label>
				<input 
								id="email"
								name="email"
					type="email"
								required
								className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
								placeholder="Enter your email"
					value={email} 
								onChange={e => setEmail(e.target.value)}
							/>
							<p className="mt-1 text-xs text-gray-600">
								📧 OTP verification code will be sent to this email address
							</p>
						</div>

						{/* Phone */}
						<div>
							<label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
								Phone Number <span className="text-red-500">*</span>
							</label>
							<input 
								id="phone"
								name="phone"
								type="tel"
								required
								className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
								placeholder="Enter your 10-digit mobile number (e.g., 9876543210)"
								value={phone} 
								onChange={e => setPhone(e.target.value)}
				/>
							<p className="mt-1 text-xs text-gray-600">
								📱 OTP verification code will also be sent to this phone number
							</p>
						</div>

						{/* Password */}
						<div>
							<label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
								Password <span className="text-red-500">*</span>
							</label>
							<div className="relative">
				<input 
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
					required
					minLength={6}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12 text-gray-900 bg-white"
									placeholder="Create a strong password"
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
							<p className="mt-1 text-xs text-gray-800 font-medium">
								Must be at least 6 characters long
							</p>
						</div>
				
				{/* Stream Selection */}
				<div>
							<label htmlFor="stream" className="block text-sm font-semibold text-gray-900 mb-2">
								Select Your Stream <span className="text-red-500">*</span>
					</label>
					<select
								id="stream"
								name="stream"
								required
								className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
						value={streamId}
						onChange={(e) => setStreamId(e.target.value)}
					>
						<option value="">Choose your competitive exam stream</option>
						{streams.map((stream) => (
							<option key={stream.id} value={stream.id}>
								{stream.name} ({stream.code})
							</option>
						))}
					</select>
					{streamId && (
								<div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
									<p className="text-sm text-gray-900 font-medium">
							{streams.find(s => s.id === streamId)?.description}
									</p>
									<div className="mt-2 flex items-center space-x-4 text-xs text-gray-700">
										<span className="flex items-center">
											<span className="text-orange-600 mr-1">📚</span>
											{streams.find(s => s.id === streamId)?._count.subjects} Subjects
										</span>
										<span className="flex items-center">
											<span className="text-orange-600 mr-1">👥</span>
											{streams.find(s => s.id === streamId)?._count.users} Students
										</span>
									</div>
						</div>
					)}
				</div>

						{/* Referral Code */}
						<div>
							<label htmlFor="referralCode" className="block text-sm font-semibold text-gray-900 mb-2">
								Referral Code <span className="text-gray-600 font-normal">(Optional)</span>
							</label>
							<input 
								id="referralCode"
								name="referralCode"
								type="text"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
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

						{/* Error Message */}
						{error && (
							<div className="p-4 bg-red-50 border border-red-300 rounded-lg">
								<p className="text-red-900 text-sm font-semibold">{error}</p>
							</div>
						)}


						{ok && (
							<div className="p-4 bg-green-50 border border-green-300 rounded-lg">
								<p className="text-green-900 text-sm font-semibold">Registration successful! Redirecting to login...</p>
							</div>
						)}

						{/* Submit Button */}
				<button 
					type="submit"
					disabled={ok || isRegistering}
					className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-700">
							Already have an account?{' '}
							<Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
								Sign in here
							</Link>
						</p>
					</div>
				</div>

				{/* Divider */}
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-gray-50 text-gray-800 font-medium">Or continue with</span>
					</div>
				</div>

				{/* Google Sign-In */}
				<div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
					<GoogleSignInButton
						onSuccess={handleGoogleSuccess}
						onError={handleGoogleError}
						disabled={ok}
					/>
				</div>

				{/* Referral Bonus Info */}
			{referralCode && codeValid === true && (
					<div className="bg-green-50 border border-green-500 rounded-xl p-6">
						<h3 className="font-semibold text-green-900 mb-3 flex items-center">
							<span className="text-xl mr-2">🎁</span>
							Referral Bonus
						</h3>
						<ul className="text-sm text-green-800 space-y-2">
							<li className="flex items-center">
								<svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								3 days free subscription for you
							</li>
							<li className="flex items-center">
								<svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								7 days free subscription for your referrer
							</li>
							<li className="flex items-center">
								<svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								Start practicing immediately!
							</li>
					</ul>
				</div>
			)}

				{/* Features Preview */}
				<div className="text-center">
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div className="flex flex-col items-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mb-2">
								<span className="text-orange-600 text-xl">📝</span>
							</div>
							<span className="text-gray-900 font-bold text-sm">50K+ Questions</span>
						</div>
						<div className="flex flex-col items-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mb-2">
								<span className="text-orange-600 text-xl">🤖</span>
							</div>
							<span className="text-gray-900 font-bold text-sm">AI Practice</span>
						</div>
						<div className="flex flex-col items-center">
							<div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center mb-2">
								<span className="text-orange-600 text-xl">📊</span>
							</div>
							<span className="text-gray-900 font-bold text-sm">Analytics</span>
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

export default function RegisterPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
					<p className="mt-4 text-gray-900">Loading registration form...</p>
				</div>
			</div>
		}>
			<RegisterForm />
		</Suspense>
	);
} 
