'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

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

export default function CreateExamPaperPage() {
	const router = useRouter();
	
	// Form states
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [timeLimitMin, setTimeLimitMin] = useState('');
	const [questionCount, setQuestionCount] = useState('');
	
	// Selection states
	const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
	const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
	const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
	
	// Data states
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	
	// Filter states for topics and subtopics
	const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
	const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);

	useEffect(() => {
		loadData();
	}, []);

	// Update filtered topics when subjects change
	useEffect(() => {
		if (selectedSubjects.length > 0) {
			const filtered = topics.filter(topic => 
				selectedSubjects.includes(topic.subject.id)
			);
			setFilteredTopics(filtered);
		} else {
			setFilteredTopics(topics);
		}
	}, [selectedSubjects, topics]);

	// Update filtered subtopics when topics change
	useEffect(() => {
		if (selectedTopics.length > 0) {
			const filtered = subtopics.filter(subtopic => 
				selectedTopics.includes(subtopic.topic.id)
			);
			setFilteredSubtopics(filtered);
		} else {
			setFilteredSubtopics(subtopics);
		}
	}, [selectedTopics, subtopics]);

	const loadData = async () => {
		try {
			const [subjectsResponse, topicsResponse, subtopicsResponse] = await Promise.all([
				api.get('/admin/subjects'),
				api.get('/admin/topics?limit=1000'),
				api.get('/admin/subtopics?limit=1000')
			]);
			
			setSubjects(subjectsResponse.data);
			setTopics(topicsResponse.data.topics || topicsResponse.data);
			setSubtopics(subtopicsResponse.data.subtopics || subtopicsResponse.data);
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

	const handleSubjectToggle = (subjectId: string) => {
		setSelectedSubjects(prev => 
			prev.includes(subjectId) 
				? prev.filter(id => id !== subjectId)
				: [...prev, subjectId]
		);
	};

	const handleTopicToggle = (topicId: string) => {
		setSelectedTopics(prev => 
			prev.includes(topicId) 
				? prev.filter(id => id !== topicId)
				: [...prev, topicId]
		);
	};

	const handleSubtopicToggle = (subtopicId: string) => {
		setSelectedSubtopics(prev => 
			prev.includes(subtopicId) 
				? prev.filter(id => id !== subtopicId)
				: [...prev, subtopicId]
		);
	};

	const handleSelectAllSubjects = () => {
		if (selectedSubjects.length === subjects.length) {
			setSelectedSubjects([]);
		} else {
			setSelectedSubjects(subjects.map(s => s.id));
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

		if (selectedSubjects.length === 0 && selectedTopics.length === 0 && selectedSubtopics.length === 0) {
			Swal.fire({
				title: 'Error!',
				text: 'Please select at least one subject, topic, or subtopic.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return false;
		}

		if (questionCount && (parseInt(questionCount) < 1 || parseInt(questionCount) > 100)) {
			Swal.fire({
				title: 'Error!',
				text: 'Question count must be between 1 and 100.',
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
			await api.post('/admin/exam-papers', {
				title: title.trim(),
				description: description.trim() || undefined,
				subjectIds: selectedSubjects,
				topicIds: selectedTopics,
				subtopicIds: selectedSubtopics,
				timeLimitMin: timeLimitMin ? parseInt(timeLimitMin) : undefined,
				questionCount: questionCount ? parseInt(questionCount) : undefined
			});
			
			Swal.fire({
				title: 'Success!',
				text: `"${title.trim()}" has been created successfully.`,
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			router.push('/admin/exam-papers');
		} catch (error: any) {
			console.error('Error creating exam paper:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to create the exam paper. Please try again.',
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
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Create New Exam Paper</h1>
							<p className="text-gray-600">Configure exam paper settings and select content areas</p>
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

					{/* Form */}
					<div className="bg-white rounded-lg shadow p-6 space-y-6">
						{/* Basic Information */}
						<div>
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
								<div className="md:col-span-2">
									<label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
									<textarea 
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
										placeholder="Enter exam paper description" 
										rows={3}
										value={description} 
										onChange={e => setDescription(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-800 mb-2">Question Count</label>
									<input 
										type="number"
										className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
										placeholder="Number of questions to generate" 
										value={questionCount} 
										onChange={e => setQuestionCount(e.target.value)}
									/>
								</div>
							</div>
						</div>

						{/* Content Selection */}
						<div>
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Content Selection</h2>
							<p className="text-sm text-gray-600 mb-4">
								Select subjects, topics, or subtopics to include in this exam. You can select multiple items from any category.
							</p>

							{/* Subjects */}
							<div className="mb-6">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-md font-medium text-gray-900">Subjects</h3>
									<button
										onClick={handleSelectAllSubjects}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										{selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
									{subjects.map((subject) => (
										<label key={subject.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
											<input
												type="checkbox"
												checked={selectedSubjects.includes(subject.id)}
												onChange={() => handleSubjectToggle(subject.id)}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<span className="text-sm text-gray-900">{subject.name}</span>
										</label>
									))}
								</div>
							</div>

							{/* Topics */}
							<div className="mb-6">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-md font-medium text-gray-900">
										Topics {selectedSubjects.length > 0 && `(Filtered by selected subjects)`}
									</h3>
									<button
										onClick={handleSelectAllTopics}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										{selectedTopics.length === filteredTopics.length ? 'Deselect All' : 'Select All'}
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
									{filteredTopics.map((topic) => (
										<label key={topic.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
											<input
												type="checkbox"
												checked={selectedTopics.includes(topic.id)}
												onChange={() => handleTopicToggle(topic.id)}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<div className="flex flex-col">
												<span className="text-sm text-gray-900">{topic.name}</span>
												<span className="text-xs text-gray-500">{topic.subject.name}</span>
											</div>
										</label>
									))}
								</div>
							</div>

							{/* Subtopics */}
							<div className="mb-6">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-md font-medium text-gray-900">
										Subtopics {selectedTopics.length > 0 && `(Filtered by selected topics)`}
									</h3>
									<button
										onClick={handleSelectAllSubtopics}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										{selectedSubtopics.length === filteredSubtopics.length ? 'Deselect All' : 'Select All'}
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
									{filteredSubtopics.map((subtopic) => (
										<label key={subtopic.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
											<input
												type="checkbox"
												checked={selectedSubtopics.includes(subtopic.id)}
												onChange={() => handleSubtopicToggle(subtopic.id)}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<div className="flex flex-col">
												<span className="text-sm text-gray-900">{subtopic.name}</span>
												<span className="text-xs text-gray-500">
													{subtopic.topic.name} • {subtopic.topic.subject.name}
												</span>
											</div>
										</label>
									))}
								</div>
							</div>

							{/* Selection Summary */}
							<div className="bg-blue-50 rounded-lg p-4">
								<h4 className="text-sm font-medium text-blue-900 mb-2">Selection Summary</h4>
								<div className="text-sm text-blue-800 space-y-1">
									<p>• {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected</p>
									<p>• {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected</p>
									<p>• {selectedSubtopics.length} subtopic{selectedSubtopics.length !== 1 ? 's' : ''} selected</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
							<button
								onClick={handleCancel}
								className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={submitting || !title.trim()}
								className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
									submitting || !title.trim()
										? 'bg-gray-400 cursor-not-allowed'
										: 'bg-blue-600 hover:bg-blue-700'
								}`}
							>
								{submitting ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Creating...
									</div>
								) : (
									'Create Exam Paper'
								)}
							</button>
						</div>
					</div>
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 