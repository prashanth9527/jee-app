'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';
import LatexContentDisplay from '@/components/LatexContentDisplay';
import MathRenderer from '@/components/MathRenderer';
import ViewQuestionModal from '@/components/admin/ViewQuestionModal';

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
}

interface Subtopic {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
		lesson?: {
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
}

export default function QuestionReviewPage() {
  const router = useRouter();
	const [questions, setQuestions] = useState<Question[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
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
	
	// Bulk selection states
	const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	
	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
		loadInitialData();
  }, []);

	useEffect(() => {
		refresh(currentPage);
	}, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, selectedDifficulty, currentPage]);

	const loadInitialData = async () => {
		try {
			const [subjectsRes, lessonsRes, topicsRes, subtopicsRes] = await Promise.all([
				api.get('/admin/subjects'),
				api.get('/admin/lessons'),
				api.get('/admin/topics'),
				api.get('/admin/subtopics')
			]);

			setSubjects(subjectsRes.data);
			setLessons(lessonsRes.data);
			setTopics(topicsRes.data);
			setSubtopics(subtopicsRes.data);
            } catch (error) {
			console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

	const refresh = async (page = 1) => {
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				reviewMode: 'true', // Enable review mode filtering
				...(searchText && { search: searchText }),
				...(selectedSubject && { subjectId: selectedSubject }),
				...(selectedLesson && { lessonId: selectedLesson }),
				...(selectedTopic && { topicId: selectedTopic }),
				...(selectedSubtopic && { subtopicId: selectedSubtopic }),
				...(selectedDifficulty && { difficulty: selectedDifficulty })
			});

			const response = await api.get(`/admin/questions?${params}`);
			setQuestions(response.data.questions);
			setTotalPages(response.data.pagination.totalPages);
			setTotalItems(response.data.pagination.totalItems);
			setCurrentPage(page);
		} catch (error) {
			console.error('Failed to load questions:', error);
			Swal.fire('Error', 'Failed to load questions', 'error');
		}
	};

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

	// Handle difficulty filter change
	const handleDifficultyChange = (difficulty: string) => {
		setSelectedDifficulty(difficulty);
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

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		if (checked) {
			setSelectedQuestions(questions.map(q => q.id));
			setSelectAll(true);
		} else {
			setSelectedQuestions([]);
			setSelectAll(false);
		}
	};

	const handleSelectQuestion = (questionId: string, checked: boolean) => {
		if (checked) {
			setSelectedQuestions(prev => [...prev, questionId]);
		} else {
			setSelectedQuestions(prev => prev.filter(id => id !== questionId));
			setSelectAll(false);
		}
	};

	const updateQuestionStatus = async (questionId: string, status: 'approved' | 'rejected') => {
		try {
			await api.put(`/admin/questions/${questionId}/status`, { status });
			Swal.fire('Success', `Question ${status} successfully`, 'success');
			refresh(currentPage);
		} catch (error) {
			console.error('Failed to update question status:', error);
			Swal.fire('Error', 'Failed to update question status', 'error');
		}
	};

	const bulkUpdateQuestionStatus = async (status: 'approved' | 'rejected') => {
		if (selectedQuestions.length === 0) {
			Swal.fire('Warning', 'Please select questions to update', 'warning');
			return;
		}

		try {
			await api.post('/admin/questions/bulk-update-status', {
				questionIds: selectedQuestions,
				status
			});
			Swal.fire('Success', `${selectedQuestions.length} questions ${status} successfully`, 'success');
			setSelectedQuestions([]);
			setSelectAll(false);
			refresh(currentPage);
		} catch (error) {
			console.error('Failed to bulk update question status:', error);
			Swal.fire('Error', 'Failed to update question status', 'error');
		}
	};

	const bulkDeleteQuestions = async () => {
		if (selectedQuestions.length === 0) {
			Swal.fire('Warning', 'Please select questions to delete', 'warning');
			return;
		}

		const result = await Swal.fire({
			title: 'Delete Questions',
			text: `Are you sure you want to delete ${selectedQuestions.length} questions? This action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#dc2626'
		});

		if (result.isConfirmed) {
			try {
				await api.post('/admin/questions/bulk-delete', {
					ids: selectedQuestions
				});
				Swal.fire('Success', `Deleted ${selectedQuestions.length} questions`, 'success');
				setSelectedQuestions([]);
				setSelectAll(false);
				refresh(currentPage);
			} catch (error) {
				console.error('Failed to delete questions:', error);
				Swal.fire('Error', 'Failed to delete questions', 'error');
			}
		}
	};

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
					icon: 'info',
					allowOutsideClick: false,
					showConfirmButton: false,
					didOpen: () => {
						Swal.showLoading();
					}
				});

				await api.post(`/admin/questions/${id}/generate-answer`);
				
				Swal.fire('Success', 'Answer generated successfully!', 'success');
				refresh(currentPage);
			} catch (error) {
				console.error('Failed to generate answer:', error);
				Swal.fire('Error', 'Failed to generate answer', 'error');
			}
		}
	};

	const openViewModal = (question: Question) => {
		setSelectedQuestion(question);
		setViewModalOpen(true);
	};

	const closeViewModal = () => {
		setViewModalOpen(false);
		setSelectedQuestion(null);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'EASY': return 'text-green-600 bg-green-100';
			case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
			case 'HARD': return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
			<MathRenderer />
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Review</h1>
						<p className="text-gray-600">Review and approve questions under review and open-ended questions with no answer</p>
          </div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-yellow-100 rounded-lg">
									<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
              </div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">Under Review</p>
									<p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
                </div>
              </div>
                </div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-purple-100 rounded-lg">
									<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
              </div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">Open-ended</p>
									<p className="text-2xl font-semibold text-gray-900">No Answer</p>
              </div>
            </div>
            </div>
            
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="p-2 bg-green-100 rounded-lg">
									<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600">Needs Review</p>
									<p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
								</div>
							</div>
						</div>
					</div>

					{/* Filters Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-8 gap-3">
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
										{subtopic.name} ({subtopic.topic?.lesson?.subject?.stream?.code || 'N/A'})
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedDifficulty}
								onChange={e => handleDifficultyChange(e.target.value)}
							>
								<option value="">All Difficulties</option>
								<option value="EASY">Easy</option>
								<option value="MEDIUM">Medium</option>
								<option value="HARD">Hard</option>
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
								<h2 className="text-lg font-semibold text-gray-900">Questions Needing Review ({totalItems})</h2>
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

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Select
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
									{questions.map((question) => (
										<tr key={question.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
												<input
													type="checkbox"
													checked={selectedQuestions.includes(question.id)}
													onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-900 max-w-md">
													<LatexContentDisplay 
														content={question.stem} 
														className="line-clamp-2"
													/>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{question.subject?.name || '-'}
													{question.subject?.stream && (
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ml-2">
															{question.subject.stream.code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{question.topic?.name || '-'}
													{question.subtopic?.name && (
														<span className="block text-xs text-gray-500">
															→ {question.subtopic.name}
                            </span>
													)}
                          </div>
                        </td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
													{question.difficulty}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{question.isOpenEnded ? (
													<div className="flex flex-col space-y-1">
														<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
															Open-ended
														</span>
														{!question.correctNumericAnswer && (
															<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
																No Answer
															</span>
														)}
													</div>
												) : (
													<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
														MCQ
													</span>
												)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<div className="flex space-x-2">
													<button
														onClick={() => openViewModal(question)}
														className="text-green-600 hover:text-green-900"
													>
														View
													</button>
													<button
														onClick={() => updateQuestionStatus(question.id, 'approved')}
														className="text-green-600 hover:text-green-900"
													>
														Approve
													</button>
													<button
														onClick={() => updateQuestionStatus(question.id, 'rejected')}
														className="text-red-600 hover:text-red-900"
													>
														Reject
													</button>
                          <button
														onClick={() => generateAnswer(question.id)}
														className="text-purple-600 hover:text-purple-900"
														title="Generate Answer with AI"
                          >
														💡
                          </button>
												</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="px-6 py-4 border-t border-gray-200">
								<div className="flex items-center justify-between">
									<div className="text-sm text-gray-700">
										Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
										{Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
										{totalItems} results
									</div>
									
									<div className="flex space-x-2">
										<button
											onClick={() => refresh(currentPage - 1)}
											disabled={currentPage === 1}
											className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
										>
											Previous
										</button>
										
										<span className="px-3 py-1 text-sm text-gray-700">
											Page {currentPage} of {totalPages}
										</span>
										
										<button
											onClick={() => refresh(currentPage + 1)}
											disabled={currentPage === totalPages}
											className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
			
			{/* View Question Modal */}
			<ViewQuestionModal
				question={selectedQuestion}
				isOpen={viewModalOpen}
				onClose={closeViewModal}
			/>
    </ProtectedRoute>
  );
}
