import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredToken } from './src/lib/api';

export default function App() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadStoredToken().finally(() => setIsLoading(false));
	}, []);

	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#007AFF" />
				<Text style={{ marginTop: 10 }}>Loading...</Text>
			</View>
		);
	}

	return <AppNavigator />;
}
