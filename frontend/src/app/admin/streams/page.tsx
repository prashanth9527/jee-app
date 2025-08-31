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
  description?: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    subjects: number;
    users: number;
  };
}

export default function AdminStreamsPage() {
	const [streams, setStreams] = useState<Stream[]>([]);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);

	const refresh = async () => {
		try {
			const { data } = await api.get('/admin/streams');
			console.log('Fetched streams data:', data);
			setStreams(data);
		} catch (error) {
			console.error('Error fetching streams:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { 
		refresh(); 
	}, []);

	const add = async () => {
		if (!name.trim() || !code.trim()) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please provide both stream name and code.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}
		
		setAdding(true);
		try {
			await api.post('/admin/streams', { 
				name: name.trim(), 
				description: description.trim() || undefined,
				code: code.trim().toUpperCase()
			});
			setName('');
			setDescription('');
			setCode('');
			
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
			console.error('Error adding stream:', error);
			
			// Show error message
			Swal.fire({
				title: 'Error!',
				text: 'Failed to add the stream. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const toggleStreamStatus = async (id: string, currentStatus: boolean, streamName: string) => {
		const action = currentStatus ? 'disable' : 'enable';
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to ${action} "${streamName}". This will affect student registrations and content access.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: currentStatus ? '#d33' : '#28a745',
			cancelButtonColor: '#3085d6',
			confirmButtonText: `Yes, ${action} it!`,
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				console.log('Toggling stream status:', { id, currentStatus, newStatus: !currentStatus });
				const response = await api.put(`/admin/streams/${id}`, { isActive: !currentStatus });
				console.log('Stream update response:', response.data);
				
				Swal.fire({
					title: 'Updated!',
					text: `"${streamName}" has been ${action}d successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh();
			} catch (error) {
				console.error('Error updating stream:', error);
				
				Swal.fire({
					title: 'Error!',
					text: 'Failed to update the stream. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const deleteStream = async (id: string, streamName: string, subjectCount: number, userCount: number) => {
		if (subjectCount > 0 || userCount > 0) {
			Swal.fire({
				title: 'Cannot Delete',
				text: `"${streamName}" has ${subjectCount} subjects and ${userCount} users. Please remove all subjects and users first.`,
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${streamName}". This action cannot be undone!`,
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
				await api.delete(`/admin/streams/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: `"${streamName}" has been deleted successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh();
			} catch (error) {
				console.error('Error deleting stream:', error);
				
				Swal.fire({
					title: 'Error!',
					text: 'Failed to delete the stream. Please try again.',
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
					<p className="mt-4 text-gray-600">Loading streams...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Streams</h1>
							<p className="text-gray-600">Manage competitive exam streams</p>
						</div>
						<div className="text-sm text-gray-500">
							{streams.length} stream{streams.length !== 1 ? 's' : ''}
						</div>
					</div>

					{/* Add Stream Form */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Stream</h2>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">
										Stream Name *
									</label>
									<input 
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
										placeholder="e.g., JEE (Joint Entrance Examination)" 
										value={name} 
										onChange={e => setName(e.target.value)}
										onKeyPress={e => e.key === 'Enter' && add()}
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">
										Stream Code *
									</label>
									<input 
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
										placeholder="e.g., JEE, NEET, CLAT" 
										value={code} 
										onChange={e => setCode(e.target.value)}
										onKeyPress={e => e.key === 'Enter' && add()}
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">
										Description (Optional)
									</label>
									<input 
										className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
										placeholder="Brief description of the stream" 
										value={description} 
										onChange={e => setDescription(e.target.value)}
										onKeyPress={e => e.key === 'Enter' && add()}
									/>
								</div>
							</div>
							<div className="flex justify-end">
								<button 
									className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
										adding || !name.trim() || !code.trim()
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-blue-600 hover:bg-blue-700'
									}`}
									onClick={add}
									disabled={adding || !name.trim() || !code.trim()}
								>
									{adding ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Adding...
										</div>
									) : (
										'Add Stream'
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Streams List */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">All Streams</h2>
						</div>
						<div className="divide-y divide-gray-200">
							{streams.length === 0 ? (
								<div className="px-6 py-8 text-center">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">No streams</h3>
									<p className="mt-1 text-sm text-gray-500">Get started by creating a new stream.</p>
								</div>
							) : (
								streams.map((stream) => (
									<div key={stream.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<div className={`h-8 w-8 rounded-full flex items-center justify-center ${
													stream.isActive ? 'bg-green-100' : 'bg-red-100'
												}`}>
													<span className={`text-sm font-semibold ${
														stream.isActive ? 'text-green-700' : 'text-red-700'
													}`}>
														{stream.code.charAt(0).toUpperCase()}
													</span>
												</div>
											</div>
											<div className="ml-4">
												<div className="flex items-center space-x-2">
													<div className="text-sm font-semibold text-gray-900">{stream.name}</div>
													<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
														stream.isActive 
															? 'bg-green-100 text-green-800 border border-green-200' 
															: 'bg-red-100 text-red-800 border border-red-200'
													}`}>
														{stream.isActive ? 'Active' : 'Inactive'}
													</span>
												</div>
												<div className="text-sm font-medium text-gray-700 mt-1">
													Code: <span className="font-semibold">{stream.code}</span> • {stream._count.subjects} subjects • {stream._count.users} users
												</div>
												{stream.description && (
													<div className="text-sm text-gray-600 mt-1">
														{stream.description}
													</div>
												)}
												<div className="text-xs text-gray-500 mt-1">
													Created {new Date(stream.createdAt).toLocaleDateString()}
												</div>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<button 
												className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
													stream.isActive
														? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
														: 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
												}`}
												onClick={() => toggleStreamStatus(stream.id, stream.isActive, stream.name)}
											>
												{stream.isActive ? 'Disable' : 'Enable'}
											</button>
											<button 
												className="text-gray-500 hover:text-red-600 p-1 transition-colors"
												onClick={() => deleteStream(stream.id, stream.name, stream._count.subjects, stream._count.users)}
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