'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Overview {
	totalUsers: number;
	totalQuestions: number;
	totalExamPapers: number;
	totalExamSubmissions: number;
	totalSubscriptions: number;
	totalPlans: number;
	activeSubscriptions: number;
	completedSubmissions: number;
	newUsersLast30Days: number;
	newSubmissionsLast30Days: number;
	newSubscriptionsLast30Days: number;
	mrr: number;
}

interface UserAnalytics {
	monthlyRegistrations: Record<string, number>;
	roleDistribution: Array<{ role: string; _count: number }>;
	verificationStats: Array<{ emailVerified: boolean; phoneVerified: boolean; _count: number }>;
	trialUsers: number;
	topUsers: Array<{
		id: string;
		fullName: string;
		email: string;
		_count: { examSubmissions: number };
	}>;
}

interface ExamAnalytics {
	overview: {
		totalSubmissions: number;
		completedSubmissions: number;
		completionRate: number;
		averageScore: number;
	};
	subjectPerformance: Array<{
		subject_name: string;
		total_submissions: number;
		average_score: number;
		unique_users: number;
	}>;
	topicPerformance: Array<{
		topic_name: string;
		subject_name: string;
		total_submissions: number;
		average_score: number;
		unique_users: number;
	}>;
	recentSubmissions: Array<{
		id: string;
		createdAt: string;
		user: { fullName: string; email: string };
		examPaper: { title: string };
	}>;
	examPaperPopularity: Array<{
		id: string;
		title: string;
		_count: { submissions: number };
	}>;
}

interface QuestionAnalytics {
	overview: { totalQuestions: number };
	questionsBySubject: Array<{
		subjectId: string;
		_count: number;
		subject: { name: string };
	}>;
	questionsByTopic: Array<{
		topicId: string;
		_count: number;
		topic: { name: string; subject: { name: string } };
	}>;
	questionsBySubtopic: Array<{
		subtopicId: string;
		_count: number;
		subtopic: { name: string; topic: { name: string; subject: { name: string } } };
	}>;
	difficultyDistribution: Array<{ difficulty: string; _count: number }>;
	mostUsedQuestions: Array<{
		id: string;
		text: string;
		difficulty: string;
		subject_name: string;
		topic_name: string;
		usage_count: number;
	}>;
	questionPerformance: Array<{
		id: string;
		text: string;
		difficulty: string;
		subject_name: string;
		total_attempts: number;
		correct_attempts: number;
		success_rate: number;
	}>;
}

interface SubscriptionAnalytics {
	overview: {
		totalSubscriptions: number;
		activeSubscriptions: number;
		canceledSubscriptions: number;
		mrr: number;
		arr: number;
		churnRate: number;
	};
	planPopularity: Array<{
		id: string;
		name: string;
		priceCents: number;
		currency: string;
		interval: string;
		_count: { subscriptions: number };
	}>;
	monthlySubscriptions: Record<string, number>;
	recentSubscriptions: Array<{
		id: string;
		createdAt: string;
		user: { fullName: string; email: string };
		plan: { name: string; priceCents: number; currency: string };
	}>;
}

interface ContentAnalytics {
	overview: {
		totalSubjects: number;
		totalTopics: number;
		totalSubtopics: number;
		totalQuestions: number;
		totalTags: number;
	};
	subjectsWithCounts: Array<{
		id: string;
		name: string;
		_count: { topics: number; questions: number };
	}>;
	topicsWithCounts: Array<{
		id: string;
		name: string;
		subject: { name: string };
		_count: { subtopics: number; questions: number };
	}>;
	subtopicsWithCounts: Array<{
		id: string;
		name: string;
		topic: { name: string; subject: { name: string } };
		_count: { questions: number };
	}>;
	tagUsage: Array<{
		id: string;
		name: string;
		_count: { questions: number };
	}>;
	monthlyQuestions: Record<string, number>;
}

interface DashboardData {
	overview: Overview;
	userAnalytics: UserAnalytics;
	examAnalytics: ExamAnalytics;
	questionAnalytics: QuestionAnalytics;
	subscriptionAnalytics: SubscriptionAnalytics;
	contentAnalytics: ContentAnalytics;
}

export default function AdminAnalyticsPage() {
	const router = useRouter();
	
	// Data states
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'exams' | 'questions' | 'subscriptions' | 'content'>('overview');

	useEffect(() => {
		loadDashboardData();
	}, []);

	const loadDashboardData = async () => {
		try {
			const response = await api.get('/admin/analytics/dashboard');
			setDashboardData(response.data);
		} catch (error) {
			console.error('Error fetching analytics:', error);
			Swal.fire({
				title: 'Error!',
				text: 'Failed to load analytics data.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setLoading(false);
		};
	};

	const formatCurrency = (amount: number, currency: string = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency.toUpperCase()
		}).format(amount);
	};

	const formatPercentage = (value: number) => {
		return `${value.toFixed(1)}%`;
	};

	const formatNumber = (value: number) => {
		return new Intl.NumberFormat('en-US').format(value);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const getMonthName = (monthKey: string) => {
		const [year, month] = monthKey.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading analytics...</p>
				</div>
			</div>
		);
	}

	if (!dashboardData) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">No analytics data available.</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
							<p className="text-gray-600">Comprehensive insights across all platform modules</p>
						</div>
						<button
							onClick={loadDashboardData}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							Refresh Data
						</button>
					</div>

					{/* Tab Navigation */}
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8">
							{[
								{ key: 'overview', name: 'Overview' },
								{ key: 'users', name: 'Users' },
								{ key: 'exams', name: 'Exams' },
								{ key: 'questions', name: 'Questions' },
								{ key: 'subscriptions', name: 'Subscriptions' },
								{ key: 'content', name: 'Content' }
							].map((tab) => (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key as any)}
									className={`py-2 px-1 border-b-2 font-medium text-sm ${
										activeTab === tab.key
											? 'border-blue-500 text-blue-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									{tab.name}
								</button>
							))}
						</nav>
					</div>

					{/* Overview Tab */}
					{activeTab === 'overview' && (
						<div className="space-y-6">
							{/* Key Metrics */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-blue-100 rounded-lg">
											<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Total Users</p>
											<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.overview.totalUsers)}</p>
											<p className="text-xs text-green-600">+{formatNumber(dashboardData.overview.newUsersLast30Days)} this month</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-green-100 rounded-lg">
											<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Monthly Revenue</p>
											<p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.overview.mrr)}</p>
											<p className="text-xs text-green-600">Active subscriptions</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-purple-100 rounded-lg">
											<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Exam Submissions</p>
											<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.overview.totalExamSubmissions)}</p>
											<p className="text-xs text-blue-600">+{formatNumber(dashboardData.overview.newSubmissionsLast30Days)} this month</p>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Total Questions</p>
											<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.overview.totalQuestions)}</p>
											<p className="text-xs text-gray-600">Across all subjects</p>
										</div>
									</div>
								</div>
							</div>

							{/* Additional Metrics */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Metrics</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Active Subscriptions:</span>
											<span className="text-sm font-semibold">{formatNumber(dashboardData.overview.activeSubscriptions)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Total Plans:</span>
											<span className="text-sm font-semibold">{formatNumber(dashboardData.overview.totalPlans)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">New This Month:</span>
											<span className="text-sm font-semibold text-green-600">+{formatNumber(dashboardData.overview.newSubscriptionsLast30Days)}</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Metrics</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Total Papers:</span>
											<span className="text-sm font-semibold">{formatNumber(dashboardData.overview.totalExamPapers)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Completed:</span>
											<span className="text-sm font-semibold">{formatNumber(dashboardData.overview.completedSubmissions)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Completion Rate:</span>
											<span className="text-sm font-semibold">
												{formatPercentage((dashboardData.overview.completedSubmissions / dashboardData.overview.totalExamSubmissions) * 100)}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">New Users (30d):</span>
											<span className="text-sm font-semibold text-green-600">+{formatNumber(dashboardData.overview.newUsersLast30Days)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Growth Rate:</span>
											<span className="text-sm font-semibold">
												{formatPercentage((dashboardData.overview.newUsersLast30Days / dashboardData.overview.totalUsers) * 100)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Active Users:</span>
											<span className="text-sm font-semibold">{formatNumber(dashboardData.overview.activeSubscriptions)}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Users Tab */}
					{activeTab === 'users' && (
						<div className="space-y-6">
							{/* User Growth Chart */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trend</h3>
								<div className="h-64 flex items-end justify-between space-x-2">
									{Object.entries(dashboardData.userAnalytics.monthlyRegistrations).map(([month, count]) => (
										<div key={month} className="flex-1 flex flex-col items-center">
											<div 
												className="bg-blue-500 rounded-t w-full"
												style={{ height: `${Math.max((count / Math.max(...Object.values(dashboardData.userAnalytics.monthlyRegistrations))) * 200, 10)}px` }}
											></div>
											<p className="text-xs text-gray-600 mt-2 text-center">{getMonthName(month)}</p>
											<p className="text-xs font-semibold">{count}</p>
										</div>
									))}
								</div>
							</div>

							{/* User Statistics */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
									<div className="space-y-3">
										{dashboardData.userAnalytics.roleDistribution.map((role) => (
											<div key={role.role} className="flex justify-between items-center">
												<span className="text-sm text-gray-600">{role.role}:</span>
												<span className="text-sm font-semibold">{formatNumber(role._count)}</span>
											</div>
										))}
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Activity</h3>
									<div className="space-y-3">
										{dashboardData.userAnalytics.topUsers.slice(0, 5).map((user) => (
											<div key={user.id} className="flex justify-between items-center">
												<div>
													<p className="text-sm font-medium text-gray-900">{user.fullName}</p>
													<p className="text-xs text-gray-500">{user.email}</p>
												</div>
												<span className="text-sm font-semibold">{user._count.examSubmissions} exams</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Exams Tab */}
					{activeTab === 'exams' && (
						<div className="space-y-6">
							{/* Exam Overview */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Total Submissions</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.examAnalytics.overview.totalSubmissions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Completed</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.examAnalytics.overview.completedSubmissions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Completion Rate</p>
									<p className="text-2xl font-bold text-gray-900">{formatPercentage(dashboardData.examAnalytics.overview.completionRate)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Average Score</p>
									<p className="text-2xl font-bold text-gray-900">{formatPercentage(dashboardData.examAnalytics.overview.averageScore)}</p>
								</div>
							</div>

							{/* Performance by Subject */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{dashboardData.examAnalytics.subjectPerformance.map((subject, index) => (
												<tr key={index}>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.subject_name}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(subject.total_submissions)}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(subject.average_score)}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(subject.unique_users)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Popular Exam Papers */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Exam Papers</h3>
								<div className="space-y-3">
									{dashboardData.examAnalytics.examPaperPopularity.map((paper) => (
										<div key={paper.id} className="flex justify-between items-center">
											<span className="text-sm font-medium text-gray-900">{paper.title}</span>
											<span className="text-sm text-gray-500">{paper._count.submissions} submissions</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Questions Tab */}
					{activeTab === 'questions' && (
						<div className="space-y-6">
							{/* Question Overview */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Total Questions</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.questionAnalytics.overview.totalQuestions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Difficulty Distribution</p>
									<div className="mt-2 space-y-2">
										{dashboardData.questionAnalytics.difficultyDistribution.map((diff) => (
											<div key={diff.difficulty} className="flex justify-between">
												<span className="text-sm text-gray-600">{diff.difficulty}:</span>
												<span className="text-sm font-semibold">{formatNumber(diff._count)}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Questions by Subject */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Questions by Subject</h3>
								<div className="space-y-3">
									{dashboardData.questionAnalytics.questionsBySubject.map((subject) => (
										<div key={subject.subjectId} className="flex justify-between items-center">
											<span className="text-sm font-medium text-gray-900">{subject.subject.name}</span>
											<span className="text-sm text-gray-500">{formatNumber(subject._count)} questions</span>
										</div>
									))}
								</div>
							</div>

							{/* Most Used Questions */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Questions</h3>
								<div className="space-y-3">
									{dashboardData.questionAnalytics.mostUsedQuestions.slice(0, 10).map((question) => (
										<div key={question.id} className="border-b border-gray-100 pb-3">
											<p className="text-sm font-medium text-gray-900">{question.text.substring(0, 100)}...</p>
											<div className="flex justify-between items-center mt-1">
												<span className="text-xs text-gray-500">{question.subject_name} • {question.topic_name}</span>
												<span className="text-xs font-semibold">{question.usage_count} uses</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Subscriptions Tab */}
					{activeTab === 'subscriptions' && (
						<div className="space-y-6">
							{/* Subscription Overview */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Total Subscriptions</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.subscriptionAnalytics.overview.totalSubscriptions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Active Subscriptions</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.subscriptionAnalytics.overview.activeSubscriptions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Monthly Revenue</p>
									<p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.subscriptionAnalytics.overview.mrr)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Churn Rate</p>
									<p className="text-2xl font-bold text-gray-900">{formatPercentage(dashboardData.subscriptionAnalytics.overview.churnRate)}</p>
								</div>
							</div>

							{/* Plan Popularity */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Popularity</h3>
								<div className="space-y-3">
									{dashboardData.subscriptionAnalytics.planPopularity.map((plan) => (
										<div key={plan.id} className="flex justify-between items-center">
											<div>
												<p className="text-sm font-medium text-gray-900">{plan.name}</p>
												<p className="text-xs text-gray-500">{formatCurrency(plan.priceCents / 100, plan.currency)} / {plan.interval.toLowerCase()}</p>
											</div>
											<span className="text-sm font-semibold">{plan._count.subscriptions} subscribers</span>
										</div>
									))}
								</div>
							</div>

							{/* Subscription Growth */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Growth</h3>
								<div className="h-64 flex items-end justify-between space-x-2">
									{Object.entries(dashboardData.subscriptionAnalytics.monthlySubscriptions).map(([month, count]) => (
										<div key={month} className="flex-1 flex flex-col items-center">
											<div 
												className="bg-green-500 rounded-t w-full"
												style={{ height: `${Math.max((count / Math.max(...Object.values(dashboardData.subscriptionAnalytics.monthlySubscriptions))) * 200, 10)}px` }}
											></div>
											<p className="text-xs text-gray-600 mt-2 text-center">{getMonthName(month)}</p>
											<p className="text-xs font-semibold">{count}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Content Tab */}
					{activeTab === 'content' && (
						<div className="space-y-6">
							{/* Content Overview */}
							<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Subjects</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.contentAnalytics.overview.totalSubjects)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Topics</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.contentAnalytics.overview.totalTopics)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Subtopics</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.contentAnalytics.overview.totalSubtopics)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Questions</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.contentAnalytics.overview.totalQuestions)}</p>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-sm font-semibold text-gray-700">Tags</p>
									<p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardData.contentAnalytics.overview.totalTags)}</p>
								</div>
							</div>

							{/* Content Distribution */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Top Subjects by Questions</h3>
									<div className="space-y-3">
										{dashboardData.contentAnalytics.subjectsWithCounts.slice(0, 10).map((subject) => (
											<div key={subject.id} className="flex justify-between items-center">
												<span className="text-sm font-medium text-gray-900">{subject.name}</span>
												<span className="text-sm text-gray-500">{formatNumber(subject._count.questions)} questions</span>
											</div>
										))}
									</div>
								</div>

								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Tags</h3>
									<div className="space-y-3">
										{dashboardData.contentAnalytics.tagUsage.slice(0, 10).map((tag) => (
											<div key={tag.id} className="flex justify-between items-center">
												<span className="text-sm font-medium text-gray-900">{tag.name}</span>
												<span className="text-sm text-gray-500">{formatNumber(tag._count.questions)} questions</span>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Content Growth */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">Question Growth</h3>
								<div className="h-64 flex items-end justify-between space-x-2">
									{Object.entries(dashboardData.contentAnalytics.monthlyQuestions).map(([month, count]) => (
										<div key={month} className="flex-1 flex flex-col items-center">
											<div 
												className="bg-purple-500 rounded-t w-full"
												style={{ height: `${Math.max((count / Math.max(...Object.values(dashboardData.contentAnalytics.monthlyQuestions))) * 200, 10)}px` }}
											></div>
											<p className="text-xs text-gray-600 mt-2 text-center">{getMonthName(month)}</p>
											<p className="text-xs font-semibold">{count}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</AdminLayout>
		</ProtectedRoute>
	);
} 