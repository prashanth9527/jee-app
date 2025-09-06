import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3001',
});

export function setAuthToken(token?: string) {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common['Authorization'];
	}
}

export async function loadStoredToken() {
	try {
		const token = await AsyncStorage.getItem('token');
		if (token) setAuthToken(token);
		return token;
	} catch {
		return null;
	}
}

export async function storeToken(token: string) {
	try {
		await AsyncStorage.setItem('token', token);
		setAuthToken(token);
	} catch {}
}

export async function clearToken() {
	try {
		await AsyncStorage.removeItem('token');
		setAuthToken();
	} catch {}
}

// Bookmark API functions
export const bookmarkApi = {
	// Create bookmark
	create: (questionId: string) => api.post(`/bookmarks/${questionId}`),
	
	// Remove bookmark
	remove: (questionId: string) => api.delete(`/bookmarks/${questionId}`),
	
	// Get user bookmarks
	getUserBookmarks: (page: number = 1, limit: number = 20) => 
		api.get(`/bookmarks?page=${page}&limit=${limit}`),
	
	// Check if question is bookmarked
	isBookmarked: (questionId: string) => 
		api.get(`/bookmarks/status/${questionId}`),
	
	// Get bookmark status for multiple questions
	getBookmarkStatus: (questionIds: string[]) => 
		api.post('/bookmarks/status/batch', { questionIds }),
	
	// Get bookmarks by subject
	getBySubject: (subjectId: string) => 
		api.get(`/bookmarks/subject/${subjectId}`),
	
	// Get bookmarks by topic
	getByTopic: (topicId: string) => 
		api.get(`/bookmarks/topic/${topicId}`),
};

export default api; 