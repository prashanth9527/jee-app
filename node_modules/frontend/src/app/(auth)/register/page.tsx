/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);
	const [validatingCode, setValidatingCode] = useState(false);
	const [codeValid, setCodeValid] = useState<boolean | null>(null);

	// Fetch available streams
	useEffect(() => {
		const fetchStreams = async () => {
			try {
				const response = await api.get('/streams');
				setStreams(response.data);
			} catch (error) {
				console.error('Error fetching streams:', error);
				setError('Failed to load streams. Please refresh the page.');
			} finally {
				setLoading(false);
			}
		};

		fetchStreams();
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
		} catch (error) {
			setCodeValid(false);
		} finally {
			setValidatingCode(false);
		}
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		
		if (!streamId) {
			setError('Please select a stream');
			return;
		}

		try {
			const registrationData: any = { email, fullName, phone, password, streamId };
			if (referralCode) {
				registrationData.referralCode = referralCode;
			}
			
			await api.post('/auth/register', registrationData);
			setOk(true);
			setTimeout(()=>router.push('/(auth)/login'), 1000);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Registration failed');
		}
	};

	if (loading) {
		return (
			<div className="max-w-md mx-auto p-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded mb-4"></div>
					<div className="space-y-3">
						<div className="h-10 bg-gray-200 rounded"></div>
						<div className="h-10 bg-gray-200 rounded"></div>
						<div className="h-10 bg-gray-200 rounded"></div>
						<div className="h-10 bg-gray-200 rounded"></div>
						<div className="h-10 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Register</h1>
			
			{referralCode && (
				<div className={`mb-4 p-3 rounded-lg ${
					codeValid === true ? 'bg-green-50 border border-green-200' :
					codeValid === false ? 'bg-red-50 border border-red-200' :
					'bg-blue-50 border border-blue-200'
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
						<p className="text-sm text-green-700 mt-1">
							You'll get 3 days free subscription when you register!
						</p>
					)}
				</div>
			)}

			<form onSubmit={onSubmit} className="space-y-3">
				<input 
					className="border p-2 w-full" 
					placeholder="Full name" 
					value={fullName} 
					onChange={e=>setFullName(e.target.value)} 
					required
				/>
				<input 
					className="border p-2 w-full" 
					placeholder="Email" 
					type="email"
					value={email} 
					onChange={e=>setEmail(e.target.value)} 
					required
				/>
				<input 
					className="border p-2 w-full" 
					placeholder="Phone (optional)" 
					value={phone} 
					onChange={e=>setPhone(e.target.value)} 
				/>
				<input 
					className="border p-2 w-full" 
					placeholder="Password" 
					type="password" 
					value={password} 
					onChange={e=>setPassword(e.target.value)} 
					required
					minLength={6}
				/>
				
				{/* Stream Selection */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Select Your Stream *
					</label>
					<select
						className="border p-2 w-full"
						value={streamId}
						onChange={(e) => setStreamId(e.target.value)}
						required
					>
						<option value="">Choose your competitive exam stream</option>
						{streams.map((stream) => (
							<option key={stream.id} value={stream.id}>
								{stream.name} ({stream.code})
							</option>
						))}
					</select>
					{streamId && (
						<div className="mt-1 text-xs text-gray-600">
							{streams.find(s => s.id === streamId)?.description}
						</div>
					)}
				</div>

				<input 
					className="border p-2 w-full" 
					placeholder="Referral code (optional)" 
					value={referralCode} 
					onChange={e=>setReferralCode(e.target.value)} 
				/>
				{error && <p className="text-red-600 text-sm">{error}</p>}
				{ok && <p className="text-green-600 text-sm">Registered! Redirecting…</p>}
				<button 
					className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition-colors" 
					type="submit"
				>
					Register
				</button>
			</form>

			{referralCode && codeValid === true && (
				<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
					<h3 className="font-medium text-green-900 mb-2">🎁 Referral Bonus</h3>
					<ul className="text-sm text-green-800 space-y-1">
						<li>• 3 days free subscription for you</li>
						<li>• 7 days free subscription for your referrer</li>
						<li>• Start practicing immediately!</li>
					</ul>
				</div>
			)}
		</div>
	);
}

export default function RegisterPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading registration form...</p>
				</div>
			</div>
		}>
			<RegisterForm />
		</Suspense>
	);
} 