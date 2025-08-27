import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../lib/api';

export default function RegisterScreen({ navigation }: any) {
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
		if (!email || !fullName || !password) {
			Alert.alert('Error', 'Please fill required fields');
			return;
		}
		setLoading(true);
		try {
			await api.post('/auth/register', { email, fullName, phone, password });
			Alert.alert('Success', 'Registration successful! Please login.', [
				{ text: 'OK', onPress: () => navigation.navigate('Login') }
			]);
		} catch (error: any) {
			Alert.alert('Error', error?.response?.data?.message || 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>
			<TextInput
				style={styles.input}
				placeholder="Full Name *"
				value={fullName}
				onChangeText={setFullName}
			/>
			<TextInput
				style={styles.input}
				placeholder="Email *"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Phone (optional)"
				value={phone}
				onChangeText={setPhone}
				keyboardType="phone-pad"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password *"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
				<Text style={styles.buttonText}>{loading ? 'Creating...' : 'Register'}</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate('Login')}>
				<Text style={styles.link}>Already have an account? Login</Text>
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