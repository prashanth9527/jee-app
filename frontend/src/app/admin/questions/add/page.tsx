'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';

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
	lesson: {
		id: string;
		name: string;
	};
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
		lesson: {
			id: string;
			name: string;
		};
		subject: {
			id: string;
			name: string;
		};
	};
}

interface Tag {
	id: string;
	name: string;
}

export default function AddQuestionPage() {
	const router = useRouter();
	
	// Data states
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	
	// Form states
	const [stem, setStem] = useState('');
	const [explanation, setExplanation] = useState('');
	const [tipFormula, setTipFormula] = useState('');
	const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	const [yearAppeared, setYearAppeared] = useState('');
	const [isPreviousYear, setIsPreviousYear] = useState(false);
	const [subjectId, setSubjectId] = useState('');
	const [lessonId, setLessonId] = useState('');
	const [topicId, setTopicId] = useState('');
	const [subtopicId, setSubtopicId] = useState('');
	const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
		{ text: '', isCorrect: true },
		{ text: '', isCorrect: false },
		{ text: '', isCorrect: false },
		{ text: '', isCorrect: false }
	]);
	const [tagNames, setTagNames] = useState('');
	const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
	const [showTagSuggestions, setShowTagSuggestions] = useState(false);
	
	// New question type and marks system states
	const [questionType, setQuestionType] = useState<'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH'>('MCQ_SINGLE');
	const [allowPartialMarking, setAllowPartialMarking] = useState(false);
	const [fullMarks, setFullMarks] = useState('4.0');
	const [partialMarks, setPartialMarks] = useState('2.0');
	const [negativeMarks, setNegativeMarks] = useState('-2.0');
	
	// Paragraph question states
	const [subQuestions, setSubQuestions] = useState<{
		id: string;
		stem: string;
		explanation?: string;
		questionType: 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED';
		options: { text: string; isCorrect: boolean }[];
		correctNumericAnswer?: string;
		answerTolerance?: string;
		allowPartialMarking: boolean;
		fullMarks: string;
		partialMarks: string;
		negativeMarks: string;
	}[]>([]);
	
	// Sub-question toggle states
	const [expandedSubQuestions, setExpandedSubQuestions] = useState<Set<string>>(new Set());
	
	// Open-ended question states (legacy support)
	const [isOpenEnded, setIsOpenEnded] = useState(false);
	const [correctNumericAnswer, setCorrectNumericAnswer] = useState('');
	const [answerTolerance, setAnswerTolerance] = useState('0.01');
	
	// Form validation states
	const [errors, setErrors] = useState<{[key: string]: string}>({});
	const [formProgress, setFormProgress] = useState(0);
	
	// Auto-save states
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const loadData = async () => {
		try {
			const [subjectsResponse, tagsResponse] = await Promise.all([
				api.get('/admin/subjects'),
				api.get('/admin/tags?limit=1000')
			]);
			
			setSubjects(subjectsResponse.data);
			setAllTags(tagsResponse.data.tags || tagsResponse.data);
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load form data. Please refresh the page.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setLoading(false);
		}
	};

	// Load lessons when subject changes
	const loadLessons = async (subjectId: string) => {
		if (!subjectId) {
			setLessons([]);
			setTopics([]);
			setSubtopics([]);
			return;
		}
		
		try {
			const response = await api.get(`/admin/lessons?subjectId=${subjectId}&limit=1000`);
			setLessons(response.data.lessons || response.data);
		} catch (error) {
			console.error('Error fetching lessons:', error);
			setLessons([]);
		}
	};

	// Load topics when lesson changes
	const loadTopics = async (lessonId: string) => {
		if (!lessonId) {
			setTopics([]);
			setSubtopics([]);
			return;
		}
		
		try {
			const response = await api.get(`/admin/topics?lessonId=${lessonId}&limit=1000`);
			setTopics(response.data.topics || response.data);
		} catch (error) {
			console.error('Error fetching topics:', error);
			setTopics([]);
		}
	};

	// Load subtopics when topic changes
	const loadSubtopics = async (topicId: string) => {
		if (!topicId) {
			setSubtopics([]);
			return;
		}
		
		try {
			const response = await api.get(`/admin/subtopics?topicId=${topicId}&limit=1000`);
			setSubtopics(response.data.subtopics || response.data);
		} catch (error) {
			console.error('Error fetching subtopics:', error);
			setSubtopics([]);
		}
	};

	useEffect(() => { 
		loadData(); 
	}, []);

	// Auto-save functionality
	useEffect(() => {
		if (hasUnsavedChanges && !loading) {
			const timer = setTimeout(() => {
				saveDraft();
			}, 3000); // Auto-save after 3 seconds of inactivity

			return () => clearTimeout(timer);
		}
	}, [stem, explanation, tipFormula, difficulty, yearAppeared, isPreviousYear, subjectId, lessonId, topicId, subtopicId, options, tagNames, hasUnsavedChanges, loading]);

	// Calculate form progress
	useEffect(() => {
		let progress = 0;
		if (stem.trim()) progress += 25;
		if (subjectId) progress += 20;
		if (options.every(opt => opt.text.trim())) progress += 25;
		if (options.some(opt => opt.isCorrect)) progress += 15;
		if (difficulty) progress += 10;
		if (explanation.trim() || tipFormula.trim() || yearAppeared || tagNames.trim()) progress += 5;
		
		setFormProgress(Math.min(progress, 100));
	}, [stem, subjectId, options, difficulty, explanation, tipFormula, yearAppeared, tagNames]);

	// Validate form
	const validateForm = useCallback(() => {
		const newErrors: {[key: string]: string} = {};
		
		if (!stem.trim()) {
			newErrors.stem = 'Question stem is required';
		} else if (stem.trim().length < 10) {
			newErrors.stem = 'Question stem must be at least 10 characters';
		}
		
		if (!subjectId) {
			newErrors.subject = 'Subject is required';
		}
		
		// Validate based on question type
		if (questionType === 'PARAGRAPH') {
			// Validate paragraph questions
			if (subQuestions.length === 0) {
				newErrors.subQuestions = 'At least one sub-question is required for paragraph questions';
			}
			
			// Validate each sub-question
			subQuestions.forEach((subQ, index) => {
				if (!subQ.stem.trim()) {
					newErrors[`subQuestion_${index}_stem`] = `Sub-question ${index + 1} stem is required`;
				}
				
				if (subQ.questionType !== 'OPEN_ENDED') {
					if (subQ.options.some(opt => !opt.text.trim())) {
						newErrors[`subQuestion_${index}_options`] = `Sub-question ${index + 1} options must be filled`;
					}
					if (!subQ.options.some(opt => opt.isCorrect)) {
						newErrors[`subQuestion_${index}_correct`] = `Sub-question ${index + 1} must have a correct answer`;
					}
				} else {
					if (!subQ.correctNumericAnswer || String(subQ.correctNumericAnswer).trim() === '') {
						newErrors[`subQuestion_${index}_numeric`] = `Sub-question ${index + 1} numeric answer is required`;
					}
				}
			});
		} else if (questionType !== 'OPEN_ENDED') {
			// Validate MCQ questions (MCQ_SINGLE or MCQ_MULTIPLE)
			if (options.some(opt => !opt.text.trim())) {
				newErrors.options = 'All options must be filled';
			}
			
			if (!options.some(opt => opt.isCorrect)) {
				newErrors.correctAnswer = 'Please select a correct answer';
			}
		}
		
		if (yearAppeared && (parseInt(yearAppeared) < 1900 || parseInt(yearAppeared) > new Date().getFullYear())) {
			newErrors.yearAppeared = 'Year must be between 1900 and current year';
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [stem, subjectId, options, yearAppeared, questionType, subQuestions]);

	// Tag suggestions
	const handleTagInput = (value: string) => {
		setTagNames(value);
		setHasUnsavedChanges(true);
		
		const lastTag = value.split(',').pop()?.trim() || '';
		if (lastTag.length > 0) {
			const suggestions = allTags
				.map(tag => tag.name)
				.filter(tag => tag.toLowerCase().includes(lastTag.toLowerCase()))
				.slice(0, 5);
			setTagSuggestions(suggestions);
			setShowTagSuggestions(suggestions.length > 0);
		} else {
			setShowTagSuggestions(false);
		}
	};

	const addTag = (tag: string) => {
		const tags = tagNames.split(',').map(t => t.trim()).filter(t => t.length > 0);
		if (!tags.includes(tag)) {
			tags.push(tag);
			setTagNames(tags.join(', '));
		}
		setShowTagSuggestions(false);
		setHasUnsavedChanges(true);
	};

	// Option management
	const addOption = () => {
		if (options.length < 6) {
			setOptions([...options, { text: '', isCorrect: false }]);
			setHasUnsavedChanges(true);
		}
	};

	const removeOption = (index: number) => {
		if (options.length > 2) {
			const newOptions = options.filter((_, i) => i !== index);
			// Ensure at least one option is marked as correct
			if (!newOptions.some(opt => opt.isCorrect)) {
				newOptions[0].isCorrect = true;
			}
			setOptions(newOptions);
			setHasUnsavedChanges(true);
		}
	};

	const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
		const newOptions = [...options];
		if (field === 'isCorrect') {
			if (questionType === 'MCQ_MULTIPLE') {
				// For multiple choice, allow multiple correct answers
				newOptions[index].isCorrect = value as boolean;
			} else {
				// For single choice, uncheck others when setting this one as correct
				newOptions.forEach((opt, i) => {
					opt.isCorrect = i === index;
				});
			}
		} else {
			newOptions[index][field] = value as string;
		}
		setOptions(newOptions);
		setHasUnsavedChanges(true);
	};

	// Sub-question management functions
	const addSubQuestion = () => {
		const newSubQuestion = {
			id: `sub_${Date.now()}`,
			stem: '',
			explanation: '',
			questionType: 'MCQ_SINGLE' as 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED',
			options: [
				{ text: '', isCorrect: true },
				{ text: '', isCorrect: false },
				{ text: '', isCorrect: false },
				{ text: '', isCorrect: false }
			],
			correctNumericAnswer: '',
			answerTolerance: '0.01',
			allowPartialMarking: false,
			fullMarks: '4.0',
			partialMarks: '2.0',
			negativeMarks: '-2.0'
		};
		setSubQuestions([...subQuestions, newSubQuestion]);
		
		// Expand the new sub-question
		const newExpanded = new Set(expandedSubQuestions);
		newExpanded.add(newSubQuestion.id);
		setExpandedSubQuestions(newExpanded);
		
		setHasUnsavedChanges(true);
	};

	const removeSubQuestion = (id: string) => {
		setSubQuestions(subQuestions.filter(sq => sq.id !== id));
		
		// Remove from expanded state
		const newExpanded = new Set(expandedSubQuestions);
		newExpanded.delete(id);
		setExpandedSubQuestions(newExpanded);
		
		setHasUnsavedChanges(true);
	};

	const updateSubQuestion = (id: string, field: string, value: any) => {
		setSubQuestions(subQuestions.map(sq => 
			sq.id === id ? { ...sq, [field]: value } : sq
		));
		setHasUnsavedChanges(true);
	};

	const updateSubQuestionOption = (subQuestionId: string, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
		setSubQuestions(subQuestions.map(sq => {
			if (sq.id === subQuestionId) {
				const newOptions = [...sq.options];
				if (field === 'isCorrect') {
					if (sq.questionType === 'MCQ_MULTIPLE') {
						newOptions[optionIndex].isCorrect = value as boolean;
					} else {
						newOptions.forEach((opt, i) => {
							opt.isCorrect = i === optionIndex;
						});
					}
				} else {
					newOptions[optionIndex][field] = value as string;
				}
				return { ...sq, options: newOptions };
			}
			return sq;
		}));
		setHasUnsavedChanges(true);
	};

	// Sub-question toggle functions
	const toggleSubQuestion = (subQuestionId: string) => {
		const newExpanded = new Set(expandedSubQuestions);
		if (newExpanded.has(subQuestionId)) {
			newExpanded.delete(subQuestionId);
		} else {
			newExpanded.add(subQuestionId);
		}
		setExpandedSubQuestions(newExpanded);
	};

	const expandAllSubQuestions = () => {
		const allIds = new Set(subQuestions.map(sq => sq.id));
		setExpandedSubQuestions(allIds);
	};

	const collapseAllSubQuestions = () => {
		setExpandedSubQuestions(new Set());
	};

	// Auto-save draft
	const saveDraft = () => {
		const draft = {
			stem,
			explanation,
			tipFormula,
			difficulty,
			yearAppeared,
			isPreviousYear,
			subjectId,
			lessonId,
			topicId,
			subtopicId,
			options,
			tagNames,
			timestamp: new Date().toISOString()
		};
		localStorage.setItem('questionDraft', JSON.stringify(draft));
		setLastSaved(new Date());
		setHasUnsavedChanges(false);
	};

	// Load draft
	const loadDraft = () => {
		const draft = localStorage.getItem('questionDraft');
		if (draft) {
			try {
				const parsed = JSON.parse(draft);
				setStem(parsed.stem || '');
				setExplanation(parsed.explanation || '');
				setTipFormula(parsed.tipFormula || '');
				setDifficulty(parsed.difficulty || 'MEDIUM');
				setYearAppeared(parsed.yearAppeared || '');
				setIsPreviousYear(parsed.isPreviousYear || false);
				setSubjectId(parsed.subjectId || '');
				setLessonId(parsed.lessonId || '');
				setTopicId(parsed.topicId || '');
				setSubtopicId(parsed.subtopicId || '');
				setOptions(parsed.options || [
					{ text: '', isCorrect: true },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false }
				]);
				setTagNames(parsed.tagNames || '');
				setHasUnsavedChanges(false);
				
				Swal.fire({
					title: 'Draft Loaded!',
					text: 'Your previous draft has been restored.',
					icon: 'info',
					timer: 2000,
					showConfirmButton: false
				});
			} catch (error) {
				console.error('Error loading draft:', error);
			}
		}
	};

	const add = async () => {
		if (!validateForm()) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fix the errors in the form before submitting.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}
		
		setAdding(true);
		try {
			const tagNamesArray = tagNames.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
			
			// Handle paragraph questions differently
			if (questionType === 'PARAGRAPH') {
				await api.post('/admin/questions/paragraph', {
					stem: stem.trim(),
					explanation: explanation.trim() || undefined,
					tip_formula: tipFormula.trim() || undefined,
					difficulty,
					yearAppeared: yearAppeared ? parseInt(yearAppeared) : undefined,
					isPreviousYear,
					subjectId,
					lessonId: lessonId || undefined,
					topicId: topicId || undefined,
					subtopicId: subtopicId || undefined,
					tagNames: tagNamesArray.length > 0 ? tagNamesArray : undefined,
					subQuestions: subQuestions.map(sq => ({
						stem: sq.stem,
						explanation: sq.explanation,
						questionType: sq.questionType,
						options: sq.questionType !== 'OPEN_ENDED' ? sq.options : undefined,
						correctNumericAnswer: sq.questionType === 'OPEN_ENDED' ? parseFloat(sq.correctNumericAnswer || '0') : undefined,
						answerTolerance: sq.questionType === 'OPEN_ENDED' ? parseFloat(sq.answerTolerance || '0.01') : undefined,
						allowPartialMarking: sq.allowPartialMarking,
						fullMarks: parseFloat(sq.fullMarks),
						partialMarks: parseFloat(sq.partialMarks),
						negativeMarks: parseFloat(sq.negativeMarks)
					}))
				});
			} else {
				await api.post('/admin/questions', { 
					stem: stem.trim(),
					explanation: explanation.trim() || undefined,
					tip_formula: tipFormula.trim() || undefined,
					difficulty,
					yearAppeared: yearAppeared ? parseInt(yearAppeared) : undefined,
					isPreviousYear,
					subjectId,
					lessonId: lessonId || undefined,
					topicId: topicId || undefined,
					subtopicId: subtopicId || undefined,
					options,
					tagNames: tagNamesArray.length > 0 ? tagNamesArray : undefined,
					// New question type and marks system
					questionType,
					allowPartialMarking,
					fullMarks: parseFloat(fullMarks),
					partialMarks: parseFloat(partialMarks),
					negativeMarks: parseFloat(negativeMarks),
					// Open-ended question fields (legacy support)
					isOpenEnded,
					correctNumericAnswer: correctNumericAnswer ? parseFloat(correctNumericAnswer) : undefined,
					answerTolerance: parseFloat(answerTolerance)
				});
			}
			
			// Clear draft after successful save
			localStorage.removeItem('questionDraft');
			
			Swal.fire({
				title: 'Success!',
				text: 'Question has been added successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			setTimeout(() => {
				router.push('/admin/questions');
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

	const clearForm = () => {
		Swal.fire({
			title: 'Clear Form?',
			text: 'This will clear all form data. Are you sure?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, clear it',
			cancelButtonText: 'Cancel'
		}).then((result) => {
			if (result.isConfirmed) {
				setStem('');
				setExplanation('');
				setTipFormula('');
				setDifficulty('MEDIUM');
				setYearAppeared('');
				setIsPreviousYear(false);
				setSubjectId('');
				setLessonId('');
				setTopicId('');
				setSubtopicId('');
				setOptions([
					{ text: '', isCorrect: true },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false },
					{ text: '', isCorrect: false }
				]);
				setTagNames('');
				setErrors({});
				setHasUnsavedChanges(false);
				localStorage.removeItem('questionDraft');
			}
		});
	};

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case 's':
						e.preventDefault();
						if (!adding) add();
						break;
					case 'Enter':
						e.preventDefault();
						if (e.shiftKey) add();
						break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [adding]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading form data...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Add New Question</h1>
							<p className="text-gray-600">Create a new JEE question with comprehensive details</p>
						</div>
						<div className="flex items-center space-x-4">
							{hasUnsavedChanges && (
								<div className="text-sm text-orange-600 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									Unsaved changes
								</div>
							)}
							{lastSaved && (
								<div className="text-sm text-green-600">
									Last saved: {lastSaved.toLocaleTimeString()}
								</div>
							)}
							<button 
								onClick={() => router.push('/admin/questions')}
								className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
								</svg>
								Back to Questions
							</button>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="bg-white rounded-lg shadow p-4">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-gray-700">Form Progress</span>
							<span className="text-sm text-gray-500">{formProgress}%</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div 
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${formProgress}%` }}
							></div>
						</div>
					</div>

					{/* Question Form */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="space-y-6">
							{/* Basic Question Details */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Question Stem * 
										<span className="text-xs text-gray-500 ml-2">({stem.length}/1000)</span>
									</label>
									<div className={`${errors.stem ? 'border border-red-300 rounded-md' : ''}`}>
										<LatexRichTextEditor
											value={stem}
											onChange={(content) => {
												setStem(content);
												setHasUnsavedChanges(true);
												if (errors.stem) {
													setErrors(prev => ({ ...prev, stem: '' }));
												}
											}}
											placeholder="Enter the question text... (Supports LaTeX math equations with immediate preview)"
											height={200}
										/>
									</div>
									{errors.stem && (
										<p className="mt-1 text-sm text-red-600">{errors.stem}</p>
									)}
									<div className="mt-2 text-xs text-gray-500">
										💡 Tip: Use the toolbar for formatting and LaTeX math equations. Toggle preview mode to see rendered equations
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Explanation (Optional)
										<span className="text-xs text-gray-500 ml-2">({explanation.length}/500)</span>
									</label>
									<LatexRichTextEditor
										value={explanation}
										onChange={(content) => {
											setExplanation(content);
											setHasUnsavedChanges(true);
										}}
										placeholder="Enter detailed explanation for the answer... (Supports LaTeX math equations with immediate preview)"
										height={200}
									/>
								</div>
							</div>

							{/* Tips and Formulas */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Tips & Formulas (Optional)
									<span className="text-xs text-gray-500 ml-2">({tipFormula.length}/300)</span>
								</label>
								<LatexRichTextEditor
									value={tipFormula}
									onChange={(content) => {
										setTipFormula(content);
										setHasUnsavedChanges(true);
									}}
									placeholder="Enter helpful tips, formulas, or hints to solve this question... (Supports LaTeX math equations with immediate preview)"
									height={150}
								/>
								<div className="mt-2 text-xs text-gray-500">
									💡 Tip: Include key formulas, concepts, or solving strategies. Use LaTeX syntax for mathematical expressions
								</div>
							</div>

							{/* Question Metadata */}
							<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
									<select 
										className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium ${
											errors.subject ? 'border-red-300' : 'border-gray-300'
										}`}
										value={subjectId}
										onChange={e => {
											const newSubjectId = e.target.value;
											setSubjectId(newSubjectId);
											setLessonId('');
											setTopicId('');
											setSubtopicId('');
											setHasUnsavedChanges(true);
											if (errors.subject) {
												setErrors(prev => ({ ...prev, subject: '' }));
											}
											// Load lessons for the selected subject
											loadLessons(newSubjectId);
										}}
									>
										<option value="">Select Subject</option>
										{Array.isArray(subjects) && subjects.map(subject => (
											<option key={subject.id} value={subject.id}>
												{subject.name} {subject.stream ? `(${subject.stream.name})` : ''}
											</option>
										))}
									</select>
									{errors.subject && (
										<p className="mt-1 text-sm text-red-600">{errors.subject}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Lesson</label>
									<select 
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
										value={lessonId}
										onChange={e => {
											const newLessonId = e.target.value;
											setLessonId(newLessonId);
											setTopicId('');
											setSubtopicId('');
											setHasUnsavedChanges(true);
											// Load topics for the selected lesson
											loadTopics(newLessonId);
										}}
										disabled={!subjectId}
									>
										<option value="">Select Lesson</option>
										{Array.isArray(lessons) && lessons
											.filter(lesson => lesson.subject?.id === subjectId)
											.map(lesson => (
												<option key={lesson.id} value={lesson.id}>
													{lesson.name}
												</option>
											))
										}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
									<select 
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
										value={topicId}
										onChange={e => {
											const newTopicId = e.target.value;
											setTopicId(newTopicId);
											setSubtopicId('');
											setHasUnsavedChanges(true);
											// Load subtopics for the selected topic
											loadSubtopics(newTopicId);
										}}
										disabled={!lessonId}
									>
										<option value="">Select Topic</option>
										{Array.isArray(topics) && topics
											.filter(topic => topic.lesson?.id === lessonId)
											.map(topic => (
												<option key={topic.id} value={topic.id}>
													{topic.name} {topic.lesson ? `(${topic.lesson.name})` : ''}
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
										onChange={e => {
											setSubtopicId(e.target.value);
											setHasUnsavedChanges(true);
										}}
										disabled={!topicId}
									>
										<option value="">Select Subtopic</option>
										{Array.isArray(subtopics) && subtopics
											.filter(subtopic => subtopic.topic?.id === topicId)
											.map(subtopic => (
												<option key={subtopic.id} value={subtopic.id}>
													{subtopic.name} {subtopic.topic ? `(${subtopic.topic.name})` : ''}
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
										onChange={e => {
											setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD');
											setHasUnsavedChanges(true);
										}}
									>
										<option value="EASY">Easy</option>
										<option value="MEDIUM">Medium</option>
										<option value="HARD">Hard</option>
									</select>
								</div>
							</div>

							{/* Question Type and Marks System */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Question Type & Marks System</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
										<select 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={questionType}
											onChange={e => {
												setQuestionType(e.target.value as 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH');
												setHasUnsavedChanges(true);
												// Auto-set isOpenEnded for backward compatibility
												setIsOpenEnded(e.target.value === 'OPEN_ENDED');
											}}
										>
											<option value="MCQ_SINGLE">MCQ Single (One correct answer)</option>
											<option value="MCQ_MULTIPLE">MCQ Multiple (Multiple correct answers)</option>
											<option value="OPEN_ENDED">Open Ended (Numeric answer)</option>
											<option value="PARAGRAPH">Paragraph (Comprehension)</option>
										</select>
										<div className="mt-1 text-xs text-gray-500">
											{questionType === 'MCQ_SINGLE' && 'Traditional MCQ with one correct answer'}
											{questionType === 'MCQ_MULTIPLE' && 'MCQ with multiple correct answers - partial marking supported'}
											{questionType === 'OPEN_ENDED' && 'Numeric answer question with tolerance'}
											{questionType === 'PARAGRAPH' && 'Paragraph-based question with sub-questions'}
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Full Marks</label>
										<input 
											type="number" 
											step="0.1"
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
											value={fullMarks}
											onChange={e => {
												setFullMarks(e.target.value);
												setHasUnsavedChanges(true);
											}}
											placeholder="4.0"
										/>
									</div>
								</div>
								
								{questionType === 'MCQ_MULTIPLE' && (
									<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Partial Marks</label>
											<input 
												type="number" 
												step="0.1"
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
												value={partialMarks}
												onChange={e => {
													setPartialMarks(e.target.value);
													setHasUnsavedChanges(true);
												}}
												placeholder="2.0"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Negative Marks</label>
											<input 
												type="number" 
												step="0.1"
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
												value={negativeMarks}
												onChange={e => {
													setNegativeMarks(e.target.value);
													setHasUnsavedChanges(true);
												}}
												placeholder="-2.0"
											/>
										</div>
										<div className="flex items-center">
											<label className="flex items-center">
												<input 
													type="checkbox" 
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
													checked={allowPartialMarking}
													onChange={e => {
														setAllowPartialMarking(e.target.checked);
														setHasUnsavedChanges(true);
													}}
												/>
												<span className="ml-2 text-sm text-gray-700">Allow Partial Marking</span>
											</label>
										</div>
									</div>
								)}
								
								{questionType === 'OPEN_ENDED' && (
									<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Correct Numeric Answer</label>
											<input 
												type="number" 
												step="0.01"
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
												value={correctNumericAnswer}
												onChange={e => {
													setCorrectNumericAnswer(e.target.value);
													setHasUnsavedChanges(true);
												}}
												placeholder="Enter the correct numeric answer"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Answer Tolerance</label>
											<input 
												type="number" 
												step="0.01"
												className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
												value={answerTolerance}
												onChange={e => {
													setAnswerTolerance(e.target.value);
													setHasUnsavedChanges(true);
												}}
												placeholder="0.01"
											/>
										</div>
									</div>
								)}
							</div>

							{/* Sub-Questions for Paragraph Questions */}
							{questionType === 'PARAGRAPH' && (
								<div className="bg-pink-50 rounded-lg p-4">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold text-pink-900">Sub-Questions</h3>
										<div className="flex items-center space-x-2">
											{subQuestions.length > 0 && (
												<>
													<button
														type="button"
														onClick={expandAllSubQuestions}
														className="px-3 py-1 text-sm bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
													>
														Expand All
													</button>
													<button
														type="button"
														onClick={collapseAllSubQuestions}
														className="px-3 py-1 text-sm bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
													>
														Collapse All
													</button>
												</>
											)}
											<button
												type="button"
												onClick={addSubQuestion}
												className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center"
											>
												<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
												</svg>
												Add Sub-Question
											</button>
										</div>
									</div>
									
									{subQuestions.length === 0 ? (
										<div className="text-center py-8 text-pink-600">
											<svg className="w-12 h-12 mx-auto mb-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<p className="text-sm">No sub-questions added yet</p>
											<p className="text-xs text-pink-500 mt-1">Add sub-questions to create a complete paragraph question</p>
										</div>
									) : (
										<div className="space-y-4">
											{subQuestions.map((subQ, index) => {
												const isExpanded = expandedSubQuestions.has(subQ.id);
												return (
													<div key={subQ.id} className="bg-white border border-pink-200 rounded-lg overflow-hidden">
														<div className="flex items-center justify-between p-4 bg-pink-100 hover:bg-pink-200 transition-colors cursor-pointer"
															 onClick={() => toggleSubQuestion(subQ.id)}>
															<div className="flex items-center space-x-3">
																<svg 
																	className={`w-5 h-5 text-pink-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
																	fill="none" 
																	stroke="currentColor" 
																	viewBox="0 0 24 24"
																>
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
																</svg>
																<h4 className="text-md font-medium text-pink-900">
																	Sub-Question {index + 1}
																</h4>
																{subQ.stem && (
																	<span className="text-sm text-pink-600 truncate max-w-xs">
																		{subQ.stem.replace(/<[^>]*>/g, '').substring(0, 50)}...
																	</span>
																)}
															</div>
															<div className="flex items-center space-x-2">
																<span className="text-xs text-pink-500 bg-pink-200 px-2 py-1 rounded">
																	{subQ.questionType.replace('_', ' ')}
																</span>
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		removeSubQuestion(subQ.id);
																	}}
																	className="p-1 text-red-600 hover:text-red-800"
																	title="Remove sub-question"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																	</svg>
																</button>
															</div>
														</div>
														
														{isExpanded && (
															<div className="p-4 border-t border-pink-200">
																<div className="space-y-4">
																	{/* Sub-question stem */}
																	<div>
																		<label className="block text-sm font-medium text-gray-700 mb-2">
																			Question Stem *
																		</label>
																		<LatexRichTextEditor
																			value={subQ.stem}
																			onChange={(content) => updateSubQuestion(subQ.id, 'stem', content)}
																			placeholder="Enter the sub-question text..."
																			height={150}
																		/>
																	</div>
																	
																		{/* Sub-question type */}
																		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																			<div>
																				<label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
																<select 
																	className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-base font-medium"
																	value={subQ.questionType}
																	onChange={e => updateSubQuestion(subQ.id, 'questionType', e.target.value)}
																>
																	<option value="MCQ_SINGLE">MCQ Single</option>
																	<option value="MCQ_MULTIPLE">MCQ Multiple</option>
																	<option value="OPEN_ENDED">Open Ended</option>
																			</select>
																			</div>
																			<div>
																				<label className="block text-sm font-medium text-gray-700 mb-2">Full Marks</label>
																<input 
																	type="number" 
																	step="0.1"
																	className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-base font-medium"
																	value={subQ.fullMarks}
																	onChange={e => updateSubQuestion(subQ.id, 'fullMarks', e.target.value)}
																			/>
																			</div>
																		</div>
																		
																						{/* Sub-question options for MCQ */}
																		{subQ.questionType !== 'OPEN_ENDED' && (
																			<div>
																<label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
																<div className="space-y-3">
																	{subQ.options.map((option, optIndex) => (
																		<div key={optIndex} className="flex items-center space-x-3">
																			<input 
																				type={subQ.questionType === 'MCQ_MULTIPLE' ? 'checkbox' : 'radio'}
																				name={`sub_${subQ.id}_option`}
																				checked={option.isCorrect}
																				onChange={() => updateSubQuestionOption(subQ.id, optIndex, 'isCorrect', !option.isCorrect)}
																				className="text-pink-600 focus:ring-pink-500"
																			/>
																			<div className="flex-1">
																				<LatexRichTextEditor
																					value={option.text}
																					onChange={(content) => updateSubQuestionOption(subQ.id, optIndex, 'text', content)}
																					placeholder={`Option ${optIndex + 1}...`}
																					height={100}
																				/>
																			</div>
																		</div>
																	))}
																				</div>
																			</div>
																		)}
																		
																		{/* Sub-question numeric answer for open-ended */}
																		{subQ.questionType === 'OPEN_ENDED' && (
																			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																				<div>
																					<label className="block text-sm font-medium text-gray-700 mb-2">Correct Numeric Answer</label>
																					<input 
																						type="number" 
																						step="0.01"
																						className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-base font-medium"
																						value={subQ.correctNumericAnswer}
																						onChange={e => updateSubQuestion(subQ.id, 'correctNumericAnswer', e.target.value)}
																						placeholder="Enter correct answer"
																					/>
																				</div>
																				<div>
																					<label className="block text-sm font-medium text-gray-700 mb-2">Answer Tolerance</label>
																					<input 
																						type="number" 
																						step="0.01"
																						className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-base font-medium"
																						value={subQ.answerTolerance}
																						onChange={e => updateSubQuestion(subQ.id, 'answerTolerance', e.target.value)}
																						placeholder="0.01"
																					/>
																				</div>
																			</div>
																		)}
																	</div>
																</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							)}

							{/* Additional Metadata */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Year Appeared</label>
									<input 
										type="number"
										className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium ${
											errors.yearAppeared ? 'border-red-300' : 'border-gray-300'
										}`}
										placeholder="e.g., 2023" 
										value={yearAppeared} 
										onChange={e => {
											setYearAppeared(e.target.value);
											setHasUnsavedChanges(true);
											if (errors.yearAppeared) {
												setErrors(prev => ({ ...prev, yearAppeared: '' }));
											}
										}}
										min="1900"
										max={new Date().getFullYear()}
									/>
									{errors.yearAppeared && (
										<p className="mt-1 text-sm text-red-600">{errors.yearAppeared}</p>
									)}
								</div>
								<div className="flex items-center">
									<label className="flex items-center">
										<input 
											type="checkbox"
											className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											checked={isPreviousYear}
											onChange={e => {
												setIsPreviousYear(e.target.checked);
												setHasUnsavedChanges(true);
											}}
										/>
										<span className="ml-2 text-sm text-gray-700">Previous Year Question</span>
									</label>
								</div>
								<div className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
									<input 
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
										placeholder="e.g., previous year, important, formula" 
										value={tagNames} 
										onChange={e => handleTagInput(e.target.value)}
									/>
									{showTagSuggestions && (
										<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
											{tagSuggestions.map((tag, index) => (
												<button
													key={index}
													className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
													onClick={() => addTag(tag)}
												>
													{tag}
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Options */}
							{questionType !== 'OPEN_ENDED' && questionType !== 'PARAGRAPH' && (
							<div>
								<div className="flex items-center justify-between mb-2">
									<label className="block text-sm font-medium text-gray-700">Options *</label>
									<div className="flex items-center space-x-2">
										<button
											type="button"
											onClick={addOption}
											disabled={options.length >= 6}
											className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											+ Add Option
										</button>
										<span className="text-xs text-gray-500">{options.length}/6</span>
									</div>
								</div>
								{errors.options && (
									<p className="mb-2 text-sm text-red-600">{errors.options}</p>
								)}
								{errors.correctAnswer && (
									<p className="mb-2 text-sm text-red-600">{errors.correctAnswer}</p>
								)}
								<div className="space-y-3">
									{options.map((option, index) => (
										<div key={index} className="flex items-center space-x-3">
											<input 
												type={questionType === 'MCQ_MULTIPLE' ? 'checkbox' : 'radio'}
												name={questionType === 'MCQ_MULTIPLE' ? `correctOption${index}` : 'correctOption'}
												checked={option.isCorrect}
												onChange={() => updateOption(index, 'isCorrect', !option.isCorrect)}
												className="text-blue-600 focus:ring-blue-500"
											/>
											<div className="flex-1">
												<LatexRichTextEditor
													value={option.text}
													onChange={(content) => updateOption(index, 'text', content)}
													placeholder={`Option ${index + 1}... (Supports LaTeX math equations with immediate preview)`}
													height={150}
												/>
											</div>
											{option.isCorrect && (
												<span className="text-green-600 text-sm font-medium flex items-center">
													<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
													</svg>
													Correct
												</span>
											)}
											{options.length > 2 && (
												<button
													type="button"
													onClick={() => removeOption(index)}
													className="p-1 text-red-600 hover:text-red-800"
													title="Remove option"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											)}
										</div>
									))}
								</div>
							</div>
							)}

							{/* Action Buttons */}
							<div className="flex space-x-3 pt-4 border-t border-gray-200">
								<button 
									className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
										adding || !stem.trim() || !subjectId || 
										(questionType === 'PARAGRAPH' && subQuestions.length === 0) ||
										(questionType !== 'OPEN_ENDED' && questionType !== 'PARAGRAPH' && options.some(opt => !opt.text.trim()))
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-blue-600 hover:bg-blue-700'
									}`}
									onClick={add}
									disabled={adding || !stem.trim() || !subjectId || 
										(questionType === 'PARAGRAPH' && subQuestions.length === 0) ||
										(questionType !== 'OPEN_ENDED' && questionType !== 'PARAGRAPH' && options.some(opt => !opt.text.trim()))}
								>
									{adding ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Adding...
										</div>
									) : (
										'Save Question'
									)}
								</button>
								<button 
									className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
									onClick={saveDraft}
								>
									Save Draft
								</button>
								<button 
									className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
									onClick={loadDraft}
								>
									Load Draft
								</button>
								<button 
									className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
									onClick={clearForm}
								>
									Clear Form
								</button>
								<button 
									className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
									onClick={() => router.push('/admin/questions')}
								>
									Cancel
								</button>
							</div>

							{/* Keyboard Shortcuts Help */}
							<div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
								💡 Keyboard shortcuts: Ctrl+S (Save), Ctrl+Shift+Enter (Save & Continue)
							</div>
						</div>
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 