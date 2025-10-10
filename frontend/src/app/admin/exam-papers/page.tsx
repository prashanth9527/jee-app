'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface ExamPaper {
	id: string;
	title: string;
	description?: string;
	subjectIds: string[];
	topicIds: string[];
	subtopicIds: string[];
	questionIds: string[];
	timeLimitMin?: number;
	createdAt: string;
	updatedAt: string;
	_count?: {
		submissions: number;
	};
	questions?: Question[];
	submissions?: Submission[];
}

interface Question {
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
}

interface Submission {
	id: string;
	startedAt: string;
	submittedAt?: string;
	totalQuestions: number;
	correctCount: number;
	scorePercent?: number;
	user: {
		id: string;
		fullName: string;
		email: string;
	};
}

interface Subject {
	id: string;
	name: string;
}

interface Topic {
	id: string;
	name: string;
	subject: {
		id: string;
		name: string;
	};
}

interface Subtopic {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
		subject: {
			id: string;
			name: string;
		};
	};
}

export default function AdminExamPapersPage() {
	const router = useRouter();
	
	// Data states
	const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	
	// Filter states
	const [searchText, setSearchText] = useState('');
	const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	


	const refresh = async (page = 1) => {
		try {
			const searchParam = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
			const [examPapersResponse, subjectsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get(`/admin/exam-papers?page=${page}&limit=${itemsPerPage}${searchParam}`),
				api.get('/admin/subjects'),
				api.get('/admin/topics?limit=1000'),
				api.get('/admin/subtopics?limit=1000')
			]);
			
			setExamPapers(examPapersResponse.data.examPapers || examPapersResponse.data);
			
			// Update pagination data
			if (examPapersResponse.data.pagination) {
				setCurrentPage(examPapersResponse.data.pagination.currentPage);
				setTotalPages(examPapersResponse.data.pagination.totalPages);
				setTotalItems(examPapersResponse.data.pagination.totalItems);
			}
			
			setSubjects(subjectsResponse.data);
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load exam papers and related data. Please refresh the page.',
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

	// Pagination functions
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		refresh(page);
	};

	const handleSearch = (value: string) => {
		setSearchText(value);
		setCurrentPage(1); // Reset to first page when searching
		// Use setTimeout to debounce the search
		setTimeout(() => {
			refresh(1);
		}, 300);
	};

	const handleItemsPerPageChange = (newItemsPerPage: number) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1); // Reset to first page when changing items per page
		refresh(1);
	};

	const clearSearch = () => {
		setSearchText('');
		setCurrentPage(1);
		refresh(1);
	};





	const deleteExamPaper = async (id: string, paperTitle: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${paperTitle}". This action cannot be undone!`,
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
					text: 'Please wait while we delete the exam paper.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/exam-papers/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'Exam paper has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh();
			} catch (error: any) {
				console.error('Error deleting exam paper:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the exam paper. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const bulkDeleteExamPapers = async () => {
		if (selectedPapers.length === 0) {
			Swal.fire({
				title: 'No Exam Papers Selected',
				text: 'Please select exam papers to delete.',
				icon: 'info',
				confirmButtonText: 'OK'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete ${selectedPapers.length} exam paper${selectedPapers.length !== 1 ? 's' : ''}. This action cannot be undone!`,
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
					text: 'Please wait while we delete the exam papers.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				const response = await api.delete('/admin/exam-papers/bulk', { data: { ids: selectedPapers } });
				
				Swal.fire({
					title: 'Deleted!',
					text: response.data.message || 'Exam papers have been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				setSelectedPapers([]);
				setSelectAll(false);
				refresh();
			} catch (error: any) {
				console.error('Error deleting exam papers:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the exam papers. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedPapers([]);
			setSelectAll(false);
		} else {
			setSelectedPapers(examPapers.map(paper => paper.id));
			setSelectAll(true);
		}
	};

	const handleSelectPaper = (paperId: string) => {
		setSelectedPapers(prev => {
			if (prev.includes(paperId)) {
				const newSelection = prev.filter(id => id !== paperId);
				setSelectAll(false);
				return newSelection;
			} else {
				const newSelection = [...prev, paperId];
				setSelectAll(newSelection.length === examPapers.length);
				return newSelection;
			}
		});
	};



	const toggleExpanded = async (paperId: string) => {
		if (expandedPaper === paperId) {
			setExpandedPaper(null);
		} else {
			try {
				const { data } = await api.get(`/admin/exam-papers/${paperId}`);
				// Update the paper with detailed data
				setExamPapers(prev => prev.map(paper => 
					paper.id === paperId ? { ...paper, questions: data.questions, submissions: data.submissions } : paper
				));
				setExpandedPaper(paperId);
			} catch (error) {
				console.error('Error fetching exam paper details:', error);
				Swal.fire({
					title: 'Error!',
					text: 'Failed to load exam paper details.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	// Since we're using server-side pagination and search, we don't need client-side filtering
	const filteredExamPapers = examPapers;

	// Calculate statistics for current page
	const totalSubmissions = examPapers.reduce((sum, paper) => sum + (paper._count?.submissions || 0), 0);
	const papersWithSubmissions = examPapers.filter(paper => paper._count?.submissions && paper._count.submissions > 0).length;

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading exam papers...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Exam Papers</h1>
							<p className="text-gray-600">Create and manage practice exam papers for students</p>
						</div>
						<div className="flex items-center space-x-3">
							<div className="text-sm text-gray-500">
								{totalItems} exam paper{totalItems !== 1 ? 's' : ''} • {searchText ? `${examPapers.length} filtered` : 'All papers'}
							</div>
							<div className="flex items-center space-x-2">
								<button
									onClick={() => router.push('/admin/exam-papers/create')}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									<span>Create New</span>
								</button>
								<button
									onClick={() => router.push('/admin/exam-papers/create-enhanced')}
									className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<span>Enhanced Create</span>
								</button>
							</div>
						</div>
					</div>

					{/* Statistics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-blue-100 rounded-lg">
									<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-semibold text-gray-700">Total Papers</p>
									<p className="text-2xl font-bold text-gray-900">{totalItems}</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-green-100 rounded-lg">
									<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-semibold text-gray-700">Total Submissions</p>
									<p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-purple-100 rounded-lg">
									<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-semibold text-gray-700">Active Papers</p>
									<p className="text-2xl font-bold text-gray-900">{papersWithSubmissions}</p>
								</div>
							</div>
						</div>
					</div>



					{/* Search and Bulk Actions */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-3">
								<input
									type="text"
									placeholder="Search exam papers..."
									value={searchText}
									onChange={e => handleSearch(e.target.value)}
									className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
								/>
								{searchText && (
									<button
										onClick={clearSearch}
										className="text-gray-400 hover:text-gray-600"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>
							{selectedPapers.length > 0 && (
								<button
									onClick={bulkDeleteExamPapers}
									className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
								>
									Delete Selected ({selectedPapers.length})
								</button>
							)}
						</div>
					</div>

					{/* Exam Papers List */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<h2 className="text-xl font-bold text-gray-900">All Exam Papers</h2>
							</div>
							{selectedPapers.length > 0 && (
								<span className="text-sm text-gray-600">
									{selectedPapers.length} selected
								</span>
							)}
						</div>
						
						{filteredExamPapers.length === 0 ? (
							<div className="p-12 text-center">
								<div className="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No exam papers found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchText ? 'Try adjusting your search criteria.' : 'Get started by creating a new exam paper.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{filteredExamPapers.map((paper) => (
									<div key={paper.id} className="p-6 hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<input
													type="checkbox"
													checked={selectedPapers.includes(paper.id)}
													onChange={() => handleSelectPaper(paper.id)}
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
												<div className="flex-1">
													<div>
														<h3 className="text-lg font-medium text-gray-900 mb-1">{paper.title}</h3>
														{paper.description && (
															<p className="text-sm text-gray-600 mb-2">{paper.description}</p>
														)}
														<div className="flex flex-wrap gap-2">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																{paper.questionIds.length} questions
															</span>
															{paper.timeLimitMin && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	{paper.timeLimitMin} min
																</span>
															)}
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																{paper._count?.submissions || 0} submissions
															</span>
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																{new Date(paper.createdAt).toLocaleDateString()}
															</span>
														</div>
													</div>
												</div>
											</div>
											<div className="flex space-x-2">
												<button 
													onClick={() => router.push(`/admin/exam-papers/${paper.id}`)}
													className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
													title="Preview exam"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
												<button 
													onClick={() => router.push(`/admin/exam-papers/create-enhanced?edit=${paper.id}`)}
													className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
													title="Edit exam paper"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
												<button 
													onClick={() => deleteExamPaper(paper.id, paper.title)}
													className="p-2 text-gray-400 hover:text-red-600 transition-colors"
													title="Delete exam paper"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
										
										{/* Expanded Details */}
										{expandedPaper === paper.id && (
											<div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4 space-y-4">
												{paper.questions && paper.questions.length > 0 && (
													<div>
														<h4 className="text-sm font-medium text-gray-700 mb-2">Questions ({paper.questions.length}):</h4>
														<div className="space-y-2">
															{paper.questions.slice(0, 5).map((question) => (
																<div key={question.id} className="bg-gray-50 rounded p-3">
																	<p className="text-sm text-gray-900 mb-1">{question.stem}</p>
																	<div className="flex flex-wrap gap-1">
																		{question.subject && (
																			<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
																				{question.subject.name}
																			</span>
																		)}
																		{question.topic && (
																			<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
																				{question.topic.name}
																			</span>
																		)}
																		{question.subtopic && (
																			<span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
																				{question.subtopic.name}
																			</span>
																		)}
																	</div>
																</div>
															))}
															{paper.questions.length > 5 && (
																<p className="text-sm text-gray-500 italic">
																	... and {paper.questions.length - 5} more questions
																</p>
															)}
														</div>
													</div>
												)}
												
												{paper.submissions && paper.submissions.length > 0 && (
													<div>
														<h4 className="text-sm font-medium text-gray-700 mb-2">Recent Submissions ({paper.submissions.length}):</h4>
														<div className="space-y-2">
															{paper.submissions.map((submission) => (
																<div key={submission.id} className="bg-gray-50 rounded p-3">
																	<div className="flex justify-between items-center">
																		<div>
																			<p className="text-sm font-medium text-gray-900">{submission.user.fullName}</p>
																			<p className="text-xs text-gray-500">{submission.user.email}</p>
																		</div>
																		<div className="text-right">
																			{submission.submittedAt ? (
																				<>
																					<p className="text-sm font-medium text-gray-900">
																						{Math.round((submission.scorePercent || 0) * 100) / 100}%
																					</p>
																					<p className="text-xs text-gray-500">
																						{submission.correctCount}/{submission.totalQuestions}
																					</p>
																				</>
																			) : (
																				<span className="text-xs text-yellow-600 font-medium">In Progress</span>
																			)}
																		</div>
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						)}
						
						{/* Pagination Controls */}
						{totalPages > 1 && (
							<div className="px-6 py-4 border-t border-gray-200">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<span className="text-sm text-gray-700">
											Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
										</span>
										<select
											value={itemsPerPage}
											onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
											className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										>
											<option value={5}>5 per page</option>
											<option value={10}>10 per page</option>
											<option value={20}>20 per page</option>
											<option value={50}>50 per page</option>
										</select>
									</div>
									
									<div className="flex items-center space-x-2">
										<button
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 1}
											className={`px-3 py-1 text-sm rounded-md transition-colors ${
												currentPage === 1
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
											}`}
										>
											Previous
										</button>
										
										{/* Page Numbers */}
										<div className="flex items-center space-x-1">
											{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
												let pageNum;
												if (totalPages <= 5) {
													pageNum = i + 1;
												} else if (currentPage <= 3) {
													pageNum = i + 1;
												} else if (currentPage >= totalPages - 2) {
													pageNum = totalPages - 4 + i;
												} else {
													pageNum = currentPage - 2 + i;
												}
												
												return (
													<button
														key={pageNum}
														onClick={() => handlePageChange(pageNum)}
														className={`px-3 py-1 text-sm rounded-md transition-colors ${
															currentPage === pageNum
																? 'bg-blue-600 text-white'
																: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
														}`}
													>
														{pageNum}
													</button>
												);
											})}
										</div>
										
										<button
											onClick={() => handlePageChange(currentPage + 1)}
											disabled={currentPage === totalPages}
											className={`px-3 py-1 text-sm rounded-md transition-colors ${
												currentPage === totalPages
													? 'bg-gray-100 text-gray-400 cursor-not-allowed'
													: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
											}`}
										>
											Next
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 