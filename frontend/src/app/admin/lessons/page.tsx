'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Lesson {
	id: string;
	name: string;
	description?: string;
	order: number;
	subject: {
		id: string;
		name: string;
		stream?: {
			id: string;
			name: string;
			code: string;
		};
	};
	_count?: {
		topics: number;
	};
	createdAt: string;
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

export default function LessonsPage() {
	const router = useRouter();
	
	// Data states
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [itemsPerPage] = useState(10);
	
	// Filter states
	const [searchText, setSearchText] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	
	// Bulk selection states
	const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);

	const refresh = async (page = 1) => {
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(searchText && { search: searchText }),
				...(selectedSubject && { subjectId: selectedSubject })
			});

			const [lessonsResponse, subjectsResponse] = await Promise.all([
				api.get(`/admin/lessons?${params}`),
				api.get('/admin/subjects')
			]);
			
			setLessons(lessonsResponse.data.lessons || lessonsResponse.data);
			setSubjects(subjectsResponse.data);
			
			// Handle pagination data
			if (lessonsResponse.data.pagination) {
				setTotalPages(lessonsResponse.data.pagination.totalPages);
				setTotalItems(lessonsResponse.data.pagination.totalItems);
			} else {
				// Fallback if no pagination data
				setTotalPages(1);
				setTotalItems(lessonsResponse.data.length);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load lessons and related data. Please refresh the page.',
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
		setSelectedLessons([]);
		setSelectAll(false);
		refresh(page);
	};

	// Handle search
	const handleSearch = () => {
		setCurrentPage(1);
		setSelectedLessons([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle subject filter change
	const handleSubjectChange = (subjectId: string) => {
		setSelectedSubject(subjectId);
		setCurrentPage(1);
		setSelectedLessons([]);
		setSelectAll(false);
		refresh(1);
	};

	// Clear filters
	const clearFilters = () => {
		setSearchText('');
		setSelectedSubject('');
		setCurrentPage(1);
		setSelectedLessons([]);
		setSelectAll(false);
		refresh(1);
	};

	const deleteLesson = async (id: string, lessonName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${lessonName}". This action cannot be undone!`,
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
					text: 'Please wait while we delete the lesson.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/lessons/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'Lesson has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error('Error deleting lesson:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the lesson. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedLessons([]);
			setSelectAll(false);
		} else {
			setSelectedLessons(lessons.map(l => l.id));
			setSelectAll(true);
		}
	};

	const handleSelectLesson = (lessonId: string) => {
		setSelectedLessons(prev => {
			if (prev.includes(lessonId)) {
				const newSelection = prev.filter(id => id !== lessonId);
				setSelectAll(false);
				return newSelection;
			} else {
				const newSelection = [...prev, lessonId];
				setSelectAll(newSelection.length === lessons.length);
				return newSelection;
			}
		});
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
					<p className="mt-4 text-gray-600">Loading lessons...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
							<p className="text-gray-600">Manage JEE lessons within subjects</p>
						</div>
						<div className="flex items-center space-x-4">
							<button 
								onClick={() => router.push('/admin/lessons/add')}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Add Lesson
							</button>
							<div className="text-sm text-gray-500">
								{totalItems} lesson{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
							</div>
						</div>
					</div>

					{/* Filters Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
							<input 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
								placeholder="Search lessons or subjects..." 
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

					{/* All Lessons Section */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<h2 className="text-lg font-semibold text-gray-900">All Lessons</h2>
							</div>
						</div>
						
						{lessons.length === 0 ? (
							<div className="p-12 text-center">
								<div className="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
								</div>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No lessons found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchText || selectedSubject ? 'Try adjusting your search criteria.' : 'Get started by creating a new lesson.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{lessons.map((lesson) => (
									<div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
										<div className="space-y-3">
											<div className="flex items-start justify-between">
												<div className="flex items-start space-x-3 flex-1">
													<input
														type="checkbox"
														checked={selectedLessons.includes(lesson.id)}
														onChange={() => handleSelectLesson(lesson.id)}
														className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
													/>
													<div className="flex-1">
														<div className="flex items-center space-x-3 mb-2">
															<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
																<span className="text-blue-600 font-bold text-lg">
																	{lesson.name.charAt(0).toUpperCase()}
																</span>
															</div>
															<div>
																<h3 className="text-lg font-medium text-gray-900">{lesson.name}</h3>
																{lesson.description && (
																	<p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
																)}
															</div>
														</div>
														<div className="flex flex-wrap gap-2 mb-3">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																Subject: {lesson.subject.name}
																{lesson.subject.stream && (
																	<span className="ml-1 text-blue-600">({lesson.subject.stream.code})</span>
																)}
															</span>
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																Order: {lesson.order}
															</span>
															{lesson._count && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																	{lesson._count.topics} Topic{lesson._count.topics !== 1 ? 's' : ''}
																</span>
															)}
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																Created {new Date(lesson.createdAt).toLocaleDateString('en-GB')}
															</span>
														</div>
													</div>
												</div>
												<div className="flex space-x-2 ml-4">
													<button 
														onClick={() => router.push(`/admin/lessons/edit/${lesson.id}`)}
														className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
														title="Edit lesson"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
													<button 
														onClick={() => deleteLesson(lesson.id, lesson.name)}
														className="p-2 text-gray-400 hover:text-red-600 transition-colors"
														title="Delete lesson"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</div>
										</div>
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






