'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Question {
	id: string;
	stem: string;
	explanation?: string;
	difficulty: 'EASY' | 'MEDIUM' | 'HARD';
	yearAppeared?: number;
	isPreviousYear: boolean;
	subjectId?: string;
	topicId?: string;
	subtopicId?: string;
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

export default function QuestionsPage() {
	const router = useRouter();
	
	// Data states
	const [questions, setQuestions] = useState<Question[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	
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
	const [selectedTopic, setSelectedTopic] = useState('');
	const [selectedSubtopic, setSelectedSubtopic] = useState('');
	const [selectedDifficulty, setSelectedDifficulty] = useState('');
	
	// Form states
	const [stem, setStem] = useState('');
	const [explanation, setExplanation] = useState('');
	const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	const [yearAppeared, setYearAppeared] = useState('');
	const [isPreviousYear, setIsPreviousYear] = useState(false);
	const [subjectId, setSubjectId] = useState('');
	const [topicId, setTopicId] = useState('');
	const [subtopicId, setSubtopicId] = useState('');
	const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
		{ text: '', isCorrect: true },
		{ text: '', isCorrect: false },
		{ text: '', isCorrect: false },
		{ text: '', isCorrect: false }
	]);
	const [tagNames, setTagNames] = useState('');
	
	// Edit form states
	const [editStem, setEditStem] = useState('');
	const [editExplanation, setEditExplanation] = useState('');
	const [editDifficulty, setEditDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	const [editYearAppeared, setEditYearAppeared] = useState('');
	const [editIsPreviousYear, setEditIsPreviousYear] = useState(false);
	const [editSubjectId, setEditSubjectId] = useState('');
	const [editTopicId, setEditTopicId] = useState('');
	const [editSubtopicId, setEditSubtopicId] = useState('');
	const [editOptions, setEditOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
	const [editTagNames, setEditTagNames] = useState('');
	
	// Toggle states
	const [showAddForm, setShowAddForm] = useState(false);

	const refresh = async (page = 1) => {
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: itemsPerPage.toString(),
				...(searchText && { search: searchText }),
				...(selectedSubject && { subjectId: selectedSubject }),
				...(selectedTopic && { topicId: selectedTopic }),
				...(selectedSubtopic && { subtopicId: selectedSubtopic }),
				...(selectedDifficulty && { difficulty: selectedDifficulty })
			});

			const [questionsResponse, subjectsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get(`/admin/questions?${params}`),
				api.get('/admin/subjects'),
				api.get('/admin/topics'),
				api.get('/admin/subtopics')
			]);
			
			setQuestions(questionsResponse.data.questions || questionsResponse.data);
			setSubjects(subjectsResponse.data);
			setTopics(topicsResponse.data);
			setSubtopics(subtopicsResponse.data);
			
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
		setSelectedTopic('');
		setSelectedSubtopic('');
		setCurrentPage(1);
		refresh(1);
	};

	// Handle topic filter change
	const handleTopicChange = (topicId: string) => {
		setSelectedTopic(topicId);
		setSelectedSubtopic('');
		setCurrentPage(1);
		refresh(1);
	};

	// Handle subtopic filter change
	const handleSubtopicChange = (subtopicId: string) => {
		setSelectedSubtopic(subtopicId);
		setCurrentPage(1);
		refresh(1);
	};

	// Clear filters
	const clearFilters = () => {
		setSearchText('');
		setSelectedSubject('');
		setSelectedTopic('');
		setSelectedSubtopic('');
		setSelectedDifficulty('');
		setCurrentPage(1);
		refresh(1);
	};

	// Filter topics based on selected subject
	const filteredTopics = selectedSubject && Array.isArray(topics)
		? topics.filter(topic => topic.subject.id === selectedSubject)
		: Array.isArray(topics) ? topics : [];

	// Filter subtopics based on selected topic
	const filteredSubtopics = selectedTopic && Array.isArray(subtopics)
		? subtopics.filter(subtopic => subtopic.topic.id === selectedTopic)
		: Array.isArray(subtopics) ? subtopics : [];

	const add = async () => {
		if (!stem.trim() || !subjectId || options.some(opt => !opt.text.trim())) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields including question stem, subject, and all options.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}
		
		setAdding(true);
		try {
			const tagNamesArray = tagNames.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
			
			await api.post('/admin/questions', { 
				stem: stem.trim(),
				explanation: explanation.trim() || undefined,
				difficulty,
				yearAppeared: yearAppeared ? parseInt(yearAppeared) : undefined,
				isPreviousYear,
				subjectId,
				topicId: topicId || undefined,
				subtopicId: subtopicId || undefined,
				options,
				tagNames: tagNamesArray.length > 0 ? tagNamesArray : undefined
			});
			
			// Reset form
			setStem('');
			setExplanation('');
			setDifficulty('MEDIUM');
			setYearAppeared('');
			setIsPreviousYear(false);
			setSubjectId('');
			setTopicId('');
			setSubtopicId('');
			setOptions([
				{ text: '', isCorrect: true },
				{ text: '', isCorrect: false },
				{ text: '', isCorrect: false },
				{ text: '', isCorrect: false }
			]);
			setTagNames('');
			
			Swal.fire({
				title: 'Success!',
				text: 'Question has been added successfully.',
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
			console.error('Error adding question:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to add the question. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAdding(false);
		}
	};

	const startEdit = (question: Question) => {
		setEditing(question.id);
		setEditStem(question.stem);
		setEditExplanation(question.explanation || '');
		setEditDifficulty(question.difficulty);
		setEditYearAppeared(question.yearAppeared?.toString() || '');
		setEditIsPreviousYear(question.isPreviousYear);
		setEditSubjectId(question.subjectId || '');
		setEditTopicId(question.topicId || '');
		setEditSubtopicId(question.subtopicId || '');
		setEditOptions(question.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })));
		setEditTagNames(question.tags.map(t => t.tag.name).join(', '));
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditStem('');
		setEditExplanation('');
		setEditDifficulty('MEDIUM');
		setEditYearAppeared('');
		setEditIsPreviousYear(false);
		setEditSubjectId('');
		setEditTopicId('');
		setEditSubtopicId('');
		setEditOptions([]);
		setEditTagNames('');
	};

	const update = async (questionId: string) => {
		if (!editStem.trim() || !editSubjectId || editOptions.some(opt => !opt.text.trim())) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields including question stem, subject, and all options.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		try {
			const tagNamesArray = editTagNames.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
			
			await api.put(`/admin/questions/${questionId}`, { 
				stem: editStem.trim(),
				explanation: editExplanation.trim() || undefined,
				difficulty: editDifficulty,
				yearAppeared: editYearAppeared ? parseInt(editYearAppeared) : undefined,
				isPreviousYear: editIsPreviousYear,
				subjectId: editSubjectId,
				topicId: editTopicId || undefined,
				subtopicId: editSubtopicId || undefined,
				options: editOptions,
				tagNames: tagNamesArray.length > 0 ? tagNamesArray : undefined
			});
			
			Swal.fire({
				title: 'Success!',
				text: 'Question has been updated successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			cancelEdit();
			refresh(currentPage);
		} catch (error: any) {
			console.error('Error updating question:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update the question. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
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

	const exportCsv = () => {
		window.location.href = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001') + '/admin/questions/export';
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
								{totalItems} question{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
							</div>
						</div>
					</div>

					{/* Add New Question Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-900">Add New Question</h2>
						</div>
						
						{showAddForm && (
							<div className="space-y-6">
								{/* Basic Question Details */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Question Stem *</label>
										<textarea 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
											rows={4}
											placeholder="Enter the question text..." 
											value={stem} 
											onChange={e => setStem(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
										<textarea 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
											rows={4}
											placeholder="Enter explanation for the answer..." 
											value={explanation} 
											onChange={e => setExplanation(e.target.value)}
										/>
									</div>
								</div>

								{/* Question Metadata */}
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
										<select 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={subjectId}
											onChange={e => {
												setSubjectId(e.target.value);
												setTopicId('');
												setSubtopicId('');
											}}
										>
											<option value="">Select Subject</option>
											{Array.isArray(subjects) && subjects.map(subject => (
												<option key={subject.id} value={subject.id}>
													{subject.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
										<select 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={topicId}
											onChange={e => {
												setTopicId(e.target.value);
												setSubtopicId('');
											}}
											disabled={!subjectId}
										>
											<option value="">Select Topic</option>
											{Array.isArray(topics) && topics
												.filter(topic => topic.subject.id === subjectId)
												.map(topic => (
													<option key={topic.id} value={topic.id}>
														{topic.name}
													</option>
												))
											}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
										<select 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={subtopicId}
											onChange={e => setSubtopicId(e.target.value)}
											disabled={!topicId}
										>
											<option value="">Select Subtopic</option>
											{Array.isArray(subtopics) && subtopics
												.filter(subtopic => subtopic.topic.id === topicId)
												.map(subtopic => (
													<option key={subtopic.id} value={subtopic.id}>
														{subtopic.name}
													</option>
												))
											}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
										<select 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={difficulty}
											onChange={e => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
										>
											<option value="EASY">Easy</option>
											<option value="MEDIUM">Medium</option>
											<option value="HARD">Hard</option>
										</select>
									</div>
								</div>

								{/* Additional Metadata */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Year Appeared</label>
										<input 
											type="number"
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
											placeholder="e.g., 2023" 
											value={yearAppeared} 
											onChange={e => setYearAppeared(e.target.value)}
										/>
									</div>
									<div className="flex items-center">
										<label className="flex items-center">
											<input 
												type="checkbox"
												className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
												checked={isPreviousYear}
												onChange={e => setIsPreviousYear(e.target.checked)}
											/>
											<span className="ml-2 text-sm text-gray-700">Previous Year Question</span>
										</label>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
										<input 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
											placeholder="e.g., previous year, important, formula" 
											value={tagNames} 
											onChange={e => setTagNames(e.target.value)}
										/>
									</div>
								</div>

								{/* Options */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
									<div className="space-y-3">
										{options.map((option, index) => (
											<div key={index} className="flex items-center space-x-3">
												<input 
													type="radio"
													name="correctOption"
													checked={option.isCorrect}
													onChange={() => {
														const newOptions = options.map((opt, i) => ({
															...opt,
															isCorrect: i === index
														}));
														setOptions(newOptions);
													}}
													className="text-blue-600 focus:ring-blue-500"
												/>
												<input 
													className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
													placeholder={`Option ${index + 1}`} 
													value={option.text} 
													onChange={e => {
														const newOptions = [...options];
														newOptions[index] = { ...newOptions[index], text: e.target.value };
														setOptions(newOptions);
													}}
												/>
												{option.isCorrect && (
													<span className="text-green-600 text-sm font-medium">Correct Answer</span>
												)}
											</div>
										))}
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex space-x-3">
									<button 
										className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
											adding || !stem.trim() || !subjectId || options.some(opt => !opt.text.trim())
												? 'bg-gray-400 cursor-not-allowed' 
												: 'bg-blue-600 hover:bg-blue-700'
										}`}
										onClick={add}
										disabled={adding || !stem.trim() || !subjectId || options.some(opt => !opt.text.trim())}
									>
										{adding ? (
											<div className="flex items-center">
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
												Adding...
											</div>
										) : (
											'Add Question'
										)}
									</button>
									<button 
										className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
										onClick={() => {
											setStem('');
											setExplanation('');
											setDifficulty('MEDIUM');
											setYearAppeared('');
											setIsPreviousYear(false);
											setSubjectId('');
											setTopicId('');
											setSubtopicId('');
											setOptions([
												{ text: '', isCorrect: true },
												{ text: '', isCorrect: false },
												{ text: '', isCorrect: false },
												{ text: '', isCorrect: false }
											]);
											setTagNames('');
										}}
									>
										Clear Form
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Filters Section */}
					<div className="bg-white rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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
										{subject.name}
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedTopic}
								onChange={e => handleTopicChange(e.target.value)}
							>
								<option value="">All Topics</option>
								{Array.isArray(filteredTopics) && filteredTopics.map(topic => (
									<option key={topic.id} value={topic.id}>
										{topic.name}
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedSubtopic}
								onChange={e => handleSubtopicChange(e.target.value)}
							>
								<option value="">All Subtopics</option>
								{Array.isArray(filteredSubtopics) && filteredSubtopics.map(subtopic => (
									<option key={subtopic.id} value={subtopic.id}>
										{subtopic.name}
									</option>
								))}
							</select>
							<select 
								className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
								value={selectedDifficulty}
								onChange={e => {
									setSelectedDifficulty(e.target.value);
									setCurrentPage(1);
									refresh(1);
								}}
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
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">All Questions</h2>
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
										{editing === question.id ? (
											<div className="space-y-6">
												{/* Basic Question Details */}
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Question Stem *</label>
														<textarea 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
															rows={4}
															placeholder="Enter the question text..." 
															value={editStem} 
															onChange={e => setEditStem(e.target.value)}
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
														<textarea 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
															rows={4}
															placeholder="Enter explanation for the answer..." 
															value={editExplanation} 
															onChange={e => setEditExplanation(e.target.value)}
														/>
													</div>
												</div>

												{/* Question Metadata */}
												<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
														<select 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
															value={editSubjectId}
															onChange={e => {
																setEditSubjectId(e.target.value);
																setEditTopicId('');
																setEditSubtopicId('');
															}}
														>
															<option value="">Select Subject</option>
															{Array.isArray(subjects) && subjects.map(subject => (
																<option key={subject.id} value={subject.id}>
																	{subject.name}
																</option>
															))}
														</select>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
														<select 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
															value={editTopicId}
															onChange={e => {
																setEditTopicId(e.target.value);
																setEditSubtopicId('');
															}}
															disabled={!editSubjectId}
														>
															<option value="">Select Topic</option>
															{Array.isArray(topics) && topics
																.filter(topic => topic.subject.id === editSubjectId)
																.map(topic => (
																	<option key={topic.id} value={topic.id}>
																		{topic.name}
																	</option>
																))
															}
														</select>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
														<select 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
															value={editSubtopicId}
															onChange={e => setEditSubtopicId(e.target.value)}
															disabled={!editTopicId}
														>
															<option value="">Select Subtopic</option>
															{Array.isArray(subtopics) && subtopics
																.filter(subtopic => subtopic.topic.id === editTopicId)
																.map(subtopic => (
																	<option key={subtopic.id} value={subtopic.id}>
																		{subtopic.name}
																	</option>
																))
															}
														</select>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
														<select 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
															value={editDifficulty}
															onChange={e => setEditDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
														>
															<option value="EASY">Easy</option>
															<option value="MEDIUM">Medium</option>
															<option value="HARD">Hard</option>
														</select>
													</div>
												</div>

												{/* Additional Metadata */}
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Year Appeared</label>
														<input 
															type="number"
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
															placeholder="e.g., 2023" 
															value={editYearAppeared} 
															onChange={e => setEditYearAppeared(e.target.value)}
														/>
													</div>
													<div className="flex items-center">
														<label className="flex items-center">
															<input 
																type="checkbox"
																className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																checked={editIsPreviousYear}
																onChange={e => setEditIsPreviousYear(e.target.checked)}
															/>
															<span className="ml-2 text-sm text-gray-700">Previous Year Question</span>
														</label>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
														<input 
															className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
															placeholder="e.g., previous year, important, formula" 
															value={editTagNames} 
															onChange={e => setEditTagNames(e.target.value)}
														/>
													</div>
												</div>

												{/* Options */}
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
													<div className="space-y-3">
														{editOptions.map((option, index) => (
															<div key={index} className="flex items-center space-x-3">
																<input 
																	type="radio"
																	name="editCorrectOption"
																	checked={option.isCorrect}
																	onChange={() => {
																		const newOptions = editOptions.map((opt, i) => ({
																			...opt,
																			isCorrect: i === index
																		}));
																		setEditOptions(newOptions);
																	}}
																	className="text-blue-600 focus:ring-blue-500"
																/>
																<input 
																	className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
																	placeholder={`Option ${index + 1}`} 
																	value={option.text} 
																	onChange={e => {
																		const newOptions = [...editOptions];
																		newOptions[index] = { ...newOptions[index], text: e.target.value };
																		setEditOptions(newOptions);
																	}}
																/>
																{option.isCorrect && (
																	<span className="text-green-600 text-sm font-medium">Correct Answer</span>
																)}
															</div>
														))}
													</div>
												</div>

												{/* Action Buttons */}
												<div className="flex space-x-3">
													<button 
														className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
															!editStem.trim() || !editSubjectId || editOptions.some(opt => !opt.text.trim())
																? 'bg-gray-400 cursor-not-allowed' 
																: 'bg-green-600 hover:bg-green-700'
														}`}
														onClick={() => update(question.id)}
														disabled={!editStem.trim() || !editSubjectId || editOptions.some(opt => !opt.text.trim())}
													>
														Save Changes
													</button>
													<button 
														className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
														onClick={cancelEdit}
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											<div className="space-y-3">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3 className="text-lg font-medium text-gray-900 mb-2">{question.stem}</h3>
														{question.explanation && (
															<p className="text-sm text-gray-600 mb-2">{question.explanation}</p>
														)}
														<div className="flex flex-wrap gap-2 mb-3">
															{question.subject && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																	{question.subject.name}
																</span>
															)}
															{question.topic && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	{question.topic.name}
																</span>
															)}
															{question.subtopic && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																	{question.subtopic.name}
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
														</div>
														<div className="space-y-2">
															{question.options.map((option, index) => (
																<div key={option.id} className={`flex items-center space-x-2 p-2 rounded ${
																	option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
																}`}>
																	<span className="text-sm font-medium text-gray-600">{String.fromCharCode(65 + index)}.</span>
																	<span className={`text-sm ${option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
																		{option.text}
																	</span>
																	{option.isCorrect && (
																		<span className="text-green-600 text-xs font-medium">✓ Correct</span>
																	)}
																</div>
															))}
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
													<div className="flex space-x-2 ml-4">
														<button 
															onClick={() => startEdit(question)}
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
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														</button>
													</div>
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