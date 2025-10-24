'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';
import LatexContentDisplay from '@/components/LatexContentDisplay';

interface Question {
	id: string;
	stem: string;
	explanation?: string;
	tip_formula?: string;
	difficulty: 'EASY' | 'MEDIUM' | 'HARD';
	yearAppeared?: number;
	isPreviousYear: boolean;
	status: 'approved' | 'underreview' | 'rejected';
	isOpenEnded: boolean;
	correctNumericAnswer?: number;
	answerTolerance?: number;
	// New fields for question types and marks system
	questionType?: 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH';
	parentQuestionId?: string;
	allowPartialMarking?: boolean;
	fullMarks?: number;
	partialMarks?: number;
	negativeMarks?: number;
	subjectId?: string;
	topicId?: string;
	subtopicId?: string;
	subject?: {
		id: string;
		name: string;
		stream?: {
			id: string;
			name: string;
			code: string;
		};
	};
	topic?: {
		id: string;
		name: string;
		subject?: {
			id: string;
			name: string;
			stream?: {
				id: string;
				name: string;
				code: string;
			};
		};
	};
	subtopic?: {
		id: string;
		name: string;
		topic?: {
			id: string;
			name: string;
			subject?: {
				id: string;
				name: string;
				stream?: {
					id: string;
					name: string;
					code: string;
				};
			};
		};
	};
	options: QuestionOption[];
	tags: QuestionTag[];
	createdAt: string;
}

interface QuestionOption {
	id: string;
	text: string;
	isCorrect: boolean;
	order: number;
}

interface QuestionTag {
	tag: {
		id: string;
		name: string;
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

interface Subtopic {
	id: string;
	name: string;
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
}

export default function QuestionsPage() {
	const router = useRouter();
	
	// Data states
	const [questions, setQuestions] = useState<Question[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	
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
	const [selectedLesson, setSelectedLesson] = useState('');
	const [selectedTopic, setSelectedTopic] = useState('');
	const [selectedSubtopic, setSelectedSubtopic] = useState('');
	const [selectedDifficulty, setSelectedDifficulty] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [selectedQuestionType, setSelectedQuestionType] = useState('');
	
	// Bulk selection states
	const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	

	

	


	const refresh = async (page = 1) => {
		try {
		const params = new URLSearchParams({
			page: page.toString(),
			limit: itemsPerPage.toString(),
			...(searchText && { search: searchText }),
			...(selectedSubject && { subjectId: selectedSubject }),
			...(selectedLesson && { lessonId: selectedLesson }),
			...(selectedTopic && { topicId: selectedTopic }),
			...(selectedSubtopic && { subtopicId: selectedSubtopic }),
			...(selectedDifficulty && { difficulty: selectedDifficulty }),
			...(selectedStatus && { status: selectedStatus }),
			...(selectedQuestionType && { questionType: selectedQuestionType })
		});

			const [questionsResponse, subjectsResponse, lessonsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get(`/admin/questions?${params}`),
				api.get('/admin/subjects'),
				api.get('/admin/lessons?limit=1000'), // Get all lessons
				api.get('/admin/topics?limit=1000'), // Get all topics
				api.get('/admin/subtopics?limit=1000') // Get all subtopics
			]);
			
			setQuestions(questionsResponse.data.questions || questionsResponse.data);
			setSubjects(subjectsResponse.data);
			setLessons(lessonsResponse.data.lessons || lessonsResponse.data);
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
			
			// Handle pagination data
			if (questionsResponse.data.pagination) {
				setTotalPages(questionsResponse.data.pagination.totalPages);
				setTotalItems(questionsResponse.data.pagination.totalItems);
			} else {
				// Fallback if no pagination data
				setTotalPages(1);
				setTotalItems(questionsResponse.data.length);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load questions and related data. Please refresh the page.',
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
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(page);
	};

	// Handle search
	const handleSearch = () => {
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle subject filter change
	const handleSubjectChange = (subjectId: string) => {
		setSelectedSubject(subjectId);
		setSelectedLesson('');
		setSelectedTopic('');
		setSelectedSubtopic('');
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle lesson filter change
	const handleLessonChange = (lessonId: string) => {
		setSelectedLesson(lessonId);
		setSelectedTopic('');
		setSelectedSubtopic('');
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle topic filter change
	const handleTopicChange = (topicId: string) => {
		setSelectedTopic(topicId);
		setSelectedSubtopic('');
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle subtopic filter change
	const handleSubtopicChange = (subtopicId: string) => {
		setSelectedSubtopic(subtopicId);
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Handle status filter change
	const handleStatusChange = (status: string) => {
		setSelectedStatus(status);
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Clear filters
	const clearFilters = () => {
		setSearchText('');
		setSelectedSubject('');
		setSelectedLesson('');
		setSelectedTopic('');
		setSelectedSubtopic('');
		setSelectedDifficulty('');
		setSelectedStatus('');
		setSelectedQuestionType('');
		setCurrentPage(1);
		setSelectedQuestions([]);
		setSelectAll(false);
		refresh(1);
	};

	// Filter lessons based on selected subject
	const filteredLessons = selectedSubject && Array.isArray(lessons)
		? lessons.filter(lesson => lesson.subject.id === selectedSubject)
		: Array.isArray(lessons) ? lessons : [];

	// Filter topics based on selected lesson
	const filteredTopics = selectedLesson && Array.isArray(topics)
		? topics.filter(topic => topic.lesson?.id === selectedLesson)
		: Array.isArray(topics) ? topics : [];

	// Filter subtopics based on selected topic
	const filteredSubtopics = selectedTopic && Array.isArray(subtopics)
		? subtopics.filter(subtopic => subtopic.topic.id === selectedTopic)
		: Array.isArray(subtopics) ? subtopics : [];





	const generateAnswer = async (id: string) => {
		const result = await Swal.fire({
			title: 'Generate Answer with AI?',
			text: 'This will use AI to generate/update the correct answer for this question. This may take a few moments.',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#8b5cf6',
			cancelButtonColor: '#6b7280',
			confirmButtonText: 'Yes, generate answer!',
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				Swal.fire({
					title: 'Generating Answer...',
					text: 'Please wait while AI generates the answer. This may take a few moments.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				const response = await api.post(`/admin/questions/${id}/generate-answer`);
				
				Swal.fire({
					title: 'Answer Generated!',
					text: 'AI has successfully generated the answer for this question.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error('Error generating answer:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to generate answer. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const updateQuestionStatus = async (id: string, status: 'approved' | 'rejected') => {
		const action = status === 'approved' ? 'approve' : 'reject';
		const result = await Swal.fire({
			title: `Are you sure?`,
			text: `You are about to ${action} this question.`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: status === 'approved' ? '#10b981' : '#ef4444',
			cancelButtonColor: '#6b7280',
			confirmButtonText: `Yes, ${action}!`,
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				Swal.fire({
					title: `${action.charAt(0).toUpperCase() + action.slice(1)}ing...`,
					text: `Please wait while we ${action} the question.`,
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.put(`/admin/questions/${id}/status`, { status });
				
				Swal.fire({
					title: `${action.charAt(0).toUpperCase() + action.slice(1)}ed!`,
					text: `Question has been ${action}d successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error(`Error ${action}ing question:`, error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || `Failed to ${action} the question. Please try again.`,
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const deleteQuestion = async (id: string, questionStem: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete this question. This action cannot be undone!`,
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
					text: 'Please wait while we delete the question.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.delete(`/admin/questions/${id}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'Question has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				refresh(currentPage);
			} catch (error: any) {
				console.error('Error deleting question:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the question. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const bulkUpdateQuestionStatus = async (status: 'approved' | 'rejected') => {
		if (selectedQuestions.length === 0) {
			Swal.fire({
				title: 'No Questions Selected',
				text: `Please select questions to ${status}.`,
				icon: 'info',
				confirmButtonText: 'OK'
			});
			return;
		}

		const action = status === 'approved' ? 'approve' : 'reject';
		const result = await Swal.fire({
			title: `Are you sure?`,
			text: `You are about to ${action} ${selectedQuestions.length} question${selectedQuestions.length !== 1 ? 's' : ''}.`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: status === 'approved' ? '#10b981' : '#ef4444',
			cancelButtonColor: '#6b7280',
			confirmButtonText: `Yes, ${action} them!`,
			cancelButtonText: 'Cancel',
			reverseButtons: true
		});

		if (result.isConfirmed) {
			try {
				Swal.fire({
					title: `${action.charAt(0).toUpperCase() + action.slice(1)}ing...`,
					text: `Please wait while we ${action} the questions.`,
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				// Update each question status
				await Promise.all(
					selectedQuestions.map(id => 
						api.put(`/admin/questions/${id}/status`, { status })
					)
				);
				
				Swal.fire({
					title: `${action.charAt(0).toUpperCase() + action.slice(1)}ed!`,
					text: `${selectedQuestions.length} question${selectedQuestions.length !== 1 ? 's have' : ' has'} been ${action}d successfully.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				setSelectedQuestions([]);
				setSelectAll(false);
				refresh(currentPage);
			} catch (error: any) {
				console.error(`Error ${action}ing questions:`, error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || `Failed to ${action} the questions. Please try again.`,
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const bulkDeleteQuestions = async () => {
		if (selectedQuestions.length === 0) {
			Swal.fire({
				title: 'No Questions Selected',
				text: 'Please select questions to delete.',
				icon: 'info',
				confirmButtonText: 'OK'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete ${selectedQuestions.length} question${selectedQuestions.length !== 1 ? 's' : ''}. This action cannot be undone!`,
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
					text: 'Please wait while we delete the questions.',
					allowOutsideClick: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				const response = await api.post('/admin/questions/bulk-delete', { ids: selectedQuestions });
				
				Swal.fire({
					title: 'Deleted!',
					text: response.data.message || 'Questions have been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				setSelectedQuestions([]);
				setSelectAll(false);
				refresh(currentPage);
			} catch (error: any) {
				console.error('Error deleting questions:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete the questions. Please try again.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedQuestions([]);
			setSelectAll(false);
		} else {
			setSelectedQuestions(questions.map(q => q.id));
			setSelectAll(true);
		}
	};

	const handleSelectQuestion = (questionId: string) => {
		setSelectedQuestions(prev => {
			if (prev.includes(questionId)) {
				const newSelection = prev.filter(id => id !== questionId);
				setSelectAll(false);
				return newSelection;
			} else {
				const newSelection = [...prev, questionId];
				setSelectAll(newSelection.length === questions.length);
				return newSelection;
			}
		});
	};

	const exportCsv = async () => {
		try {
			// Get the token from localStorage
			const token = localStorage.getItem('token');
			if (!token) {
				Swal.fire({
					title: 'Authentication Error',
					text: 'Please log in again to export questions.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
				return;
			}

			// Create a temporary link element
			const link = document.createElement('a');
			link.href = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001') + '/admin/questions/export';
			link.download = 'questions.csv';
			
			// Add authorization header to the request
			const response = await fetch(link.href, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Get the blob and create download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			link.href = url;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			Swal.fire({
				title: 'Success!',
				text: 'Questions exported successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
		} catch (error: any) {
			console.error('Error exporting questions:', error);
			Swal.fire({
				title: 'Error!',
				text: error.message || 'Failed to export questions. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const onImport = async (e: any) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		try {
			const form = new FormData();
			form.append('file', file);
			await api.post('/admin/questions/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
			
			Swal.fire({
				title: 'Success!',
				text: 'Questions have been imported successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			refresh(currentPage);
		} catch (error: any) {
			console.error('Error importing questions:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to import questions. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
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
					<p className="mt-4 text-gray-600">Loading questions...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Questions</h1>
							<p className="text-gray-600">Manage JEE questions with comprehensive details</p>
						</div>
						<div className="flex items-center space-x-4">
							<button 
								onClick={() => router.push('/admin/questions/add')}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Add Question
							</button>
							<div className="text-sm text-gray-500">
								{totalItems} question{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
							</div>
						</div>
					</div>



					{/* Filters Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-9 gap-3">
							<input 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium placeholder-gray-500" 
								placeholder="Search questions..." 
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
										{topic.name} ({topic.lesson?.subject?.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedSubtopic}
								onChange={e => handleSubtopicChange(e.target.value)}
								disabled={!selectedTopic}
							>
								<option value="">All Subtopics</option>
								{Array.isArray(filteredSubtopics) && filteredSubtopics.map(subtopic => (
									<option key={subtopic.id} value={subtopic.id}>
										{subtopic.name} ({subtopic.topic?.subject?.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedDifficulty}
								onChange={e => {
									setSelectedDifficulty(e.target.value);
									setCurrentPage(1);
									setSelectedQuestions([]);
									setSelectAll(false);
									refresh(1);
								}}
							>
								<option value="">All Difficulties</option>
								<option value="EASY">Easy</option>
								<option value="MEDIUM">Medium</option>
								<option value="HARD">Hard</option>
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedStatus}
								onChange={e => handleStatusChange(e.target.value)}
							>
								<option value="">All Status</option>
								<option value="approved">Approved</option>
								<option value="underreview">Under Review</option>
								<option value="rejected">Rejected</option>
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedQuestionType}
								onChange={e => {
									setSelectedQuestionType(e.target.value);
									setCurrentPage(1);
									setSelectedQuestions([]);
									setSelectAll(false);
									refresh(1);
								}}
							>
								<option value="">All Types</option>
								<option value="MCQ_SINGLE">MCQ Single</option>
								<option value="MCQ_MULTIPLE">MCQ Multiple</option>
								<option value="OPEN_ENDED">Open Ended</option>
								<option value="PARAGRAPH">Paragraph</option>
							</select>
							<button 
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								onClick={handleSearch}
							>
								Search
							</button>
						</div>
						<div className="flex space-x-3 mt-3">
							<button 
								className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
								onClick={clearFilters}
							>
								Clear Filters
							</button>
							<button 
								className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
								onClick={exportCsv}
							>
								Export CSV
							</button>
							<div className="flex items-center">
								<input 
									type="file" 
									accept=".csv" 
									onChange={onImport}
									className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
								/>
							</div>
						</div>
					</div>

					{/* All Questions Section */}
					<div className="bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<h2 className="text-lg font-semibold text-gray-900">All Questions</h2>
							</div>
							{selectedQuestions.length > 0 && (
								<div className="flex items-center space-x-3">
									<span className="text-sm text-gray-600">
										{selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
									</span>
									<button 
										onClick={() => bulkUpdateQuestionStatus('approved')}
										className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
									>
										Approve Selected
									</button>
									<button 
										onClick={() => bulkUpdateQuestionStatus('rejected')}
										className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
									>
										Reject Selected
									</button>
									<button 
										onClick={bulkDeleteQuestions}
										className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
									>
										Delete Selected
									</button>
								</div>
							)}
						</div>
						
						{questions.length === 0 ? (
							<div className="p-12 text-center">
								<div className="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
								<p className="mt-1 text-sm text-gray-500">
									{searchText || selectedSubject || selectedTopic || selectedSubtopic || selectedDifficulty ? 'Try adjusting your search criteria.' : 'Get started by creating a new question.'}
								</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{questions.map((question) => (
									<div key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
										<div className="space-y-3">
											<div className="flex items-start justify-between">
												<div className="flex items-start space-x-3 flex-1">
													<input
														type="checkbox"
														checked={selectedQuestions.includes(question.id)}
														onChange={() => handleSelectQuestion(question.id)}
														className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
													/>
													<div className="flex-1">
														<div className="text-lg font-medium text-gray-900 mb-2">
															<LatexContentDisplay content={question.stem} />
														</div>
														{question.explanation && (
															<div className="text-sm text-gray-600 mb-2">
																<LatexContentDisplay content={question.explanation} />
															</div>
														)}
														<div className="flex flex-wrap gap-2 mb-3">
															{question.subject && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																	{question.subject.name}
																	{question.subject.stream && (
																		<span className="ml-1 text-blue-600">({question.subject.stream.code})</span>
																	)}
																</span>
															)}
															{question.topic && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	{question.topic.name}
																	{question.topic.subject?.stream && (
																		<span className="ml-1 text-green-600">({question.topic.subject.stream.code})</span>
																	)}
																</span>
															)}
															{question.subtopic && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																	{question.subtopic.name}
																	{question.subtopic.topic?.subject?.stream && (
																		<span className="ml-1 text-purple-600">({question.subtopic.topic.subject.stream.code})</span>
																	)}
																</span>
															)}
															<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
																question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
																'bg-red-100 text-red-800'
															}`}>
																{question.difficulty}
															</span>
															{question.isPreviousYear && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
																	Previous Year
																</span>
															)}
															{question.yearAppeared && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																	{question.yearAppeared}
																</span>
															)}
															<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																question.status === 'approved' ? 'bg-green-100 text-green-800' :
																question.status === 'underreview' ? 'bg-yellow-100 text-yellow-800' :
																'bg-red-100 text-red-800'
															}`}>
																{question.status === 'underreview' ? 'Under Review' : 
																 question.status === 'approved' ? 'Approved' : 'Rejected'}
															</span>
															{question.questionType && (
																<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																	question.questionType === 'MCQ_SINGLE' ? 'bg-blue-100 text-blue-800' :
																	question.questionType === 'MCQ_MULTIPLE' ? 'bg-purple-100 text-purple-800' :
																	question.questionType === 'OPEN_ENDED' ? 'bg-indigo-100 text-indigo-800' :
																	'bg-pink-100 text-pink-800'
																}`}>
																	{question.questionType === 'MCQ_SINGLE' ? 'MCQ Single' :
																	 question.questionType === 'MCQ_MULTIPLE' ? 'MCQ Multiple' :
																	 question.questionType === 'OPEN_ENDED' ? 'Open Ended' :
																	 'Paragraph'}
																</span>
															)}
															{question.allowPartialMarking && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
																	Partial Marking
																</span>
															)}
															{question.fullMarks && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																	{question.fullMarks} marks
																</span>
															)}
														</div>
														<div className="space-y-2">
															{/* Handle different question types */}
															{question.questionType === 'PARAGRAPH' ? (
																<div className="p-3 bg-pink-50 border border-pink-200 rounded">
																	<div className="text-sm font-medium text-pink-700 mb-2">
																		Paragraph Question
																	</div>
																	<div className="text-xs text-pink-600">
																		This is a paragraph-based question. Sub-questions are managed separately.
																	</div>
																</div>
															) : question.questionType === 'OPEN_ENDED' || question.isOpenEnded ? (
																<div className="p-3 bg-blue-50 border border-blue-200 rounded">
																	<div className="flex items-center space-x-2">
																		<span className="text-sm font-medium text-blue-700">Numeric Answer:</span>
																		<span className="text-sm font-bold text-blue-900">
																			{question.correctNumericAnswer}
																		</span>
																		<span className="text-xs text-blue-600">
																			(±{question.answerTolerance || 0.01})
																		</span>
																	</div>
																	<div className="text-xs text-blue-600 mt-1">
																		Open-ended question - requires numeric input
																	</div>
																</div>
															) : question.options && question.options.length > 0 ? (
																<div className="space-y-1">
																	{question.questionType === 'MCQ_MULTIPLE' && (
																		<div className="text-xs text-purple-600 font-medium mb-2">
																			Multiple correct options - partial marking allowed
																		</div>
																	)}
																	{question.options.map((option, index) => (
																		<div key={option.id} className={`flex items-center space-x-2 p-2 rounded ${
																			option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
																		}`}>
																			<span className="text-sm font-medium text-gray-600">{String.fromCharCode(65 + index)}.</span>
																			<span className={`text-sm ${option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
																				<LatexContentDisplay content={option.text} />
																			</span>
																			{option.isCorrect && (
																				<span className="text-green-600 text-xs font-medium">✓ Correct</span>
																			)}
																		</div>
																	))}
																</div>
															) : (
																<div className="p-3 bg-gray-50 border border-gray-200 rounded">
																	<div className="text-sm text-gray-600">
																		No options available for this question type
																	</div>
																</div>
															)}
														</div>
														{question.tags.length > 0 && (
															<div className="flex flex-wrap gap-1 mt-3">
																{question.tags.map((tag) => (
																	<span key={tag.tag.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
																		{tag.tag.name}
																	</span>
																))}
															</div>
														)}
													</div>
												</div>
												<div className="flex space-x-2 ml-4">
													<button 
														onClick={() => generateAnswer(question.id)}
														className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
														title="Generate Answer with AI"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
														</svg>
													</button>
													{question.status === 'underreview' && (
														<>
															<button 
																onClick={() => updateQuestionStatus(question.id, 'approved')}
																className="p-2 text-gray-400 hover:text-green-600 transition-colors"
																title="Approve question"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																</svg>
															</button>
															<button 
																onClick={() => updateQuestionStatus(question.id, 'rejected')}
																className="p-2 text-gray-400 hover:text-red-600 transition-colors"
																title="Reject question"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																</svg>
															</button>
														</>
													)}
													<button 
														onClick={() => router.push(`/admin/questions/edit/${question.id}`)}
														className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
														title="Edit question"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
													<button 
														onClick={() => deleteQuestion(question.id, question.stem)}
														className="p-2 text-gray-400 hover:text-red-600 transition-colors"
														title="Delete question"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
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