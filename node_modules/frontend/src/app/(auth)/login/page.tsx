/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			const response = await api.post('/auth/login', { email, password });
			const { data } = response;
			
			if (data.access_token && data.user) {
				login(data.access_token, data.user);
				
				// Redirect based on user role
				if (data.user.role === 'ADMIN') {
					window.location.href = '/admin';
				} else {
					window.location.href = '/student';
				}
			} else {
				setError('Invalid response from server');
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Login failed');
		}
	};
	return (
		<div className="max-w-md mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Login</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
				<input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Login</button>
			</form>
		</div>
	);
} 