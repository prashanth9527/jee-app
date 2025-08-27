import axios from 'axios';

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001',
});

console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001');

// Add response interceptor for token expiration handling
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Handle 401 Unauthorized errors (token expired or invalid)
		if (error.response?.status === 401) {
			console.log('Token expired or invalid, redirecting to login...');
			
			// Clear token from localStorage
			localStorage.removeItem('token');
			
			// Clear Authorization header
			delete api.defaults.headers.common['Authorization'];
			
			// Redirect to login page with user-friendly message
			if (typeof window !== 'undefined') {
				const currentPath = window.location.pathname;
				if (currentPath.startsWith('/admin') || currentPath.startsWith('/student')) {
					// Show user-friendly message
					if (typeof window !== 'undefined' && (window as any).Swal) {
						(window as any).Swal.fire({
							title: 'Session Expired',
							text: 'Your session has expired. Please log in again to continue.',
							icon: 'warning',
							confirmButtonText: 'OK',
							allowOutsideClick: false
						}).then(() => {
							window.location.href = '/login';
						});
					} else {
						alert('Your session has expired. Please log in again.');
						window.location.href = '/login';
					}
				}
			}
		}
		
		return Promise.reject(error);
	}
);

export function setAuthToken(token?: string) {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common['Authorization'];
	}
}

export default api; 