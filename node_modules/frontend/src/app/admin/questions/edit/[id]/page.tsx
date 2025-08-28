'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditQuestionPage() {
	const router = useRouter();
	const params = useParams();
	const questionId = params.id as string;
	
	// Data states
	const [question, setQuestion] = useState<Question | null>(null);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	
	// Form states
	const [stem, setStem] = useState('');
	const [explanation, setExplanation] = useState('');
	const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
	const [yearAppeared, setYearAppeared] = useState('');
	const [isPreviousYear, setIsPreviousYear] = useState(false);
	const [subjectId, setSubjectId] = useState('');
	const [topicId, setTopicId] = useState('');
	const [subtopicId, setSubtopicId] = useState('');
	const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
	const [tagNames, setTagNames] = useState('');

	const loadData = async () => {
		try {
			const [questionResponse, subjectsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get(`/admin/questions/${questionId}`),
				api.get('/admin/subjects'),
				api.get('/admin/topics?limit=1000'),
				api.get('/admin/subtopics?limit=1000')
			]);
			
			const questionData = questionResponse.data;
			setQuestion(questionData);
			setSubjects(subjectsResponse.data);
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
			
			// Populate form with question data
			setStem(questionData.stem);
			setExplanation(questionData.explanation || '');
			setDifficulty(questionData.difficulty);
			setYearAppeared(questionData.yearAppeared?.toString() || '');
			setIsPreviousYear(questionData.isPreviousYear);
			setSubjectId(questionData.subjectId || '');
			setTopicId(questionData.topicId || '');
			setSubtopicId(questionData.subtopicId || '');
			setOptions(questionData.options.map((opt: QuestionOption) => ({ text: opt.text, isCorrect: opt.isCorrect })));
			setTagNames(questionData.tags.map((t: QuestionTag) => t.tag.name).join(', '));
		} catch (error) {
			console.error('Error fetching data:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load question data. Please check if the question exists.',
				icon: 'error',
				confirmButtonText: 'OK'
			}).then(() => {
				router.push('/admin/questions');
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { 
		if (questionId) {
			loadData(); 
		}
	}, [questionId]);

	const save = async () => {
		if (!stem.trim() || !subjectId || options.some(opt => !opt.text.trim())) {
			Swal.fire({
				title: 'Validation Error',
				text: 'Please fill in all required fields including question stem, subject, and all options.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		setSaving(true);
		try {
			const tagNamesArray = tagNames.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
			
			await api.put(`/admin/questions/${questionId}`, { 
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
			
			Swal.fire({
				title: 'Success!',
				text: 'Question has been updated successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			// Redirect to questions listing page
			setTimeout(() => {
				router.push('/admin/questions');
			}, 2000);
		} catch (error: any) {
			console.error('Error updating question:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update the question. Please try again.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setSaving(false);
		}
	};

	const resetForm = () => {
		if (question) {
			setStem(question.stem);
			setExplanation(question.explanation || '');
			setDifficulty(question.difficulty);
			setYearAppeared(question.yearAppeared?.toString() || '');
			setIsPreviousYear(question.isPreviousYear);
			setSubjectId(question.subjectId || '');
			setTopicId(question.topicId || '');
			setSubtopicId(question.subtopicId || '');
			setOptions(question.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })));
			setTagNames(question.tags.map(t => t.tag.name).join(', '));
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading question data...</p>
				</div>
			</div>
		);
	}

	if (!question) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-gray-900">Question not found</h2>
					<p className="mt-2 text-gray-600">The question you're looking for doesn't exist.</p>
					<button 
						onClick={() => router.push('/admin/questions')}
						className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Back to Questions
					</button>
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
							<h1 className="text-2xl font-bold text-gray-900">Edit Question</h1>
							<p className="text-gray-600">Update the question details and options</p>
						</div>
						<div className="flex items-center space-x-4">
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

					{/* Question Form */}
					<div className="bg-white rounded-lg shadow p-6">
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
										onChange={e => setSubtopicId(e.target.value)}
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
							<div className="flex space-x-3 pt-4 border-t border-gray-200">
								<button 
									className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
										saving || !stem.trim() || !subjectId || options.some(opt => !opt.text.trim())
											? 'bg-gray-400 cursor-not-allowed' 
											: 'bg-green-600 hover:bg-green-700'
									}`}
									onClick={save}
									disabled={saving || !stem.trim() || !subjectId || options.some(opt => !opt.text.trim())}
								>
									{saving ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Saving...
										</div>
									) : (
										'Save Changes'
									)}
								</button>
								<button 
									className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
									onClick={resetForm}
								>
									Reset Form
								</button>
								<button 
									className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
									onClick={() => router.push('/admin/questions')}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 