import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api, { storeToken } from '../lib/api';

export default function LoginScreen({ navigation }: any) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Error', 'Please fill all fields');
			return;
		}
		setLoading(true);
		try {
			const { data } = await api.post('/auth/login', { email, password });
			await storeToken(data.access_token);
			navigation.replace('Practice');
		} catch (error: any) {
			Alert.alert('Error', error?.response?.data?.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>JEE Practice</Text>
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
				<Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate('Register')}>
				<Text style={styles.link}>Don't have an account? Register</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 30,
		color: '#333',
	},
	input: {
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	button: {
		backgroundColor: '#007AFF',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
	},
	buttonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: 'bold',
	},
	link: {
		color: '#007AFF',
		textAlign: 'center',
	},
}); 