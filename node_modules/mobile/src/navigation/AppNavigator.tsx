import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PracticeScreen from '../screens/PracticeScreen';
import BookmarksScreen from '../screens/BookmarksScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="Register" component={RegisterScreen} />
				<Stack.Screen name="Practice" component={PracticeScreen} />
				<Stack.Screen name="Bookmarks" component={BookmarksScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
} 