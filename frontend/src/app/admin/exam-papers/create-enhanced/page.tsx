'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';
import LatexContentDisplay from '@/components/LatexContentDisplay';
import MathRenderer from '@/components/MathRenderer';

interface Stream {
	id: string;
	name: string;
	code: string;
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
	};
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

interface Question {
	id: string;
	stem: string;
	subject?: {
		id: string;
		name: string;
		stream?: {
			id: string;
			name: string;
			code: string;
		};
	};
	lesson?: {
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
	options?: Array<{
		id: string;
		text: string;
		isCorrect: boolean;
	}>;
}

function CreateEnhancedExamPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const editId = searchParams ? searchParams.get('edit') : null;
	const isEditMode = !!editId;
	
	// Form states
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [timeLimitMin, setTimeLimitMin] = useState('');
	
	// Filter states
	const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
	const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
	const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
	const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
	
	// Data states
	const [streams, setStreams] = useState<Stream[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
	
	// Question counts for each category
	const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});
	const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
	const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
	const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
	const [subtopicCounts, setSubtopicCounts] = useState<Record<string, number>>({});
	
	// Selection states
	const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
	const [selectAllQuestions, setSelectAllQuestions] = useState(false);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	
	// Filter states for hierarchical filtering
	const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
	const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
	const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
	const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);
	
	// Collapsible filter sections state
	const [openFilterSection, setOpenFilterSection] = useState<string>('streams');

	useEffect(() => {
		loadData();
		loadAllQuestions(); // Load all questions to show counts for all categories
		
		// Load existing exam data if in edit mode
		if (isEditMode && editId) {
			loadExistingExam(editId);
		}
	}, [isEditMode, editId]);

	// Initialize filtered data when data is loaded
	useEffect(() => {
		setFilteredSubjects(subjects);
	}, [subjects]);

	useEffect(() => {
		setFilteredLessons(lessons);
	}, [lessons]);

	useEffect(() => {
		setFilteredTopics(topics);
	}, [topics]);

	useEffect(() => {
		setFilteredSubtopics(subtopics);
	}, [subtopics]);

	// Update filtered data when selections change
	useEffect(() => {
		// Filter subjects by selected streams
		if (selectedStreams.length > 0) {
			const filtered = subjects.filter(subject => 
				subject.stream && selectedStreams.includes(subject.stream.id)
			);
			setFilteredSubjects(filtered);
		} else {
			setFilteredSubjects(subjects);
		}
	}, [selectedStreams, subjects]);

	useEffect(() => {
		// Filter lessons by selected subjects
		if (selectedSubjects.length > 0) {
			const filtered = lessons.filter(lesson => 
				selectedSubjects.includes(lesson.subject.id)
			);
			setFilteredLessons(filtered);
		} else {
			setFilteredLessons(lessons);
		}
	}, [selectedSubjects, lessons]);

	useEffect(() => {
		// Filter topics by selected subjects
		if (selectedSubjects.length > 0) {
			const filtered = topics.filter(topic => 
				selectedSubjects.includes(topic.subject.id)
			);
			setFilteredTopics(filtered);
		} else {
			setFilteredTopics(topics);
		}
	}, [selectedSubjects, topics]);

	useEffect(() => {
		// Filter subtopics by selected topics
		if (selectedTopics.length > 0) {
			const filtered = subtopics.filter(subtopic => 
				selectedTopics.includes(subtopic.topic.id)
			);
			setFilteredSubtopics(filtered);
		} else {
			setFilteredSubtopics(subtopics);
		}
	}, [selectedTopics, subtopics]);

	// Load questions when filters change
	useEffect(() => {
		loadQuestions();
	}, [selectedSubjects, selectedLessons, selectedTopics, selectedSubtopics]);

	const loadData = async () => {
		try {
			const [streamsResponse, subjectsResponse, lessonsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get('/admin/streams'),
				api.get('/admin/subjects'),
				api.get('/admin/lessons?limit=1000'),
				api.get('/admin/topics?limit=1000'),
				api.get('/admin/subtopics?limit=1000')
			]);
			
			setStreams(streamsResponse.data || []);
			setSubjects(subjectsResponse.data || []);
			setLessons(lessonsResponse.data.lessons || lessonsResponse.data || []);
			setTopics(topicsResponse.data.topics || topicsResponse.data || []);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data || []);
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load data. Please refresh the page.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setLoading(false);
		}
	};

	const loadAllQuestions = async () => {
		try {
			const response = await api.get('/admin/questions?limit=1000');
			const questionsData = response.data.questions || response.data;
			calculateQuestionCounts(questionsData);
		} catch (error) {
			console.error('Error fetching all questions:', error);
			// Don't show error to user as this is for counts only
		}
	};

	const loadExistingExam = async (examId: string) => {
		try {
			const response = await api.get(`/admin/exam-papers/${examId}`);
			const examData = response.data;
			
			// Set form data
			setTitle(examData.title || '');
			setDescription(examData.description || '');
			setTimeLimitMin(examData.timeLimitMin?.toString() || '');
			
			// Set selected filters based on existing exam data
			if (examData.subjectIds && examData.subjectIds.length > 0) {
				setSelectedSubjects(examData.subjectIds);
			}
			if (examData.topicIds && examData.topicIds.length > 0) {
				setSelectedTopics(examData.topicIds);
			}
			if (examData.subtopicIds && examData.subtopicIds.length > 0) {
				setSelectedSubtopics(examData.subtopicIds);
			}
			
			// Set selected questions
			if (examData.questionIds && examData.questionIds.length > 0) {
				setSelectedQuestions(examData.questionIds);
				
				// Load the actual question data to display them
				// We'll fetch all questions and then filter to show the selected ones
				try {
					const questionsResponse = await api.get('/admin/questions?limit=1000');
					const allQuestions = questionsResponse.data.questions || questionsResponse.data;
					
					// Filter to only show the questions that are in the exam
					const examQuestions = allQuestions.filter((q: Question) => 
						examData.questionIds.includes(q.id)
					);
					
					setQuestions(examQuestions);
					setFilteredQuestions(examQuestions);
				} catch (questionError) {
					console.error('Error loading exam questions:', questionError);
					// Don't show error to user, just log it
				}
			}
			
		} catch (error) {
			console.error('Error loading existing exam:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load exam data. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const calculateQuestionCounts = (questionsData: Question[]) => {
		// Calculate counts for each category
		const newStreamCounts: Record<string, number> = {};
		const newSubjectCounts: Record<string, number> = {};
		const newLessonCounts: Record<string, number> = {};
		const newTopicCounts: Record<string, number> = {};
		const newSubtopicCounts: Record<string, number> = {};

		questionsData.forEach(question => {
			if (question.subject?.stream?.id) {
				const streamId = question.subject.stream.id;
				newStreamCounts[streamId] = (newStreamCounts[streamId] || 0) + 1;
			}
			if (question.subject?.id) {
				newSubjectCounts[question.subject.id] = (newSubjectCounts[question.subject.id] || 0) + 1;
			}
			if (question.lesson?.id) {
				newLessonCounts[question.lesson.id] = (newLessonCounts[question.lesson.id] || 0) + 1;
			}
			if (question.topic?.id) {
				newTopicCounts[question.topic.id] = (newTopicCounts[question.topic.id] || 0) + 1;
			}
			if (question.subtopic?.id) {
				newSubtopicCounts[question.subtopic.id] = (newSubtopicCounts[question.subtopic.id] || 0) + 1;
			}
		});


		setStreamCounts(newStreamCounts);
		setSubjectCounts(newSubjectCounts);
		setLessonCounts(newLessonCounts);
		setTopicCounts(newTopicCounts);
		setSubtopicCounts(newSubtopicCounts);
	};

	const loadQuestions = async () => {
		if (selectedSubjects.length === 0 && selectedLessons.length === 0 && selectedTopics.length === 0 && selectedSubtopics.length === 0) {
			// In edit mode, don't clear questions if we have selected questions
			if (isEditMode && selectedQuestions.length > 0) {
				// Keep the existing questions visible
				return;
			}
			setQuestions([]);
			setFilteredQuestions([]);
			// Don't reset counts - keep them visible for user reference
			return;
		}

		setLoadingQuestions(true);
		try {
			const params = new URLSearchParams();
			if (selectedSubjects.length > 0) params.append('subjectIds', selectedSubjects.join(','));
			if (selectedLessons.length > 0) params.append('lessonIds', selectedLessons.join(','));
			if (selectedTopics.length > 0) params.append('topicIds', selectedTopics.join(','));
			if (selectedSubtopics.length > 0) params.append('subtopicIds', selectedSubtopics.join(','));
			
			const response = await api.get(`/admin/questions?${params.toString()}&limit=1000`);
			const questionsData = response.data.questions || response.data;
			setQuestions(questionsData);
			setFilteredQuestions(questionsData);
			
			// Calculate question counts for each category
			calculateQuestionCounts(questionsData);
		} catch (error) {
			console.error('Error fetching questions:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load questions. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setLoadingQuestions(false);
		}
	};

	const handleStreamToggle = (streamId: string) => {
		setSelectedStreams(prev => 
			prev.includes(streamId) 
				? prev.filter(id => id !== streamId)
				: [...prev, streamId]
		);
		// Auto-open subjects section when stream is selected
		if (!selectedStreams.includes(streamId)) {
			setOpenFilterSection('subjects');
		}
	};

	const handleSubjectToggle = (subjectId: string) => {
		setSelectedSubjects(prev => 
			prev.includes(subjectId) 
				? prev.filter(id => id !== subjectId)
				: [...prev, subjectId]
		);
		// Auto-open lessons section when subject is selected
		if (!selectedSubjects.includes(subjectId)) {
			setOpenFilterSection('lessons');
		}
	};

	const handleLessonToggle = (lessonId: string) => {
		setSelectedLessons(prev => 
			prev.includes(lessonId) 
				? prev.filter(id => id !== lessonId)
				: [...prev, lessonId]
		);
		// Auto-open topics section when lesson is selected
		if (!selectedLessons.includes(lessonId)) {
			setOpenFilterSection('topics');
		}
	};

	const handleTopicToggle = (topicId: string) => {
		setSelectedTopics(prev => 
			prev.includes(topicId) 
				? prev.filter(id => id !== topicId)
				: [...prev, topicId]
		);
		// Auto-open subtopics section when topic is selected
		if (!selectedTopics.includes(topicId)) {
			setOpenFilterSection('subtopics');
		}
	};

	const handleSubtopicToggle = (subtopicId: string) => {
		setSelectedSubtopics(prev => 
			prev.includes(subtopicId) 
				? prev.filter(id => id !== subtopicId)
				: [...prev, subtopicId]
		);
	};

	const handleSelectAllStreams = () => {
		if (selectedStreams.length === streams.length) {
			setSelectedStreams([]);
		} else {
			setSelectedStreams(streams.map(s => s.id));
		}
	};

	const handleSelectAllSubjects = () => {
		const availableSubjects = filteredSubjects.map(s => s.id);
		if (selectedSubjects.length === availableSubjects.length) {
			setSelectedSubjects([]);
		} else {
			setSelectedSubjects(availableSubjects);
		}
	};

	const handleSelectAllLessons = () => {
		const availableLessons = filteredLessons.map(l => l.id);
		if (selectedLessons.length === availableLessons.length) {
			setSelectedLessons([]);
		} else {
			setSelectedLessons(availableLessons);
		}
	};

	const handleSelectAllTopics = () => {
		const availableTopics = filteredTopics.map(t => t.id);
		if (selectedTopics.length === availableTopics.length) {
			setSelectedTopics([]);
		} else {
			setSelectedTopics(availableTopics);
		}
	};

	const handleSelectAllSubtopics = () => {
		const availableSubtopics = filteredSubtopics.map(s => s.id);
		if (selectedSubtopics.length === availableSubtopics.length) {
			setSelectedSubtopics([]);
		} else {
			setSelectedSubtopics(availableSubtopics);
		}
	};

	const handleQuestionToggle = (questionId: string) => {
		setSelectedQuestions(prev => {
			if (prev.includes(questionId)) {
				const newSelection = prev.filter(id => id !== questionId);
				setSelectAllQuestions(false);
				return newSelection;
			} else {
				const newSelection = [...prev, questionId];
				setSelectAllQuestions(newSelection.length === filteredQuestions.length);
				return newSelection;
			}
		});
	};

	const handleSelectAllQuestions = () => {
		if (selectAllQuestions) {
			setSelectedQuestions([]);
			setSelectAllQuestions(false);
		} else {
			setSelectedQuestions(filteredQuestions.map(q => q.id));
			setSelectAllQuestions(true);
		}
	};

	const validateForm = () => {
		if (!title.trim()) {
			Swal.fire({
				title: 'Error!',
				text: 'Exam paper title is required.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return false;
		}

		if (selectedQuestions.length === 0) {
			Swal.fire({
				title: 'Error!',
				text: 'Please select at least one question for the exam.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return false;
		}

		if (timeLimitMin && (parseInt(timeLimitMin) < 1 || parseInt(timeLimitMin) > 480)) {
			Swal.fire({
				title: 'Error!',
				text: 'Time limit must be between 1 and 480 minutes.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		setSubmitting(true);
		try {
			const examData = {
				title: title.trim(),
				description: description.trim() || undefined,
				questionIds: selectedQuestions,
				timeLimitMin: timeLimitMin ? parseInt(timeLimitMin) : undefined
			};

			if (isEditMode && editId) {
				// Update existing exam
				await api.put(`/admin/exam-papers/${editId}`, examData);
				
				Swal.fire({
					title: 'Success!',
					text: `"${title.trim()}" has been updated successfully with ${selectedQuestions.length} questions.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				// Create new exam
				await api.post('/admin/exam-papers', examData);
				
				Swal.fire({
					title: 'Success!',
					text: `"${title.trim()}" has been created successfully with ${selectedQuestions.length} questions.`,
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});
			}
			
			router.push('/admin/exam-papers');
		} catch (error: any) {
			console.error(`Error ${isEditMode ? 'updating' : 'creating'} exam paper:`, error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} the exam paper. Please try again.`,
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = () => {
		router.push('/admin/exam-papers');
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<ProtectedRoute requiredRole="ADMIN">
			<AdminLayout>
				<MathRenderer />
				<div className="space-y-6">
					{/* Breadcrumbs */}
					<nav className="flex items-center space-x-2 text-sm text-gray-500">
						<button 
							onClick={() => router.push('/admin/dashboard')}
							className="hover:text-gray-700 transition-colors"
						>
							Dashboard
						</button>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<button 
							onClick={() => router.push('/admin/exam-papers')}
							className="hover:text-gray-700 transition-colors"
						>
							Exam Papers
						</button>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<span className="text-gray-900 font-medium">
							{isEditMode ? 'Edit Exam' : 'Create Exam'}
						</span>
					</nav>

					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{isEditMode ? 'Edit Enhanced Exam Paper' : 'Create Enhanced Exam Paper'}
							</h1>
							<p className="text-gray-600">
								{isEditMode ? 'Update your exam paper by modifying filters and questions' : 'Filter and select specific questions for your exam paper'}
							</p>
						</div>
						<button
							onClick={handleCancel}
							className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
						{/* Left Panel - Filters Only */}
						<div className="xl:col-span-1 space-y-6">
							{/* Content Filters */}
							<div className="bg-white rounded-lg shadow p-6">
								<h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Questions</h2>
								<p className="text-sm text-gray-600 mb-4">
									Select streams, subjects, lessons, topics, or subtopics to filter available questions.
								</p>
								

								{/* Streams */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => setOpenFilterSection(openFilterSection === 'streams' ? '' : 'streams')}
											className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
										>
											<span>Streams</span>
											<svg className={`w-4 h-4 transition-transform ${openFilterSection === 'streams' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openFilterSection === 'streams' && (
											<button
												onClick={handleSelectAllStreams}
												className="text-xs text-blue-600 hover:text-blue-800"
											>
												{selectedStreams.length === streams.length ? 'Deselect All' : 'Select All'}
											</button>
										)}
									</div>
									{openFilterSection === 'streams' && (
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{streams.length === 0 ? (
												<div className="text-sm text-gray-500 p-2">
													{loading ? 'Loading streams...' : 'No streams found'}
												</div>
											) : (
												streams.map((stream) => (
													<label key={stream.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
														<input
															type="checkbox"
															checked={selectedStreams.includes(stream.id)}
															onChange={() => handleStreamToggle(stream.id)}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<span className="text-sm text-gray-900">
															{stream.name}
															<span className="text-gray-500 ml-1">({streamCounts[stream.id] || 0})</span>
														</span>
													</label>
												))
											)}
										</div>
									)}
								</div>

								{/* Subjects */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => setOpenFilterSection(openFilterSection === 'subjects' ? '' : 'subjects')}
											className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
										>
											<span>Subjects {selectedStreams.length > 0 && `(Filtered)`}</span>
											<svg className={`w-4 h-4 transition-transform ${openFilterSection === 'subjects' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openFilterSection === 'subjects' && (
											<button
												onClick={handleSelectAllSubjects}
												className="text-xs text-blue-600 hover:text-blue-800"
											>
												{selectedSubjects.length === filteredSubjects.length ? 'Deselect All' : 'Select All'}
											</button>
										)}
									</div>
									{openFilterSection === 'subjects' && (
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{filteredSubjects.length === 0 ? (
												<div className="text-sm text-gray-500 p-2">
													{loading ? 'Loading subjects...' : 'No subjects found'}
												</div>
											) : (
												filteredSubjects.map((subject) => (
													<label key={subject.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
														<input
															type="checkbox"
															checked={selectedSubjects.includes(subject.id)}
															onChange={() => handleSubjectToggle(subject.id)}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<span className="text-sm text-gray-900">
															{subject.name}
															<span className="text-gray-500 ml-1">({subjectCounts[subject.id] || 0})</span>
														</span>
													</label>
												))
											)}
										</div>
									)}
								</div>

								{/* Lessons */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => setOpenFilterSection(openFilterSection === 'lessons' ? '' : 'lessons')}
											className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
										>
											<span>Lessons {selectedSubjects.length > 0 && `(Filtered)`}</span>
											<svg className={`w-4 h-4 transition-transform ${openFilterSection === 'lessons' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openFilterSection === 'lessons' && (
											<button
												onClick={handleSelectAllLessons}
												className="text-xs text-blue-600 hover:text-blue-800"
											>
												{selectedLessons.length === filteredLessons.length ? 'Deselect All' : 'Select All'}
											</button>
										)}
									</div>
									{openFilterSection === 'lessons' && (
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{filteredLessons.length === 0 ? (
												<div className="text-sm text-gray-500 p-2">
													{loading ? 'Loading lessons...' : 'No lessons found'}
												</div>
											) : (
												filteredLessons.map((lesson) => (
													<label key={lesson.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
														<input
															type="checkbox"
															checked={selectedLessons.includes(lesson.id)}
															onChange={() => handleLessonToggle(lesson.id)}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<div className="flex flex-col">
															<span className="text-sm text-gray-900">
																{lesson.name}
																<span className="text-gray-500 ml-1">({lessonCounts[lesson.id] || 0})</span>
															</span>
															<span className="text-xs text-gray-500">{lesson.subject.name}</span>
														</div>
													</label>
												))
											)}
										</div>
									)}
								</div>

								{/* Topics */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => setOpenFilterSection(openFilterSection === 'topics' ? '' : 'topics')}
											className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
										>
											<span>Topics {selectedSubjects.length > 0 && `(Filtered)`}</span>
											<svg className={`w-4 h-4 transition-transform ${openFilterSection === 'topics' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openFilterSection === 'topics' && (
											<button
												onClick={handleSelectAllTopics}
												className="text-xs text-blue-600 hover:text-blue-800"
											>
												{selectedTopics.length === filteredTopics.length ? 'Deselect All' : 'Select All'}
											</button>
										)}
									</div>
									{openFilterSection === 'topics' && (
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{filteredTopics.length === 0 ? (
												<div className="text-sm text-gray-500 p-2">
													{loading ? 'Loading topics...' : 'No topics found'}
												</div>
											) : (
												filteredTopics.map((topic) => (
													<label key={topic.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
														<input
															type="checkbox"
															checked={selectedTopics.includes(topic.id)}
															onChange={() => handleTopicToggle(topic.id)}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<div className="flex flex-col">
															<span className="text-sm text-gray-900">
																{topic.name}
																<span className="text-gray-500 ml-1">({topicCounts[topic.id] || 0})</span>
															</span>
															<span className="text-xs text-gray-500">{topic.subject.name}</span>
														</div>
													</label>
												))
											)}
										</div>
									)}
								</div>

								{/* Subtopics */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<button
											onClick={() => setOpenFilterSection(openFilterSection === 'subtopics' ? '' : 'subtopics')}
											className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
										>
											<span>Subtopics {selectedTopics.length > 0 && `(Filtered)`}</span>
											<svg className={`w-4 h-4 transition-transform ${openFilterSection === 'subtopics' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										{openFilterSection === 'subtopics' && (
											<button
												onClick={handleSelectAllSubtopics}
												className="text-xs text-blue-600 hover:text-blue-800"
											>
												{selectedSubtopics.length === filteredSubtopics.length ? 'Deselect All' : 'Select All'}
											</button>
										)}
									</div>
									{openFilterSection === 'subtopics' && (
										<div className="space-y-1 max-h-48 overflow-y-auto">
											{filteredSubtopics.length === 0 ? (
												<div className="text-sm text-gray-500 p-2">
													{loading ? 'Loading subtopics...' : 'No subtopics found'}
												</div>
											) : (
												filteredSubtopics.map((subtopic) => (
													<label key={subtopic.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
														<input
															type="checkbox"
															checked={selectedSubtopics.includes(subtopic.id)}
															onChange={() => handleSubtopicToggle(subtopic.id)}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<div className="flex flex-col">
															<span className="text-sm text-gray-900">
																{subtopic.name}
																<span className="text-gray-500 ml-1">({subtopicCounts[subtopic.id] || 0})</span>
															</span>
															<span className="text-xs text-gray-500">
																{subtopic.topic.name} • {subtopic.topic.subject.name}
															</span>
														</div>
													</label>
												))
											)}
										</div>
									)}
								</div>

								{/* Filter Summary */}
								<div className="bg-blue-50 rounded-lg p-3">
									<h4 className="text-sm font-medium text-blue-900 mb-2">Active Filters</h4>
									<div className="text-xs text-blue-800 space-y-1">
										<p>• {selectedStreams.length} stream{selectedStreams.length !== 1 ? 's' : ''}</p>
										<p>• {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}</p>
										<p>• {selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''}</p>
										<p>• {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''}</p>
										<p>• {selectedSubtopics.length} subtopic{selectedSubtopics.length !== 1 ? 's' : ''}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right Panel - Basic Info and Questions */}
						<div className="xl:col-span-3 space-y-6">
							{/* Basic Information */}
							<div className="bg-white rounded-lg shadow p-6">
								<h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-800 mb-2">Title *</label>
										<input 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="Enter exam paper title" 
											value={title} 
											onChange={e => setTitle(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-800 mb-2">Time Limit (minutes)</label>
										<input 
											type="number"
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="Optional time limit" 
											value={timeLimitMin} 
											onChange={e => setTimeLimitMin(e.target.value)}
										/>
									</div>
									<div className="md:col-span-1">
										<label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
										<textarea 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="Enter exam paper description" 
											rows={3}
											value={description} 
											onChange={e => setDescription(e.target.value)}
										/>
									</div>
								</div>
							</div>

							{/* Available Questions */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-lg font-semibold text-gray-900">Available Questions</h2>
											<p className="text-sm text-gray-600">
												{loadingQuestions ? 'Loading questions...' : `${filteredQuestions.length} questions found`}
											</p>
										</div>
										{filteredQuestions.length > 0 && (
											<div className="flex items-center space-x-3">
												<span className="text-sm text-gray-600">
													{selectedQuestions.length} of {filteredQuestions.length} selected
												</span>
												<button
													onClick={handleSelectAllQuestions}
													className="text-sm text-blue-600 hover:text-blue-800"
												>
													{selectAllQuestions ? 'Deselect All' : 'Select All'}
												</button>
											</div>
										)}
									</div>
								</div>

								{loadingQuestions ? (
									<div className="p-12 text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
										<p className="mt-4 text-gray-600">Loading questions...</p>
									</div>
								) : filteredQuestions.length === 0 ? (
									<div className="p-12 text-center">
										<div className="mx-auto h-12 w-12 text-gray-400">
											<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
										<p className="mt-1 text-sm text-gray-500">
											Select filters to see available questions.
										</p>
									</div>
								) : (
									<div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
										{filteredQuestions.map((question) => (
											<div key={question.id} className={`p-4 hover:bg-gray-50 transition-colors ${
												selectedQuestions.includes(question.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
											}`}>
												<div className="flex items-start space-x-3">
													<input
														type="checkbox"
														checked={selectedQuestions.includes(question.id)}
														onChange={() => handleQuestionToggle(question.id)}
														className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
													/>
													<div className="flex-1 min-w-0">
														{/* Question Stem with Math Rendering */}
														<div className="mb-3">
															<LatexContentDisplay content={question.stem} className="text-sm text-gray-900 leading-relaxed" />
														</div>
														
														{/* Question Options */}
														{question.options && question.options.length > 0 && (
															<div className="mb-3">
																<div className="text-xs font-medium text-gray-600 mb-2">Options:</div>
																<div className="space-y-1">
																	{question.options.map((option, index) => (
																		<div key={option.id} className={`flex items-center space-x-2 p-2 rounded text-xs ${
																			option.isCorrect 
																				? 'bg-green-50 border border-green-200' 
																				: 'bg-gray-50 border border-gray-200'
																		}`}>
																			<span className={`font-medium ${
																				option.isCorrect ? 'text-green-800' : 'text-gray-600'
																			}`}>
																				{String.fromCharCode(65 + index)}.
																			</span>
																			<div className="flex-1">
																				<LatexContentDisplay content={option.text} className="text-xs" />
																			</div>
																			{option.isCorrect && (
																				<span className="text-green-600 font-medium text-xs">✓ Correct</span>
																			)}
																		</div>
																	))}
																</div>
															</div>
														)}
														
														{/* Tags and Edit Button */}
														<div className="flex items-center justify-between">
															<div className="flex flex-wrap gap-2">
																{question.subject && (
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																		{question.subject.name}
																	</span>
																)}
																{question.lesson && (
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																		{question.lesson.name}
																	</span>
																)}
																{question.topic && (
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																		{question.topic.name}
																	</span>
																)}
																{question.subtopic && (
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
																		{question.subtopic.name}
																	</span>
																)}
															</div>
															<button
																onClick={() => window.open(`/admin/questions/edit/${question.id}`, '_blank')}
																className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
																title="Edit question in new tab"
															>
																<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																</svg>
																Edit
															</button>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex justify-between items-center">
							<div className="flex items-center space-x-4">
								{selectedQuestions.length > 0 && (
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<span className="text-sm font-medium text-gray-700">
											{selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
										</span>
									</div>
								)}
								{timeLimitMin && (
									<div className="flex items-center space-x-2">
										<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span className="text-sm text-gray-600">{timeLimitMin} minutes</span>
									</div>
								)}
							</div>
							<div className="flex space-x-3">
								<button
									onClick={handleCancel}
									className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									onClick={handleSubmit}
									disabled={submitting || !title.trim() || selectedQuestions.length === 0}
									className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
										submitting || !title.trim() || selectedQuestions.length === 0
											? 'bg-gray-400 cursor-not-allowed'
											: 'bg-blue-600 hover:bg-blue-700 shadow-sm'
									}`}
								>
									{submitting ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											{isEditMode ? 'Updating...' : 'Creating...'}
										</div>
									) : (
										`${isEditMode ? 'Update' : 'Create'} Exam (${selectedQuestions.length})`
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
}

export default function CreateEnhancedExamPage() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-2 text-gray-600">Loading...</p>
			</div>
		</div>}>
			<CreateEnhancedExamPageContent />
		</Suspense>
	);
}
