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

export default api; 