'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Tag {
	id: string;
	name: string;
	_count?: {
		questions: number;
	};
	questions?: QuestionTag[];
}

interface QuestionTag {
	question: {
		id: string;
		stem: string;
		subject?: {
			id: string;
			name: string;
		};
		topic?: {
			id: string;
			name: string;
		};
		subtopic?: {
			id: string;
			name: string;
		};
	};
}

export default function AdminTagsPage() {
	const [tags, setTags] = useState<Tag[]>([]);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);
	const [searchText, setSearchText] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [expandedTag, setExpandedTag] = useState<string | null>(null);
	
	// Form states
	const [tagName, setTagName] = useState('');
	const [editTagName, setEditTagName] = useState('');

	const refresh = async () => {
		try {
			const { data } = await api.get('/admin/tags');
			setTags(data.tags || data);
		} catch (error) {
			console.error('Error fetching tags:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load tags. Please refresh the page.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { 
		refresh(); 
	}, []);

	const addTag = async () => {
		if (!tagName.trim()) return;
		
		setAdding(true);
		try {
			await api.post('/admin/tags', { name: tagName.trim() });
			setTagName('');
			
			Swal.fire({
				title: 'Success!',
				text: `"${tagName.trim()}" has been added successfully.`,
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			refresh();
		} catch (error: any) {
			console.error('Error adding tag:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to add the tag. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const updateTag = async (id: string) => {
		if (!editTagName.trim()) return;
		
		try {
			await api.put(`/admin/tags/${id}`, { name: editTagName.trim() });
			setEditing(null);
			setEditTagName('');
			
			Swal.fire({
				title: 'Success!',
				text: 'Tag has been updated successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			refresh();
		} catch (error: any) {
			console.error('Error updating tag:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update the tag. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const deleteTag = async (id: string, tagName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${tagName}". This action cannot be undone!`,
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
				Swal.fire({
					title: 'Deleting...',
					text: 'Please wait while we delete the tag.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/tags/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'Tag has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh();
			} catch (error: any) {
				console.error('Error deleting tag:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the tag. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const bulkDeleteTags = async () => {
		if (selectedTags.length === 0) {
			Swal.fire({
				title: 'No Tags Selected',
				text: 'Please select tags to delete.',
				icon: 'info',
				confirmButtonText: 'OK'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete ${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}. This action cannot be undone!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete them!',
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				Swal.fire({
					title: 'Deleting...',
					text: 'Please wait while we delete the tags.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				const response = await api.delete('/admin/tags/bulk', { data: { ids: selectedTags } });
				
				Swal.fire({
					title: 'Deleted!',
					text: response.data.message || 'Tags have been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				setSelectedTags([]);
				setSelectAll(false);
				refresh();
			} catch (error: any) {
				console.error('Error deleting tags:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the tags. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedTags([]);
			setSelectAll(false);
		} else {
			setSelectedTags(tags.map(tag => tag.id));
			setSelectAll(true);
		}
	};

	const handleSelectTag = (tagId: string) => {
		setSelectedTags(prev => {
			if (prev.includes(tagId)) {
				const newSelection = prev.filter(id => id !== tagId);
				setSelectAll(false);
				return newSelection;
			} else {
				const newSelection = [...prev, tagId];
				setSelectAll(newSelection.length === tags.length);
				return newSelection;
			}
		});
	};

	const startEdit = (tag: Tag) => {
		setEditing(tag.id);
		setEditTagName(tag.name);
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditTagName('');
	};

	const toggleExpanded = async (tagId: string) => {
		if (expandedTag === tagId) {
			setExpandedTag(null);
		} else {
			try {
				const { data } = await api.get(`/admin/tags/${tagId}`);
				// Update the tag with question data
				setTags(prev => prev.map(tag => 
					tag.id === tagId ? { ...tag, questions: data.questions } : tag
				));
				setExpandedTag(tagId);
			} catch (error) {
				console.error('Error fetching tag details:', error);
				Swal.fire({
					title: 'Error!',
					text: 'Failed to load tag details.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	// Filter tags based on search
	const filteredTags = tags.filter(tag => 
		tag.name.toLowerCase().includes(searchText.toLowerCase())
	);

	// Calculate statistics
	const totalQuestions = tags.reduce((sum, tag) => sum + (tag._count?.questions || 0), 0);
	const unusedTags = tags.filter(tag => !tag._count?.questions || tag._count.questions === 0).length;

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading tags...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Tags</h1>
							<p className="text-gray-600">Manage question tags for better organization</p>
						</div>
						<div className="text-sm text-gray-500">
							{tags.length} tag{tags.length !== 1 ? 's' : ''} • {filteredTags.length} filtered
						</div>
					</div>

					{/* Statistics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-blue-100 rounded-lg">
									<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">Total Tags</p>
									<p className="text-2xl font-semibold text-gray-900">{tags.length}</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-green-100 rounded-lg">
									<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">Total Questions</p>
									<p className="text-2xl font-semibold text-gray-900">{totalQuestions}</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-yellow-100 rounded-lg">
									<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">Unused Tags</p>
									<p className="text-2xl font-semibold text-gray-900">{unusedTags}</p>
								</div>
							</div>
						</div>
					</div>

					{/* Add Tag Form */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h2>
						<div className="flex gap-3">
							<input 
								className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
								placeholder="Enter tag name (e.g., Previous Year, JEE Mains, Formula Based)" 
								value={tagName} 
								onChange={e => setTagName(e.target.value)}
								onKeyPress={e => e.key === 'Enter' && addTag()}
							/>
							<button 
								className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
									adding || !tagName.trim() 
										? 'bg-gray-400 cursor-not-allowed' 
										: 'bg-blue-600 hover:bg-blue-700'
								}`}
								onClick={addTag}
								disabled={adding || !tagName.trim()}
							>
								{adding ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Adding...
									</div>
								) : (
									'Add Tag'
								)}
							</button>
						</div>
					</div>

					{/* Search and Bulk Actions */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-3">
								<input
									type="text"
									placeholder="Search tags..."
									value={searchText}
									onChange={e => setSearchText(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								{searchText && (
									<button
										onClick={() => setSearchText('')}
										className="text-gray-400 hover:text-gray-600"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>
							{selectedTags.length > 0 && (
								<button
									onClick={bulkDeleteTags}
									className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
								>
									Delete Selected ({selectedTags.length})
								</button>
							)}
						</div>
					</div>

					{/* Tags List */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<h2 className="text-lg font-semibold text-gray-900">All Tags</h2>
							</div>
							{selectedTags.length > 0 && (
								<span className="text-sm text-gray-600">
									{selectedTags.length} selected
								</span>
							)}
						</div>
						
						{filteredTags.length === 0 ? (
							<div className="p-12 text-center">
								<div className="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
									</svg>
								</div>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No tags found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchText ? 'Try adjusting your search criteria.' : 'Get started by creating a new tag.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{filteredTags.map((tag) => (
									<div key={tag.id} className="p-6 hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<input
													type="checkbox"
													checked={selectedTags.includes(tag.id)}
													onChange={() => handleSelectTag(tag.id)}
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
												<div className="flex-1">
													{editing === tag.id ? (
														<div className="flex items-center space-x-2">
															<input
																type="text"
																value={editTagName}
																onChange={e => setEditTagName(e.target.value)}
																className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
																onKeyPress={e => e.key === 'Enter' && updateTag(tag.id)}
															/>
															<button
																onClick={() => updateTag(tag.id)}
																className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
															>
																Save
															</button>
															<button
																onClick={cancelEdit}
																className="px-2 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
															>
																Cancel
															</button>
														</div>
													) : (
														<div className="flex items-center space-x-3">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
																{tag.name}
															</span>
															{tag._count?.questions && (
																<span className="text-sm text-gray-500">
																	{tag._count.questions} question{tag._count.questions !== 1 ? 's' : ''}
																</span>
															)}
															{tag._count?.questions === 0 && (
																<span className="text-sm text-yellow-600 font-medium">
																	Unused
																</span>
															)}
														</div>
													)}
												</div>
											</div>
											<div className="flex space-x-2">
												{editing !== tag.id && (
													<>
														{tag._count?.questions && tag._count.questions > 0 && (
															<button 
																onClick={() => toggleExpanded(tag.id)}
																className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
																title="View questions"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
																</svg>
															</button>
														)}
														<button 
															onClick={() => startEdit(tag)}
															className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
															title="Edit tag"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
														</button>
														<button 
															onClick={() => deleteTag(tag.id, tag.name)}
															className="p-2 text-gray-400 hover:text-red-600 transition-colors"
															title="Delete tag"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														</button>
													</>
												)}
											</div>
										</div>
										
										{/* Expanded Questions List */}
										{expandedTag === tag.id && tag.questions && (
											<div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4">
												<h4 className="text-sm font-medium text-gray-700 mb-2">Questions using this tag:</h4>
												<div className="space-y-2">
													{tag.questions.map((qt) => (
														<div key={qt.question.id} className="bg-gray-50 rounded p-3">
															<p className="text-sm text-gray-900 mb-1">{qt.question.stem}</p>
															<div className="flex flex-wrap gap-1">
																{qt.question.subject && (
																	<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
																		{qt.question.subject.name}
																	</span>
																)}
																{qt.question.topic && (
																	<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
																		{qt.question.topic.name}
																	</span>
																)}
																{qt.question.subtopic && (
																	<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
																		{qt.question.subtopic.name}
																	</span>
																)}
															</div>
														</div>
													))}
													{tag.questions.length === 0 && (
														<p className="text-sm text-gray-500 italic">No questions found</p>
													)}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 