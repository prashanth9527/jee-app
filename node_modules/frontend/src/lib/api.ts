import axios from 'axios';

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001',
});

console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001');



export function setAuthToken(token?: string) {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common['Authorization'];
	}
}

export default api; 