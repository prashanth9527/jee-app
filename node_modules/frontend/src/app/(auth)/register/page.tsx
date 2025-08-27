/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await api.post('/auth/register', { email, fullName, phone, password });
			setOk(true);
			setTimeout(()=>router.push('/(auth)/login'), 1000);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Registration failed');
		}
	};
	return (
		<div className="max-w-md mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Register</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<input className="border p-2 w-full" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
				<input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
				<input className="border p-2 w-full" placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
				<input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
				{error && <p className="text-red-600 text-sm">{error}</p>}
				{ok && <p className="text-green-600 text-sm">Registered! Redirecting…</p>}
				<button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Register</button>
			</form>
		</div>
	);
} 