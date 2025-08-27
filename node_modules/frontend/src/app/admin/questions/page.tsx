/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminQuestionsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [stem, setStem] = useState('');
	const [options, setOptions] = useState<any[]>([{ text: '', isCorrect: true }, { text: '' }, { text: '' }, { text: '' }]);
	const refresh = async () => {
		const { data } = await api.get('/admin/questions');
		setItems(data);
	};
	useEffect(() => { refresh(); }, []);
	const add = async () => {
		await api.post('/admin/questions', { stem, options });
		setStem('');
		setOptions([{ text: '', isCorrect: true }, { text: '' }, { text: '' }, { text: '' }]);
		refresh();
	};
	const exportCsv = () => {
		window.location.href = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001') + '/admin/questions/export';
	};
	const onImport = async (e: any) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const form = new FormData();
		form.append('file', file);
		await api.post('/admin/questions/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
		refresh();
	};
	return (
		<div className="p-6">
			<h1 className="text-xl font-semibold mb-4">Questions</h1>
			<div className="mb-4">
				<textarea className="border p-2 w-full" placeholder="Question stem" value={stem} onChange={e=>setStem(e.target.value)} />
				<div className="grid grid-cols-2 gap-2 mt-2">
					{options.map((o, idx)=> (
						<div key={idx} className="flex items-center gap-2">
							<input className="border p-2 flex-1" placeholder={`Option ${idx+1}`} value={o.text} onChange={e=>{
								const copy = [...options];
								copy[idx] = { ...copy[idx], text: e.target.value };
								setOptions(copy);
							}} />
							<label className="text-sm flex items-center gap-1">
								<input type="radio" name="correct" checked={!!o.isCorrect} onChange={()=>{
									setOptions(options.map((x, i)=> ({ ...x, isCorrect: i===idx })));
								}} /> Correct
							</label>
						</div>
					))}
				</div>
				<button className="bg-green-600 text-white px-3 py-2" onClick={add}>Add</button>
			</div>
			<div className="flex items-center gap-2 mb-4">
				<button className="bg-blue-600 text-white px-3 py-2" onClick={exportCsv}>Export CSV</button>
				<input type="file" accept=".csv" onChange={onImport} />
			</div>
			<ul className="space-y-2">
				{items.map((q)=> (
					<li key={q.id} className="border p-2 rounded">
						<p className="font-medium">{q.stem}</p>
						<ul className="list-disc pl-6">
							{q.options?.map((o:any)=> (
								<li key={o.id} className={o.isCorrect ? 'text-green-700' : ''}>{o.text}</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</div>
	);
} 