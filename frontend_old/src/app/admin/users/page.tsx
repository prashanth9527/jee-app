'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface User {
	id: string;
	email: string;
	phone?: string;
	emailVerified: boolean;
	phoneVerified: boolean;
	fullName: string;
	role: 'ADMIN' | 'STUDENT';
	createdAt: string;
	updatedAt: string;
	trialStartedAt?: string;
	trialEndsAt?: string;
	_count?: {
		subscriptions: number;
		examSubmissions: number;
	};
	subscriptions?: Array<{
		id: string;
		status: string;
		plan: {
			name: string;
			priceCents: number;
			currency: string;
			interval: string;
		};
	}>;
}

interface Analytics {
	overview: {
		totalUsers: number;
		adminUsers: number;
		studentUsers: number;
		emailVerifiedUsers: number;
		phoneVerifiedUsers: number;
		trialUsers: number;
		subscribedUsers: number;
	};
	recentUsers: Array<{
		id: string;
		fullName: string;
		email: string;
		role: string;
		createdAt: string;
		emailVerified: boolean;
		phoneVerified: boolean;
	}>;
	topExamUsers: Array<{
		id: string;
		fullName: string;
		email: string;
		_count: {
			examSubmissions: number;
		};
	}>;
}

export default function AdminUsersPage() {
	const router = useRouter();
	
	// Data states
	const [users, setUsers] = useState<User[]>([]);
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	
	// Loading states
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
	
	// User management states
	const [editingUser, setEditingUser] = useState<string | null>(null);
	const [editFullName, setEditFullName] = useState('');
	const [editEmail, setEditEmail] = useState('');
	const [editPhone, setEditPhone] = useState('');
	const [editRole, setEditRole] = useState<'ADMIN' | 'STUDENT'>('STUDENT');
	const [editEmailVerified, setEditEmailVerified] = useState(false);
	const [editPhoneVerified, setEditPhoneVerified] = useState(false);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	
	// Filter states
	const [searchText, setSearchText] = useState('');
	const [selectedRole, setSelectedRole] = useState('');
	const [selectedEmailVerified, setSelectedEmailVerified] = useState('');
	const [selectedPhoneVerified, setSelectedPhoneVerified] = useState('');

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if (activeTab === 'users') {
			loadUsers();
		}
	}, [activeTab, currentPage, itemsPerPage, searchText, selectedRole, selectedEmailVerified, selectedPhoneVerified]);

	const loadData = async () => {
		try {
			const [analyticsResponse] = await Promise.all([
				api.get('/admin/users/analytics/overview')
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

	const loadUsers = async () => {
		try {
			const searchParam = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
			const roleParam = selectedRole ? `&role=${selectedRole}` : '';
			const emailParam = selectedEmailVerified ? `&emailVerified=${selectedEmailVerified}` : '';
			const phoneParam = selectedPhoneVerified ? `&phoneVerified=${selectedPhoneVerified}` : '';
			const response = await api.get(`/admin/users?page=${currentPage}&limit=${itemsPerPage}${searchParam}${roleParam}${emailParam}${phoneParam}`);
			
			setUsers(response.data.users);
			if (response.data.pagination) {
				setCurrentPage(response.data.pagination.currentPage);
				setTotalPages(response.data.pagination.totalPages);
				setTotalItems(response.data.pagination.totalItems);
			}
		} catch (error) {
			console.error('Error fetching users:', error);
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
		setSelectedRole('');
		setSelectedEmailVerified('');
		setSelectedPhoneVerified('');
		setCurrentPage(1);
	};

	const startEditUser = (user: User) => {
		setEditingUser(user.id);
		setEditFullName(user.fullName);
		setEditEmail(user.email);
		setEditPhone(user.phone || '');
		setEditRole(user.role);
		setEditEmailVerified(user.emailVerified);
		setEditPhoneVerified(user.phoneVerified);
	};

	const cancelEditUser = () => {
		setEditingUser(null);
		setEditFullName('');
		setEditEmail('');
		setEditPhone('');
		setEditRole('STUDENT');
		setEditEmailVerified(false);
		setEditPhoneVerified(false);
	};

	const updateUser = async (userId: string) => {
		if (!editFullName.trim() || !editEmail.trim()) {
			Swal.fire({
				title: 'Error!',
				text: 'Full name and email are required.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
			return;
		}

		try {
			await api.put(`/admin/users/${userId}`, {
				fullName: editFullName.trim(),
				email: editEmail.trim(),
				phone: editPhone.trim() || undefined,
				role: editRole,
				emailVerified: editEmailVerified,
				phoneVerified: editPhoneVerified
			});
			
			Swal.fire({
				title: 'Success!',
				text: 'User updated successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			setEditingUser(null);
			loadUsers();
			loadData(); // Refresh analytics
		} catch (error: any) {
			console.error('Error updating user:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to update user.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const deleteUser = async (userId: string, userName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You are about to delete "${userName}". This action cannot be undone!`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel'
		});

		if (result.isConfirmed) {
			try {
				await api.delete(`/admin/users/${userId}`);
				
				Swal.fire({
					title: 'Deleted!',
					text: 'User has been deleted successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});

				loadUsers();
				loadData(); // Refresh analytics
			} catch (error: any) {
				console.error('Error deleting user:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to delete user.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const verifyEmail = async (userId: string) => {
		try {
			await api.post(`/admin/users/${userId}/verify-email`);
			
			Swal.fire({
				title: 'Success!',
				text: 'Email verified successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			loadUsers();
			loadData(); // Refresh analytics
		} catch (error: any) {
			console.error('Error verifying email:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to verify email.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const verifyPhone = async (userId: string) => {
		try {
			await api.post(`/admin/users/${userId}/verify-phone`);
			
			Swal.fire({
				title: 'Success!',
				text: 'Phone verified successfully.',
				icon: 'success',
				timer: 2000,
				showConfirmButton: false
			});
			
			loadUsers();
			loadData(); // Refresh analytics
		} catch (error: any) {
			console.error('Error verifying phone:', error);
			Swal.fire({
				title: 'Error!',
				text: error.response?.data?.message || 'Failed to verify phone.',
				icon: 'error',
				confirmButtonText: 'OK'
			});
		}
	};

	const startTrial = async (userId: string) => {
		const result = await Swal.fire({
			title: 'Start Trial',
			text: 'How many days should the trial last?',
			input: 'number',
			inputValue: 7,
			inputAttributes: {
				min: '1',
				max: '30'
			},
			showCancelButton: true,
			confirmButtonText: 'Start Trial',
			cancelButtonText: 'Cancel'
		});

		if (result.isConfirmed) {
			try {
				await api.post(`/admin/users/${userId}/start-trial`, {
					days: parseInt(result.value) || 7
				});
				
				Swal.fire({
					title: 'Success!',
					text: 'Trial started successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});
				
				loadUsers();
				loadData(); // Refresh analytics
			} catch (error: any) {
				console.error('Error starting trial:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to start trial.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const endTrial = async (userId: string) => {
		const result = await Swal.fire({
			title: 'End Trial',
			text: 'Are you sure you want to end this user\'s trial?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'End Trial',
			cancelButtonText: 'Cancel'
		});

		if (result.isConfirmed) {
			try {
				await api.post(`/admin/users/${userId}/end-trial`);
				
				Swal.fire({
					title: 'Success!',
					text: 'Trial ended successfully.',
					icon: 'success',
					timer: 2000,
					showConfirmButton: false
				});
				
				loadUsers();
				loadData(); // Refresh analytics
			} catch (error: any) {
				console.error('Error ending trial:', error);
				Swal.fire({
					title: 'Error!',
					text: error.response?.data?.message || 'Failed to end trial.',
					icon: 'error',
					confirmButtonText: 'OK'
				});
			}
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const formatPrice = (priceCents: number, currency: string) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency.toUpperCase()
		}).format(priceCents / 100);
	};

	const isTrialActive = (trialEndsAt?: string) => {
		if (!trialEndsAt) return false;
		return new Date(trialEndsAt) > new Date();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading users...</p>
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
							<h1 className="text-2xl font-bold text-gray-900">Users</h1>
							<p className="text-gray-600">Manage user accounts, roles, and verification status</p>
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
								onClick={() => setActiveTab('users')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'users'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								Users
							</button>
						</nav>
					</div>

					{/* Overview Tab */}
					{activeTab === 'overview' && analytics && (
						<div className="space-y-6">
							{/* Statistics Cards */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-blue-100 rounded-lg">
											<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Total Users</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
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
											<p className="text-sm font-semibold text-gray-700">Active Subscribers</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.subscribedUsers}</p>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Trial Users</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.trialUsers}</p>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-lg shadow p-6">
									<div className="flex items-center">
										<div className="p-2 bg-purple-100 rounded-lg">
											<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
											</svg>
										</div>
										<div className="ml-4">
											<p className="text-sm font-semibold text-gray-700">Admins</p>
											<p className="text-2xl font-bold text-gray-900">{analytics.overview.adminUsers}</p>
										</div>
									</div>
								</div>
							</div>

							{/* Recent Users */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
								</div>
								<div className="divide-y divide-gray-200">
									{analytics.recentUsers.map((user) => (
										<div key={user.id} className="px-6 py-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-gray-900">{user.fullName}</p>
													<p className="text-sm text-gray-500">{user.email}</p>
												</div>
												<div className="text-right">
													<div className="flex items-center space-x-2">
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															user.role === 'ADMIN' 
																? 'bg-purple-100 text-purple-800' 
																: 'bg-blue-100 text-blue-800'
														}`}>
															{user.role}
														</span>
														{user.emailVerified && (
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																Email ✓
															</span>
														)}
														{user.phoneVerified && (
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																Phone ✓
															</span>
														)}
													</div>
													<p className="text-sm text-gray-500 mt-1">{formatDate(user.createdAt)}</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Top Exam Users */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">Top Exam Users</h3>
								</div>
								<div className="divide-y divide-gray-200">
									{analytics.topExamUsers.map((user) => (
										<div key={user.id} className="px-6 py-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-gray-900">{user.fullName}</p>
													<p className="text-sm text-gray-500">{user.email}</p>
												</div>
												<div className="text-right">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{user._count.examSubmissions} exams
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Users Tab */}
					{activeTab === 'users' && (
						<div className="space-y-6">
							{/* Filters */}
							<div className="bg-white rounded-lg shadow p-6">
								<div className="flex items-center space-x-4">
									<input
										type="text"
										placeholder="Search users..."
										value={searchText}
										onChange={e => handleSearch(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
									/>
									<select
										value={selectedRole}
										onChange={e => setSelectedRole(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
									>
										<option value="">All Roles</option>
										<option value="ADMIN">Admin</option>
										<option value="STUDENT">Student</option>
									</select>
									<select
										value={selectedEmailVerified}
										onChange={e => setSelectedEmailVerified(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
									>
										<option value="">All Email Status</option>
										<option value="true">Verified</option>
										<option value="false">Not Verified</option>
									</select>
									<select
										value={selectedPhoneVerified}
										onChange={e => setSelectedPhoneVerified(e.target.value)}
										className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
									>
										<option value="">All Phone Status</option>
										<option value="true">Verified</option>
										<option value="false">Not Verified</option>
									</select>
									<button
										onClick={clearFilters}
										className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
									>
										Clear Filters
									</button>
								</div>
							</div>

							{/* Users List */}
							<div className="bg-white rounded-lg shadow">
								<div className="px-6 py-4 border-b border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900">All Users</h3>
								</div>
								
								<div className="divide-y divide-gray-200">
									{users.map((user) => (
										<div key={user.id} className="px-6 py-4">
											{editingUser === user.id ? (
												<div className="space-y-4">
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
															<input 
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={editFullName} 
																onChange={e => setEditFullName(e.target.value)}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
															<input 
																type="email"
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={editEmail} 
																onChange={e => setEditEmail(e.target.value)}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
															<input 
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium" 
																value={editPhone} 
																onChange={e => setEditPhone(e.target.value)}
															/>
														</div>
														<div>
															<label className="block text-sm font-semibold text-gray-800 mb-2">Role</label>
															<select
																className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
																value={editRole}
																onChange={e => setEditRole(e.target.value as 'ADMIN' | 'STUDENT')}
															>
																<option value="STUDENT">Student</option>
																<option value="ADMIN">Admin</option>
															</select>
														</div>
													</div>
													<div className="flex items-center space-x-4">
														<label className="flex items-center space-x-2">
															<input
																type="checkbox"
																checked={editEmailVerified}
																onChange={e => setEditEmailVerified(e.target.checked)}
																className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
															/>
															<span className="text-sm font-medium text-gray-700">Email Verified</span>
														</label>
														<label className="flex items-center space-x-2">
															<input
																type="checkbox"
																checked={editPhoneVerified}
																onChange={e => setEditPhoneVerified(e.target.checked)}
																className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
															/>
															<span className="text-sm font-medium text-gray-700">Phone Verified</span>
														</label>
													</div>
													<div className="flex space-x-2">
														<button
															onClick={() => updateUser(user.id)}
															className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
														>
															Save
														</button>
														<button
															onClick={cancelEditUser}
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
															<h4 className="text-lg font-medium text-gray-900">{user.fullName}</h4>
															<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																user.role === 'ADMIN' 
																	? 'bg-purple-100 text-purple-800' 
																	: 'bg-blue-100 text-blue-800'
															}`}>
																{user.role}
															</span>
														</div>
														<p className="text-sm text-gray-600 mt-1">{user.email}</p>
														{user.phone && (
															<p className="text-sm text-gray-600">{user.phone}</p>
														)}
														<div className="flex flex-wrap gap-2 mt-2">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																Joined: {formatDate(user.createdAt)}
															</span>
															{user.emailVerified && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	Email ✓
																</span>
															)}
															{user.phoneVerified && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	Phone ✓
																</span>
															)}
															{isTrialActive(user.trialEndsAt) && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
																	Trial Active
																</span>
															)}
															{user._count?.subscriptions && user._count.subscriptions > 0 && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																	{user._count.subscriptions} subscription{user._count.subscriptions !== 1 ? 's' : ''}
																</span>
															)}
															{user._count?.examSubmissions && user._count.examSubmissions > 0 && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
																	{user._count.examSubmissions} exam{user._count.examSubmissions !== 1 ? 's' : ''}
																</span>
															)}
														</div>
													</div>
													<div className="flex space-x-2">
														<button 
															onClick={() => startEditUser(user)}
															className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
															title="Edit user"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
														</button>
														{!user.emailVerified && (
															<button 
																onClick={() => verifyEmail(user.id)}
																className="p-2 text-gray-400 hover:text-green-600 transition-colors"
																title="Verify email"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
																</svg>
															</button>
														)}
														{user.phone && !user.phoneVerified && (
															<button 
																onClick={() => verifyPhone(user.id)}
																className="p-2 text-gray-400 hover:text-green-600 transition-colors"
																title="Verify phone"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
																</svg>
															</button>
														)}
														{!isTrialActive(user.trialEndsAt) && (
															<button 
																onClick={() => startTrial(user.id)}
																className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
																title="Start trial"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
																</svg>
															</button>
														)}
														{isTrialActive(user.trialEndsAt) && (
															<button 
																onClick={() => endTrial(user.id)}
																className="p-2 text-gray-400 hover:text-red-600 transition-colors"
																title="End trial"
															>
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																</svg>
															</button>
														)}
														<button 
															onClick={() => deleteUser(user.id, user.fullName)}
															className="p-2 text-gray-400 hover:text-red-600 transition-colors"
															title="Delete user"
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