/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Stream {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  stream?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function AdminSubjectsPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [streams, setStreams] = useState<Stream[]>([]);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [streamId, setStreamId] = useState('');
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);

	const refresh = async () => {
		try {
			const [subjectsResponse, streamsResponse] = await Promise.all([
				api.get('/admin/subjects'),
				api.get('/streams')
			]);
			setSubjects(subjectsResponse.data);
			setStreams(streamsResponse.data);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { 
		refresh(); 
	}, []);

	const add = async () => {
		if (!name.trim() || !streamId) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please provide both subject name and stream.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}
		
		setAdding(true);
		try {
			await api.post('/admin/subjects', { 
				name: name.trim(), 
				description: description.trim() || undefined,
				streamId 
			});
			setName('');
			setDescription('');
			setStreamId('');
			
			// Show success message
			Swal.fire({
				title: 'Success!',
				text: `"${name.trim()}" has been added successfully.`,
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			refresh();
		} catch (error) {
			console.error('Error adding subject:', error);
			
			// Show error message
			Swal.fire({
				title: 'Error!',
				text: 'Failed to add the subject. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const deleteSubject = async (id: string, subjectName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${subjectName}". This action cannot be undone!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				// Show loading state
				Swal.fire({
					title: 'Deleting...',
					text: 'Please wait while we delete the subject.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/subjects/${id}`);
				
				// Show success message
				Swal.fire({
					title: 'Deleted!',
					text: `"${subjectName}" has been deleted successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh();
			} catch (error) {
				console.error('Error deleting subject:', error);
				
				// Show error message
				Swal.fire({
					title: 'Error!',
					text: 'Failed to delete the subject. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading subjects...</p>
				</div>
			</div>
		);
	}

	return (
		<ProtectedRoute requiredRole="ADMIN">
			<AdminLayout>
				<div className="space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
							<p className="text-gray-600">Manage subjects for all competitive exam streams</p>
						</div>
						<div className="text-sm text-gray-500">
							{subjects.length} subject{subjects.length !== 1 ? 's' : ''}
						</div>
					</div>

					{/* Add Subject Form */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Subject</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">
										Subject Name *
									</label>
									<input 
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
										placeholder="Enter subject name (e.g., Physics, Chemistry, Mathematics)" 
										value={name} 
										onChange={e => setName(e.target.value)}
										onKeyPress={e => e.key === 'Enter' && add()}
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">
										Stream *
									</label>
									<select
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
										value={streamId}
										onChange={e => setStreamId(e.target.value)}
									>
										<option value="" className="text-gray-600">Select a stream</option>
										{streams.map((stream) => (
											<option key={stream.id} value={stream.id} className="text-gray-900">
												{stream.name} ({stream.code})
											</option>
										))}
									</select>
								</div>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-800 mb-2">
									Description (Optional)
								</label>
								<textarea
									className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									placeholder="Enter subject description"
									value={description}
									onChange={e => setDescription(e.target.value)}
									rows={2}
								/>
							</div>
							<div className="flex justify-end">
								<button 
									className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
										adding || !name.trim() || !streamId
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-blue-600 hover:bg-blue-700'
									}`}
									onClick={add}
									disabled={adding || !name.trim() || !streamId}
								>
									{adding ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Adding...
										</div>
									) : (
										'Add Subject'
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Subjects List */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">All Subjects</h2>
						</div>
						<div className="divide-y divide-gray-200">
							{subjects.length === 0 ? (
								<div className="px-6 py-8 text-center">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">No subjects</h3>
									<p className="mt-1 text-sm text-gray-500">Get started by creating a new subject.</p>
								</div>
							) : (
								subjects.map((subject) => (
									<div key={subject.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
													<span className="text-sm font-semibold text-blue-700">
														{subject.name.charAt(0).toUpperCase()}
													</span>
												</div>
											</div>
											<div className="ml-4">
												<div className="text-sm font-semibold text-gray-900">{subject.name}</div>
												<div className="text-sm text-gray-700 mt-1">
													{subject.stream ? (
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
															{subject.stream.name} ({subject.stream.code})
														</span>
													) : (
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
															No Stream Assigned
														</span>
													)}
												</div>
												{subject.description && (
													<div className="text-sm text-gray-600 mt-1">
														{subject.description}
													</div>
												)}
												<div className="text-xs text-gray-500 mt-1">
													Created {new Date(subject.createdAt).toLocaleDateString()}
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<button className="text-gray-500 hover:text-gray-700 p-1 transition-colors">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
											</button>
											<button 
												className="text-gray-500 hover:text-red-600 p-1 transition-colors"
												onClick={() => deleteSubject(subject.id, subject.name)}
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 