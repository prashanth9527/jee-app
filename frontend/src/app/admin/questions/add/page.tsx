'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/RichTextEditor';

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

interface Tag {
	id: string;
	name: string;
}

export default function AddQuestionPage() {
	const router = useRouter();
	
	// Data states
	const [subjects, setSubjects] = useState<Subject[]>([]);
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
	
	// Form validation states
	const [errors, setErrors] = useState<{[key: string]: string}>({});
	const [formProgress, setFormProgress] = useState(0);
	
	// Auto-save states
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const loadData = async () => {
		try {
			const [subjectsResponse, topicsResponse, subtopicsResponse, tagsResponse] = await Promise.all([
				api.get('/admin/subjects'),
				api.get('/admin/topics?limit=1000'),
				api.get('/admin/subtopics?limit=1000'),
				api.get('/admin/tags?limit=1000')
			]);
			
			setSubjects(subjectsResponse.data);
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
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
	}, [stem, explanation, tipFormula, difficulty, yearAppeared, isPreviousYear, subjectId, topicId, subtopicId, options, tagNames, hasUnsavedChanges, loading]);

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
		
		if (options.some(opt => !opt.text.trim())) {
			newErrors.options = 'All options must be filled';
		}
		
		if (!options.some(opt => opt.isCorrect)) {
			newErrors.correctAnswer = 'Please select a correct answer';
		}
		
		if (yearAppeared && (parseInt(yearAppeared) < 1900 || parseInt(yearAppeared) > new Date().getFullYear())) {
			newErrors.yearAppeared = 'Year must be between 1900 and current year';
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [stem, subjectId, options, yearAppeared]);

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
			// If setting this option as correct, uncheck others
			newOptions.forEach((opt, i) => {
				opt.isCorrect = i === index;
			});
		} else {
			newOptions[index][field] = value as string;
		}
		setOptions(newOptions);
		setHasUnsavedChanges(true);
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
			
			await api.post('/admin/questions', { 
				stem: stem.trim(),
				explanation: explanation.trim() || undefined,
				tip_formula: tipFormula.trim() || undefined,
				difficulty,
				yearAppeared: yearAppeared ? parseInt(yearAppeared) : undefined,
				isPreviousYear,
				subjectId,
				topicId: topicId || undefined,
				subtopicId: subtopicId || undefined,
				options,
				tagNames: tagNamesArray.length > 0 ? tagNamesArray : undefined
			});
			
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
										<RichTextEditor
											value={stem}
											onChange={(content) => {
												setStem(content);
												setHasUnsavedChanges(true);
												if (errors.stem) {
													setErrors(prev => ({ ...prev, stem: '' }));
												}
											}}
											placeholder="Enter the question text... (Supports rich text formatting and math equations)"
											height={200}
										/>
									</div>
									{errors.stem && (
										<p className="mt-1 text-sm text-red-600">{errors.stem}</p>
									)}
									<div className="mt-2 text-xs text-gray-500">
										💡 Tip: Use the toolbar for formatting, and click the Math button (∑) to insert equations
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Explanation (Optional)
										<span className="text-xs text-gray-500 ml-2">({explanation.length}/500)</span>
									</label>
									<RichTextEditor
										value={explanation}
										onChange={(content) => {
											setExplanation(content);
											setHasUnsavedChanges(true);
										}}
										placeholder="Enter detailed explanation for the answer... (Supports rich text formatting and math equations)"
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
								<RichTextEditor
									value={tipFormula}
									onChange={(content) => {
										setTipFormula(content);
										setHasUnsavedChanges(true);
									}}
									placeholder="Enter helpful tips, formulas, or hints to solve this question... (Supports rich text formatting and math equations)"
									height={150}
								/>
								<div className="mt-2 text-xs text-gray-500">
									💡 Tip: Include key formulas, concepts, or solving strategies. Use the Math button (∑) for mathematical expressions
								</div>
							</div>

							{/* Question Metadata */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
									<select 
										className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium ${
											errors.subject ? 'border-red-300' : 'border-gray-300'
										}`}
										value={subjectId}
										onChange={e => {
											setSubjectId(e.target.value);
											setTopicId('');
											setSubtopicId('');
											setHasUnsavedChanges(true);
											if (errors.subject) {
												setErrors(prev => ({ ...prev, subject: '' }));
											}
										}}
									>
										<option value="">Select Subject</option>
										{Array.isArray(subjects) && subjects.map(subject => (
											<option key={subject.id} value={subject.id}>
												{subject.name}
											</option>
										))}
									</select>
									{errors.subject && (
										<p className="mt-1 text-sm text-red-600">{errors.subject}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
									<select 
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium"
										value={topicId}
										onChange={e => {
											setTopicId(e.target.value);
											setSubtopicId('');
											setHasUnsavedChanges(true);
										}}
										disabled={!subjectId}
									>
										<option value="">Select Topic</option>
										{Array.isArray(topics) && topics
											.filter(topic => topic.subject?.id === subjectId)
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
												type="radio"
												name="correctOption"
												checked={option.isCorrect}
												onChange={() => updateOption(index, 'isCorrect', true)}
												className="text-blue-600 focus:ring-blue-500"
											/>
											<input 
												className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base font-medium" 
												placeholder={`Option ${index + 1}`} 
												value={option.text} 
												onChange={e => updateOption(index, 'text', e.target.value)}
											/>
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

							{/* Action Buttons */}
							<div className="flex space-x-3 pt-4 border-t border-gray-200">
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