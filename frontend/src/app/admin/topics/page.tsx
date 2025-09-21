/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Swal from 'sweetalert2';

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

interface Topic {
  id: string;
  name: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    stream?: {
      id: string;
      name: string;
      code: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminTopicsPage() {
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
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
	
	// Form states
	const [name, setName] = useState('');
	const [subjectId, setSubjectId] = useState('');
	const [editName, setEditName] = useState('');
	const [editSubjectId, setEditSubjectId] = useState('');
	
	// Toggle states
	const [showAddForm, setShowAddForm] = useState(false);

	const refresh = async (page = 1) => {
		try {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: itemsPerPage.toString(),
			...(searchText && { search: searchText }),
			...(selectedSubject && { subjectId: selectedSubject }),
			...(selectedLesson && { lessonId: selectedLesson })
		});

			const [topicsResponse, subjectsResponse, lessonsResponse] = await Promise.all([
				api.get(`/admin/topics?${params}`),
				api.get('/admin/subjects'),
				api.get('/admin/lessons?limit=1000')
			]);
			
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubjects(subjectsResponse.data);
			setLessons(lessonsResponse.data.lessons || lessonsResponse.data);
			
			// Handle pagination data
			if (topicsResponse.data.pagination) {
				setTotalPages(topicsResponse.data.pagination.totalPages);
				setTotalItems(topicsResponse.data.pagination.totalItems);
			} else {
				// Fallback if no pagination data
				setTotalPages(1);
				setTotalItems(topicsResponse.data.length);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load topics and subjects. Please refresh the page.',
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
		setCurrentPage(1);
		refresh(1);
	};

	// Handle lesson filter change
	const handleLessonChange = (lessonId: string) => {
		setSelectedLesson(lessonId);
		setCurrentPage(1);
		refresh(1);
	};

	// Clear filters
	const clearFilters = () => {
		setSearchText('');
		setSelectedSubject('');
		setSelectedLesson('');
		setCurrentPage(1);
		refresh(1);
	};

	// Filter lessons based on selected subject
	const filteredLessons = selectedSubject && Array.isArray(lessons)
		? lessons.filter(lesson => lesson.subject.id === selectedSubject)
		: Array.isArray(lessons) ? lessons : [];

	const add = async () => {
		if (!name.trim() || !subjectId) {
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
			await api.post('/admin/topics', { name: name.trim(), subjectId });
			setName('');
			setSubjectId('');
			
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
			console.error('Error adding topic:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to add the topic. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const startEdit = (topic: Topic) => {
		setEditing(topic.id);
		setEditName(topic.name);
		setEditSubjectId(topic.subjectId);
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditName('');
		setEditSubjectId('');
	};

	const update = async (topicId: string) => {
		if (!editName.trim() || !editSubjectId) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		try {
			await api.put(`/admin/topics/${topicId}`, { 
				name: editName.trim(), 
				subjectId: editSubjectId 
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
			console.error('Error updating topic:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update the topic. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const deleteTopic = async (id: string, topicName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${topicName}". This action cannot be undone!`,
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
					text: 'Please wait while we delete the topic.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/topics/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: `"${topicName}" has been deleted successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error('Error deleting topic:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the topic. Please try again.',
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

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading topics...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Topics</h1>
							<p className="text-gray-600">Manage JEE topics within subjects</p>
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
								{totalItems} topic{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
							</div>
						</div>
					</div>

					{/* Add New Topic Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-900">Add New Topic</h2>
							{/* Removed toggle button */}
						</div>
						
						{showAddForm && (
							<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
								<input 
									className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
									placeholder="Enter topic name" 
									value={name} 
									onChange={e => setName(e.target.value)}
									onKeyPress={e => e.key === 'Enter' && add()}
								/>
								<select 
									className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									value={subjectId}
									onChange={e => setSubjectId(e.target.value)}
								>
									<option value="" className="text-gray-600">Select Subject</option>
									{subjects.map(subject => (
										<option key={subject.id} value={subject.id} className="text-gray-900">
											{subject.name} ({subject.stream?.code || 'N/A'})
										</option>
									))}
								</select>
								<button 
									className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
										adding || !name.trim() || !subjectId
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-blue-600 hover:bg-blue-700'
									}`}
									onClick={add}
									disabled={adding || !name.trim() || !subjectId}
								>
									{adding ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Adding...
										</div>
									) : (
										'Add Topic'
									)}
								</button>
								<button 
									className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
									onClick={() => {
										setName('');
										setSubjectId('');
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
						<div className="grid grid-cols-1 md:grid-cols-5 gap-3">
							<input 
								className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
								placeholder="Search topics or subjects..." 
								value={searchText}
								onChange={e => setSearchText(e.target.value)}
								onKeyPress={e => e.key === 'Enter' && handleSearch()}
							/>
							<select 
								className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								value={selectedSubject}
								onChange={e => handleSubjectChange(e.target.value)}
							>
								<option value="" className="text-gray-600">All Subjects</option>
								{subjects.map(subject => (
									<option key={subject.id} value={subject.id} className="text-gray-900">
										{subject.name} ({subject.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								value={selectedLesson}
								onChange={e => handleLessonChange(e.target.value)}
								disabled={!selectedSubject}
							>
								<option value="" className="text-gray-600">All Lessons</option>
								{Array.isArray(filteredLessons) && filteredLessons.map(lesson => (
									<option key={lesson.id} value={lesson.id} className="text-gray-900">
										{lesson.name} ({lesson.subject?.stream?.code || 'N/A'})
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

					{/* All Topics Section */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">All Topics</h2>
						</div>
						<div className="divide-y divide-gray-200">
							{topics.length === 0 ? (
								<div className="px-6 py-8 text-center">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
									<p className="mt-1 text-sm text-gray-500">
										{searchText || selectedSubject ? 'Try adjusting your search criteria.' : 'Get started by creating a new topic.'}
									</p>
								</div>
							) : (
								topics.map((topic) => (
									<div key={topic.id} className="px-6 py-4">
										{editing === topic.id ? (
											// Edit Mode
											<div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
												<input 
													className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
													value={editName} 
													onChange={e => setEditName(e.target.value)}
												/>
												<select 
													className="border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
													value={editSubjectId}
													onChange={e => setEditSubjectId(e.target.value)}
												>
													{subjects.map(subject => (
														<option key={subject.id} value={subject.id} className="text-gray-900">
															{subject.name} ({subject.stream?.code || 'N/A'})
														</option>
													))}
												</select>
												<div className="flex items-center space-x-2">
													<button 
														className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
														onClick={() => update(topic.id)}
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
											// View Mode
											<div className="flex items-center justify-between">
												<div className="flex items-center">
													<div className="flex-shrink-0">
														<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
															<span className="text-sm font-semibold text-green-700">
																{topic.name.charAt(0).toUpperCase()}
															</span>
														</div>
													</div>
													<div className="ml-4">
														<div className="text-sm font-semibold text-gray-900">{topic.name}</div>
														<div className="text-sm text-gray-700 mt-1">
															Subject: <span className="font-semibold">{topic.subject?.name || 'Unknown Subject'}</span>
															{topic.subject?.stream && (
																<span className="text-gray-600"> ({topic.subject.stream.code})</span>
															)}
															• Created {new Date(topic.createdAt).toLocaleDateString()}
														</div>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<button 
														className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
														onClick={() => startEdit(topic)}
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
													<button 
														className="text-gray-500 hover:text-red-600 p-1 transition-colors"
														onClick={() => deleteTopic(topic.id, topic.name)}
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</div>
										)}
									</div>
								))
							)}
						</div>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-700">
									Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
								</div>
								<div className="flex items-center space-x-2">
									{/* Previous Button */}
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className={`px-3 py-2 text-sm font-medium rounded-md ${
											currentPage === 1
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
										}`}
									>
										Previous
									</button>

									{/* Page Numbers */}
									{getPageNumbers().map(page => (
										<button
											key={page}
											onClick={() => handlePageChange(page)}
											className={`px-3 py-2 text-sm font-medium rounded-md ${
												page === currentPage
													? 'bg-blue-600 text-white'
													: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
											}`}
										>
											{page}
										</button>
									))}

									{/* Next Button */}
									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className={`px-3 py-2 text-sm font-medium rounded-md ${
											currentPage === totalPages
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
										}`}
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