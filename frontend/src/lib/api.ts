import axios from 'axios';

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001',
});

console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001');

// Add request interceptor to set token from localStorage
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		console.log('API Interceptor - Token exists:', !!token);
		console.log('API Interceptor - Request URL:', config.url);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
			console.log('API Interceptor - Authorization header set');
		} else {
			console.log('API Interceptor - No token found');
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Add response interceptor for token expiration handling
api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Handle 401 Unauthorized errors (token expired or invalid)
		if (error.response?.status === 401) {
			console.log('API Interceptor: Token expired or invalid');
			
			// Clear token from localStorage
			localStorage.removeItem('token');
			
			// Clear Authorization header
			delete api.defaults.headers.common['Authorization'];
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