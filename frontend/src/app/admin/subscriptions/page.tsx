'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface Plan {
	id: string;
	name: string;
	description?: string;
	priceCents: number;
	interval: 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR';
	planType: 'MANUAL' | 'AI_ENABLED';
	discountPercent?: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	_count?: {
		subscriptions: number;
	};
}

interface Subscription {
	id: string;
	status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
	startedAt: string;
	endsAt?: string;
	createdAt: string;
	updatedAt: string;
	user: {
		id: string;
		fullName: string;
		email: string;
	};
	plan: {
		id: string;
		name: string;
		priceCents: number;
		planType: 'MANUAL' | 'AI_ENABLED';
	};
}

interface Analytics {
	overview: {
		totalPlans: number;
		totalSubscriptions: number;
		activeSubscriptions: number;
		canceledSubscriptions: number;
		mrr: number;
	};
	recentSubscriptions: Array<{
		id: string;
		createdAt: string;
		user: {
			fullName: string;
			email: string;
		};
		plan: {
			name: string;
		};
	}>;
	planDistribution: Array<{
		id: string;
		name: string;
		_count: {
			subscriptions: number;
		};
	}>;
}

export default function AdminSubscriptionsPage() {
	const router = useRouter();
	
	// Data states
	const [plans, setPlans] = useState<Plan[]>([]);
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'subscriptions'>('overview');
	
	// Plans states
	const [addingPlan, setAddingPlan] = useState(false);
	const [editingPlan, setEditingPlan] = useState<string | null>(null);
	const [planName, setPlanName] = useState('');
	const [planDescription, setPlanDescription] = useState('');
	const [planPrice, setPlanPrice] = useState('');
	const [planDiscountPercent, setPlanDiscountPercent] = useState(0);
	const [planDuration, setPlanDuration] = useState<'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR'>('MONTH');
	const [planType, setPlanType] = useState<'MANUAL' | 'AI_ENABLED'>('MANUAL');
	const [planIsActive, setPlanIsActive] = useState(true);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	
	// Filter states
	const [searchText, setSearchText] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [selectedPlan, setSelectedPlan] = useState('');

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if (activeTab === 'plans') {
			loadPlans();
		} else if (activeTab === 'subscriptions') {
			loadSubscriptions();
		}
	}, [activeTab, currentPage, itemsPerPage, searchText, selectedStatus, selectedPlan]);

	const loadData = async () => {
		try {
			const [analyticsResponse] = await Promise.all([
				api.get('/admin/subscriptions/analytics')
			]);
			
			setAnalytics(analyticsResponse.data);
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
		}
	};

	const loadPlans = async () => {
		try {
			const searchParam = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
			const response = await api.get(`/admin/subscriptions/plans?page=${currentPage}&limit=${itemsPerPage}${searchParam}`);
			
			setPlans(response.data.plans);
			if (response.data.pagination) {
				setCurrentPage(response.data.pagination.currentPage);
				setTotalPages(response.data.pagination.totalPages);
				setTotalItems(response.data.pagination.totalItems);
			}
		} catch (error) {
			console.error('Error fetching plans:', error);
		}
	};

	const loadSubscriptions = async () => {
		try {
			const searchParam = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
			const statusParam = selectedStatus ? `&status=${selectedStatus}` : '';
			const planParam = selectedPlan ? `&planId=${selectedPlan}` : '';
			const response = await api.get(`/admin/subscriptions/subscriptions?page=${currentPage}&limit=${itemsPerPage}${searchParam}${statusParam}${planParam}`);
			
			setSubscriptions(response.data.subscriptions);
			if (response.data.pagination) {
				setCurrentPage(response.data.pagination.currentPage);
				setTotalPages(response.data.pagination.totalPages);
				setTotalItems(response.data.pagination.totalItems);
			}
		} catch (error) {
			console.error('Error fetching subscriptions:', error);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearch = (value: string) => {
		setSearchText(value);
		setCurrentPage(1);
	};

	const handleItemsPerPageChange = (newItemsPerPage: number) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setSearchText('');
		setSelectedStatus('');
		setSelectedPlan('');
		setCurrentPage(1);
	};

	const addPlan = async () => {
		if (!planName.trim() || !planPrice) {
			Swal.fire({
				title: 'Error!',
				text: 'Plan name and price are required.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return;
		}

		setAddingPlan(true);
		try {
			await api.post('/admin/subscriptions/plans', {
				name: planName.trim(),
				description: planDescription.trim() || undefined,
				priceCents: Math.round(parseFloat(planPrice) * 100),
				interval: planDuration,
				planType: planType
			});
			
			// Reset form
			setPlanName('');
			setPlanDescription('');
			setPlanPrice('');
			setPlanDiscountPercent(0);
			setPlanDuration('MONTH');
			setPlanType('MANUAL');
			setPlanIsActive(true);
			
			Swal.fire({
				title: 'Success!',
				text: 'Plan created successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			loadPlans();
			loadData(); // Refresh analytics
		} catch (error: any) {
			console.error('Error creating plan:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to create plan.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		} finally {
			setAddingPlan(false);
		}
	};

	const updatePlan = async (planId: string) => {
		if (!planName.trim() || !planPrice) {
			Swal.fire({
				title: 'Error!',
				text: 'Plan name and price are required.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return;
		}

		try {
			await api.put(`/admin/subscriptions/plans/${planId}`, {
				name: planName.trim(),
				description: planDescription.trim() || undefined,
				priceCents: Math.round(parseFloat(planPrice) * 100),
				discountPercent: planDiscountPercent,
				interval: planDuration,
				planType: planType,
				isActive: planIsActive
			});
			
			Swal.fire({
				title: 'Success!',
				text: 'Plan updated successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			setEditingPlan(null);
			loadPlans();
			loadData(); // Refresh analytics
		} catch (error: any) {
			console.error('Error updating plan:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update plan.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const deletePlan = async (planId: string, planName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${planName}". This action cannot be undone!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel'
		});

		if (result.isConfirmed) {
			try {
				await api.delete(`/admin/subscriptions/plans/${planId}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'Plan has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				loadPlans();
				loadData(); // Refresh analytics
			} catch (error: any) {
				console.error('Error deleting plan:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete plan.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const startEditPlan = (plan: Plan) => {
		setEditingPlan(plan.id);
		setPlanName(plan.name);
		setPlanDescription(plan.description || '');
		setPlanPrice((plan.priceCents / 100).toString());
		setPlanDiscountPercent(plan.discountPercent || 0);
		setPlanDuration(plan.interval);
		setPlanType(plan.planType);
		setPlanIsActive(plan.isActive);
	};

	const cancelEditPlan = () => {
		setEditingPlan(null);
		setPlanName('');
		setPlanDescription('');
		setPlanPrice('');
		setPlanDiscountPercent(0);
		setPlanDuration('MONTH');
		setPlanType('MANUAL');
		setPlanIsActive(true);
	};

	const formatPrice = (priceCents: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(priceCents / 100);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading subscriptions...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
							<p className="text-gray-600">Manage subscription plans and track user subscriptions</p>
						</div>
					</div>

					{/* Tab Navigation */}
					<div className="border-b border-gray-200">
						<nav className="-mb-px flex space-x-8">
							<button
								onClick={() => setActiveTab('overview')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'overview'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Overview
							</button>
							<button
								onClick={() => setActiveTab('plans')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'plans'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Plans
							</button>
							<button
								onClick={() => setActiveTab('subscriptions')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'subscriptions'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Subscriptions
							</button>
						</nav>
					</div>

					{/* Overview Tab */}
					{activeTab === 'overview' && analytics && (
						<div className="space-y-6">
							{/* Statistics Cards */}
							<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-blue-100 rounded-lg">
											<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Total Plans</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.totalPlans}</p>
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
											<p className="text-sm font-semibold text-gray-700">Active Subscriptions</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.activeSubscriptions}</p>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-red-100 rounded-lg">
											<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Canceled</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.canceledSubscriptions}</p>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-purple-100 rounded-lg">
											<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">MRR</p>
											<p className="text-2xl font-bold text-gray-900">${analytics.overview.mrr.toFixed(2)}</p>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Total Users</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.totalSubscriptions}</p>
										</div>
									</div>
								</div>
							</div>

							{/* Recent Subscriptions */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">Recent Subscriptions</h3>
								</div>
								<div className="divide-y divide-gray-200">
									{analytics.recentSubscriptions.map((subscription) => (
										<div key={subscription.id} className="px-6 py-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-gray-900">{subscription.user.fullName}</p>
													<p className="text-sm text-gray-500">{subscription.user.email}</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-medium text-gray-900">{subscription.plan.name}</p>
													<p className="text-sm text-gray-500">{formatDate(subscription.createdAt)}</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Plans Tab */}
					{activeTab === 'plans' && (
						<div className="space-y-6">
							{/* Add Plan Form */}
							<div className="bg-white rounded-lg shadow p-6">
								<h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Plan</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
										<input 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="Plan name" 
											value={planName} 
											onChange={e => setPlanName(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-800 mb-2">Price *</label>
										<input 
											type="number"
											step="0.01"
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="0.00" 
											value={planPrice} 
											onChange={e => setPlanPrice(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-800 mb-2">Discount Percent</label>
										<input 
											type="number"
											step="0.01"
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="0.00" 
											value={planDiscountPercent} 
											onChange={e => setPlanDiscountPercent(parseInt(e.target.value))}
										/>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Duration</label>
										<select
											className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 font-medium"
											value={planDuration}
											onChange={e => setPlanDuration(e.target.value as 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR')}
										>
											<option value="MONTH" className="dark:bg-gray-700 dark:text-gray-100">Month</option>
											<option value="THREE_MONTHS" className="dark:bg-gray-700 dark:text-gray-100">3 Months</option>
											<option value="SIX_MONTHS" className="dark:bg-gray-700 dark:text-gray-100">6 Months</option>
											<option value="YEAR" className="dark:bg-gray-700 dark:text-gray-100">Year</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Plan Type</label>
										<select
											className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 font-medium"
											value={planType}
											onChange={e => setPlanType(e.target.value as 'MANUAL' | 'AI_ENABLED')}
										>
											<option value="MANUAL" className="dark:bg-gray-700 dark:text-gray-100">Manual</option>
											<option value="AI_ENABLED" className="dark:bg-gray-700 dark:text-gray-100">AI Enabled</option>
										</select>
									</div>
									<div className="md:col-span-2">
										<label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
										<textarea 
											className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500" 
											placeholder="Plan description" 
											rows={2}
											value={planDescription} 
											onChange={e => setPlanDescription(e.target.value)}
										/>
									</div>
									<div className="md:col-span-2 flex items-end">
										<button 
											className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
												addingPlan || !planName.trim() || !planPrice
													? 'bg-gray-400 cursor-not-allowed' 
													: 'bg-blue-600 hover:bg-blue-700'
											}`}
											onClick={addPlan}
											disabled={addingPlan || !planName.trim() || !planPrice}
										>
											{addingPlan ? (
												<div className="flex items-center justify-center">
													<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
													Creating...
												</div>
											) : (
												'Create Plan'
											)}
										</button>
									</div>
								</div>
							</div>

							{/* Plans List */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold text-gray-900">All Plans</h3>
										<div className="flex items-center space-x-3">
											<input
												type="text"
												placeholder="Search plans..."
												value={searchText}
												onChange={e => handleSearch(e.target.value)}
												className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
											/>
											{searchText && (
												<button
													onClick={() => handleSearch('')}
													className="text-gray-400 hover:text-gray-600"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
													</svg>
												</button>
											)}
										</div>
									</div>
								</div>
								
								<div className="divide-y divide-gray-200">
									{plans.map((plan) => (
										<div key={plan.id} className="px-6 py-4">
											{editingPlan === plan.id ? (
												<div className="space-y-4">
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
															<input 
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={planName} 
																onChange={e => setPlanName(e.target.value)}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Price *</label>
															<input 
																type="number"
																step="0.01"
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={planPrice} 
																onChange={e => setPlanPrice(e.target.value)}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Discount Percent</label>
															<input 
																type="number"
																step="0.01"
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={planDiscountPercent} 
																onChange={e => setPlanDiscountPercent(parseInt(e.target.value))}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Duration</label>
															<select
																className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 font-medium"
																value={planDuration}
																onChange={e => setPlanDuration(e.target.value as 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR')}
															>
																<option value="MONTH" className="dark:bg-gray-700 dark:text-gray-100">Month</option>
																<option value="THREE_MONTHS" className="dark:bg-gray-700 dark:text-gray-100">3 Months</option>
																<option value="SIX_MONTHS" className="dark:bg-gray-700 dark:text-gray-100">6 Months</option>
																<option value="YEAR" className="dark:bg-gray-700 dark:text-gray-100">Year</option>
															</select>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Plan Type</label>
															<select
																className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 font-medium"
																value={planType}
																onChange={e => setPlanType(e.target.value as 'MANUAL' | 'AI_ENABLED')}
															>
																<option value="MANUAL" className="dark:bg-gray-700 dark:text-gray-100">Manual</option>
																<option value="AI_ENABLED" className="dark:bg-gray-700 dark:text-gray-100">AI Enabled</option>
															</select>
														</div>
														<div className="md:col-span-2">
															<label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
															<textarea 
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																rows={2}
																value={planDescription} 
																onChange={e => setPlanDescription(e.target.value)}
															/>
														</div>
														<div className="flex items-center space-x-2">
															<input
																type="checkbox"
																id={`active-${plan.id}`}
																checked={planIsActive}
																onChange={e => setPlanIsActive(e.target.checked)}
																className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
															/>
															<label htmlFor={`active-${plan.id}`} className="text-sm font-medium text-gray-700">
																Active
															</label>
														</div>
													</div>
													<div className="flex space-x-2">
														<button
															onClick={() => updatePlan(plan.id)}
															className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
														>
															Save
														</button>
														<button
															onClick={cancelEditPlan}
															className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
														>
															Cancel
														</button>
													</div>
												</div>
											) : (
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="flex items-center space-x-3">
															<h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
															<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																plan.isActive 
																	? 'bg-green-100 text-green-800' 
																	: 'bg-red-100 text-red-800'
															}`}>
																{plan.isActive ? 'Active' : 'Inactive'}
															</span>
														</div>
														{plan.description && (
															<p className="text-sm text-gray-600 mt-1">{plan.description}</p>
														)}
														<div className="flex flex-wrap gap-2 mt-2">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																{formatPrice(plan.priceCents)}
															</span>
															<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																plan.planType === 'AI_ENABLED' 
																	? 'bg-purple-100 text-purple-800' 
																	: 'bg-gray-100 text-gray-800'
															}`}>
																{plan.planType === 'AI_ENABLED' ? 'AI Enabled' : 'Manual'}
															</span>
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																{plan._count?.subscriptions || 0} subscribers
															</span>
														</div>
													</div>
													<div className="flex space-x-2">
														<button 
															onClick={() => startEditPlan(plan)}
															className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
															title="Edit plan"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
														</button>
														<button 
															onClick={() => deletePlan(plan.id, plan.name)}
															className="p-2 text-gray-400 hover:text-red-600 transition-colors"
															title="Delete plan"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														</button>
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Subscriptions Tab */}
					{activeTab === 'subscriptions' && (
						<div className="space-y-6">
							{/* Filters */}
							<div className="bg-white rounded-lg shadow p-6">
								<div className="flex items-center space-x-4">
									<input
										type="text"
										placeholder="Search subscriptions..."
										value={searchText}
										onChange={e => handleSearch(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
									/>
									<select
										value={selectedStatus}
										onChange={e => setSelectedStatus(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
									>
										<option value="">All Status</option>
										<option value="ACTIVE">Active</option>
										<option value="CANCELED">Canceled</option>
										<option value="EXPIRED">Expired</option>
									</select>
									<button
										onClick={clearFilters}
										className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
									>
										Clear Filters
									</button>
								</div>
							</div>

							{/* Subscriptions List */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">All Subscriptions</h3>
								</div>
								
								<div className="divide-y divide-gray-200">
									{subscriptions.map((subscription) => (
										<div key={subscription.id} className="px-6 py-4">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center space-x-3">
														<h4 className="text-lg font-medium text-gray-900">{subscription.user.fullName}</h4>
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															subscription.status === 'ACTIVE' 
																? 'bg-green-100 text-green-800'
																: subscription.status === 'CANCELED'
																? 'bg-red-100 text-red-800'
																: 'bg-gray-100 text-gray-800'
														}`}>
															{subscription.status}
														</span>
													</div>
													<p className="text-sm text-gray-600 mt-1">{subscription.user.email}</p>
													<div className="flex flex-wrap gap-2 mt-2">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
															{subscription.plan.name}
														</span>
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
															{formatPrice(subscription.plan.priceCents)}
														</span>
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															subscription.plan.planType === 'AI_ENABLED' 
																? 'bg-indigo-100 text-indigo-800' 
																: 'bg-gray-100 text-gray-800'
														}`}>
															{subscription.plan.planType === 'AI_ENABLED' ? 'AI Enabled' : 'Manual'}
														</span>
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
															Started: {formatDate(subscription.startedAt)}
														</span>
														{subscription.endsAt && (
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
																Ends: {formatDate(subscription.endsAt)}
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="bg-white rounded-lg shadow px-6 py-4">
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
			</AdminLayout>
		</ProtectedRoute>
	);
} 