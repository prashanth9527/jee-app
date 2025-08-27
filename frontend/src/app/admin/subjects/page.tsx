/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSubjectsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [name, setName] = useState('');
	const refresh = async () => {
		const { data } = await api.get('/admin/subjects');
		setItems(data);
	};
	useEffect(() => { refresh(); }, []);
	const add = async () => {
		await api.post('/admin/subjects', { name });
		setName('');
		refresh();
	};
	return (
		<div className="p-6">
			<h1 className="text-xl font-semibold mb-4">Subjects</h1>
			<div className="flex gap-2 mb-4">
				<input className="border p-2" placeholder="New subject name" value={name} onChange={e=>setName(e.target.value)} />
				<button className="bg-green-600 text-white px-3 py-2" onClick={add}>Add</button>
			</div>
			<ul className="space-y-2">
				{items.map((s)=> (
					<li key={s.id} className="border p-2 rounded">{s.name}</li>
				))}
			</ul>
		</div>
	);
} 