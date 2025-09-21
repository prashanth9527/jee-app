'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Subtopic {
	id: string;
	name: string;
	description?: string;
	topicId: string;
	topic: {
		id: string;
		name: string;
		subject: {
			id: string;
			name: string;
			stream?: {
				id: string;
				name: string;
				code: string;
			};
		};
	};
	createdAt: string;
}

interface Topic {
	id: string;
	name: string;
	lesson?: {
		id: string;
		name: string;
		subject: {
			id: string;
			name: string;
			stream?: {
				id: string;
				name: string;
				code: string;
			};
		};
	};
	subject: {
		id: string;
		name: string;
		stream?: {
			id: string;
			name: string;
			code: string;
		};
	};
}

interface Subject {
	id: string;
	name: string;
	stream?: {
		id: string;
		name: string;
		code: string;
	};
}

interface Lesson {
	id: string;
	name: string;
	subject: {
		id: string;
		name: string;
		stream?: {
			id: string;
			name: string;
			code: string;
		};
	};
}

export default function SubtopicsPage() {
	const router = useRouter();
	
	// Data states
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [itemsPerPage] = useState(10);
	
	// Filter states
	const [searchText, setSearchText] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	const [selectedLesson, setSelectedLesson] = useState('');
	const [selectedTopic, setSelectedTopic] = useState('');
	
	// Form states
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [topicId, setTopicId] = useState('');
	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editTopicId, setEditTopicId] = useState('');
	
	// Add form specific states
	const [addFormSubject, setAddFormSubject] = useState('');
	const [addFormTopics, setAddFormTopics] = useState<Topic[]>([]);
	
	// Toggle states
	const [showAddForm, setShowAddForm] = useState(false);

	const refresh = async (page = 1) => {
		try {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: itemsPerPage.toString(),
			...(searchText && { search: searchText }),
			...(selectedSubject && { subjectId: selectedSubject }),
			...(selectedLesson && { lessonId: selectedLesson }),
			...(selectedTopic && { topicId: selectedTopic })
		});

			const [subtopicsResponse, topicsResponse, subjectsResponse, lessonsResponse] = await Promise.all([
				api.get(`/admin/subtopics?${params}`),
				api.get('/admin/topics'),
				api.get('/admin/subjects'),
				api.get('/admin/lessons?limit=1000')
			]);
			
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
			setTopics(topicsResponse.data);
			setSubjects(subjectsResponse.data);
			setLessons(lessonsResponse.data.lessons || lessonsResponse.data);
			
			// Handle pagination data
			if (subtopicsResponse.data.pagination) {
				setTotalPages(subtopicsResponse.data.pagination.totalPages);
				setTotalItems(subtopicsResponse.data.pagination.totalItems);
			} else {
				// Fallback if no pagination data
				setTotalPages(1);
				setTotalItems(subtopicsResponse.data.length);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load subtopics and topics. Please refresh the page.',
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

	// Debug effect to log topics data
	useEffect(() => {
		console.log('Topics data updated:', topics);
		console.log('Topics array check:', Array.isArray(topics));
		if (Array.isArray(topics) && topics.length > 0) {
			console.log('First topic structure:', topics[0]);
		}
	}, [topics]);

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		refresh(page);
	};

	// Handle search
	const handleSearch = () => {
		setCurrentPage(1);
		refresh(1);
	};

	// Handle subject filter change
	const handleSubjectChange = (subjectId: string) => {
		setSelectedSubject(subjectId);
		setSelectedLesson('');
		setSelectedTopic(''); // Reset topic when subject changes
		setCurrentPage(1);
		refresh(1);
	};

	// Handle lesson filter change
	const handleLessonChange = (lessonId: string) => {
		setSelectedLesson(lessonId);
		setSelectedTopic('');
		setCurrentPage(1);
		refresh(1);
	};

	// Handle topic filter change
	const handleTopicChange = (topicId: string) => {
		setSelectedTopic(topicId);
		setCurrentPage(1);
		refresh(1);
	};

	// Clear filters
	const clearFilters = () => {
		setSearchText('');
		setSelectedSubject('');
		setSelectedLesson('');
		setSelectedTopic('');
		setCurrentPage(1);
		refresh(1);
	};

	const add = async () => {
		if (!name.trim() || !topicId) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}
		
		setAdding(true);
		try {
			await api.post('/admin/subtopics', { 
				name: name.trim(), 
				description: description.trim() || undefined,
				topicId 
			});
			setName('');
			setDescription('');
			setTopicId('');
			setAddFormSubject('');
			setAddFormTopics([]);
			
			Swal.fire({
				title: 'Success!',
				text: `"${name.trim()}" has been added successfully.`,
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			refresh(currentPage);
			
			// Hide the form after successful addition
			setTimeout(() => {
				setShowAddForm(false);
			}, 2000);
		} catch (error: any) {
			console.error('Error adding subtopic:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to add the subtopic. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const startEdit = (subtopic: Subtopic) => {
		setEditing(subtopic.id);
		setEditName(subtopic.name);
		setEditDescription(subtopic.description || '');
		setEditTopicId(subtopic.topicId);
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditName('');
		setEditDescription('');
		setEditTopicId('');
	};

	const update = async (subtopicId: string) => {
		if (!editName.trim() || !editTopicId) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		try {
			await api.put(`/admin/subtopics/${subtopicId}`, { 
				name: editName.trim(), 
				description: editDescription.trim() || undefined
			});
			
			Swal.fire({
				title: 'Success!',
				text: `"${editName.trim()}" has been updated successfully.`,
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			cancelEdit();
			refresh(currentPage);
		} catch (error: any) {
			console.error('Error updating subtopic:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update the subtopic. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const deleteSubtopic = async (id: string, subtopicName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${subtopicName}". This action cannot be undone!`,
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
					text: 'Please wait while we delete the subtopic.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/subtopics/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: `"${subtopicName}" has been deleted successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error('Error deleting subtopic:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the subtopic. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
		
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}
		
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
		return pages;
	};

	// Filter lessons based on selected subject
	const filteredLessons = selectedSubject && Array.isArray(lessons)
		? lessons.filter(lesson => lesson.subject.id === selectedSubject)
		: Array.isArray(lessons) ? lessons : [];

	// Filter topics based on selected lesson
	const filteredTopics = selectedLesson && Array.isArray(topics)
		? topics.filter(topic => topic.lesson?.id === selectedLesson)
		: selectedSubject && Array.isArray(topics)
		? topics.filter(topic => topic.subject.id === selectedSubject)
		: Array.isArray(topics) ? topics : [];

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading subtopics...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Subtopics</h1>
							<p className="text-gray-600">Manage JEE subtopics within topics</p>
						</div>
						<div className="flex items-center space-x-4">
							<button 
								onClick={() => setShowAddForm(!showAddForm)}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
							>
								{showAddForm ? (
									<>
										<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
										Cancel
									</>
								) : (
									<>
										<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
										Add
									</>
								)}
							</button>
							<div className="text-sm text-gray-500">
								{totalItems} subtopic{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
							</div>
						</div>
					</div>

					{/* Add New Subtopic Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-900">Add New Subtopic</h2>
						</div>
						
						{showAddForm && (
							<div className="grid grid-cols-1 md:grid-cols-6 gap-3">
								<input 
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
									placeholder="Enter subtopic name" 
									value={name} 
									onChange={e => setName(e.target.value)}
									onKeyPress={e => e.key === 'Enter' && add()}
								/>
								<input 
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
									placeholder="Description (optional)" 
									value={description} 
									onChange={e => setDescription(e.target.value)}
									onKeyPress={e => e.key === 'Enter' && add()}
								/>
								<select 
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
									value={addFormSubject}
									onChange={e => {
										const selectedSubjectId = e.target.value;
										console.log('Selected subject:', selectedSubjectId);
										console.log('Available topics:', topics);
										const filteredTopics = topics.filter(topic => topic.subject.id === selectedSubjectId);
										console.log('Filtered topics:', filteredTopics);
										setAddFormSubject(selectedSubjectId);
										setAddFormTopics(filteredTopics);
										setTopicId(''); // Reset topic when subject changes
									}}
								>
									<option value="">Select Subject</option>
									{Array.isArray(subjects) && subjects.map(subject => (
										<option key={subject.id} value={subject.id}>
											{subject.name} ({subject.stream?.code || 'N/A'})
										</option>
									))}
								</select>
								<select 
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
									value={topicId}
									onChange={e => setTopicId(e.target.value)}
									disabled={!addFormSubject}
								>
									<option value="">Select Topic</option>
									{(() => {
										console.log('Rendering topics dropdown with:', addFormTopics);
										return Array.isArray(addFormTopics) && addFormTopics.map(topic => (
											<option key={topic.id} value={topic.id}>
												{topic.name} ({topic.subject?.stream?.code || 'N/A'})
											</option>
										));
									})()}
								</select>
								<button 
									className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
										adding || !name.trim() || !topicId
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-blue-600 hover:bg-blue-700'
									}`}
									onClick={add}
									disabled={adding || !name.trim() || !topicId}
								>
									{adding ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Adding...
										</div>
									) : (
										'Add Subtopic'
									)}
								</button>
								<button 
									className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
									onClick={() => {
										setName('');
										setDescription('');
										setTopicId('');
										setAddFormSubject('');
										setAddFormTopics([]);
									}}
								>
									Clear Form
								</button>
							</div>
						)}
					</div>

					{/* Filters Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-6 gap-3">
							<input 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
								placeholder="Search subtopics, topics or subjects..." 
								value={searchText}
								onChange={e => setSearchText(e.target.value)}
								onKeyPress={e => e.key === 'Enter' && handleSearch()}
							/>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedSubject}
								onChange={e => handleSubjectChange(e.target.value)}
							>
								<option value="">All Subjects</option>
								{Array.isArray(subjects) && subjects.map(subject => (
									<option key={subject.id} value={subject.id}>
										{subject.name} ({subject.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedLesson}
								onChange={e => handleLessonChange(e.target.value)}
								disabled={!selectedSubject}
							>
								<option value="">All Lessons</option>
								{Array.isArray(filteredLessons) && filteredLessons.map(lesson => (
									<option key={lesson.id} value={lesson.id}>
										{lesson.name} ({lesson.subject?.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedTopic}
								onChange={e => handleTopicChange(e.target.value)}
								disabled={!selectedLesson}
							>
								<option value="">All Topics</option>
								{Array.isArray(filteredTopics) && filteredTopics.map(topic => (
									<option key={topic.id} value={topic.id}>
										{topic.name} ({topic.subject?.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<button 
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								onClick={handleSearch}
							>
								Search
							</button>
							<button 
								className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
								onClick={clearFilters}
							>
								Clear Filters
							</button>
						</div>
					</div>

					{/* All Subtopics Section */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">All Subtopics</h2>
						</div>
						
						{subtopics.length === 0 ? (
							<div className="p-12 text-center">
								<div className="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No subtopics found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchText || selectedSubject || selectedTopic ? 'Try adjusting your search criteria.' : 'Get started by creating a new subtopic.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{subtopics.map((subtopic) => (
									<div key={subtopic.id} className="p-6 hover:bg-gray-50 transition-colors">
										{editing === subtopic.id ? (
											<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
												<input 
													className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
													value={editName}
													onChange={e => setEditName(e.target.value)}
												/>
												<input 
													className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
													value={editDescription}
													onChange={e => setEditDescription(e.target.value)}
													placeholder="Description (optional)"
												/>
												<div className="flex space-x-2">
													<button 
														className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
														onClick={() => update(subtopic.id)}
													>
														Save
													</button>
													<button 
														className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
														onClick={cancelEdit}
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="flex-shrink-0">
														<div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
															<span className="text-white font-medium text-sm">
																{subtopic.name.charAt(0).toUpperCase()}
															</span>
														</div>
													</div>
													<div>
														<h3 className="text-lg font-medium text-gray-900">{subtopic.name}</h3>
														<p className="text-sm text-gray-500">
															Topic: {subtopic.topic.name} • Subject: {subtopic.topic.subject.name}
															{subtopic.topic.subject?.stream && (
																<span className="text-gray-600"> ({subtopic.topic.subject.stream.code})</span>
															)}
															{subtopic.description && ` • ${subtopic.description}`}
														</p>
														<p className="text-xs text-gray-400">
															Created {new Date(subtopic.createdAt).toLocaleDateString()}
														</p>
													</div>
												</div>
												<div className="flex space-x-2">
													<button 
														onClick={() => startEdit(subtopic)}
														className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
														title="Edit subtopic"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
													<button 
														onClick={() => deleteSubtopic(subtopic.id, subtopic.name)}
														className="p-2 text-gray-400 hover:text-red-600 transition-colors"
														title="Delete subtopic"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white rounded-lg shadow px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-700">
									Showing page {currentPage} of {totalPages}
								</div>
								<div className="flex space-x-2">
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Previous
									</button>
									
									{getPageNumbers().map((page) => (
										<button
											key={page}
											onClick={() => handlePageChange(page)}
											className={`px-3 py-2 text-sm font-medium rounded-md ${
												currentPage === page
													? 'bg-blue-600 text-white'
													: 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
											}`}
										>
											{page}
										</button>
									))}
									
									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Next
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 