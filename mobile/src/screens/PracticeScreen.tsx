import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api, { clearToken } from '../lib/api';

export default function PracticeScreen({ navigation }: any) {
	const [analytics, setAnalytics] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		loadAnalytics();
	}, []);

	const loadAnalytics = async () => {
		try {
			const [subjects, topics, subtopics] = await Promise.all([
				api.get('/exams/analytics/subjects'),
				api.get('/exams/analytics/topics'),
				api.get('/exams/analytics/subtopics'),
			]);
			setAnalytics({ subjects: subjects.data, topics: topics.data, subtopics: subtopics.data });
		} catch (error) {
			console.log('Failed to load analytics');
		}
	};

	const startPractice = () => {
		Alert.alert('Start Practice', 'Enter a paper ID to start practice', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Start', onPress: () => {
				Alert.prompt('Paper ID', 'Enter the paper ID:', [
					{ text: 'Cancel', style: 'cancel' },
					{ text: 'Start', onPress: (paperId) => {
						if (paperId) {
							api.post(`/exams/papers/${paperId}/start`)
								.then(({ data }) => {
									Alert.alert('Started', `Submission ID: ${data.submissionId}\nQuestions: ${data.questionIds?.length || 0}`);
								})
								.catch((error) => {
									Alert.alert('Error', error?.response?.data?.message || 'Failed to start practice');
								});
						}
					}}
				]);
			}}
		]);
	};

	const handleLogout = async () => {
		await clearToken();
		navigation.replace('Login');
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Practice Dashboard</Text>
				<TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
					<Text style={styles.logoutText}>Logout</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.startButton} onPress={startPractice}>
				<Text style={styles.startButtonText}>Start Practice Paper</Text>
			</TouchableOpacity>

			{analytics && (
				<View style={styles.analytics}>
					<Text style={styles.sectionTitle}>Your Performance</Text>
					
					<Text style={styles.subtitle}>By Subject</Text>
					{analytics.subjects?.map((s: any) => (
						<View key={s.subjectId} style={styles.statRow}>
							<Text style={styles.statLabel}>Subject {s.subjectId}</Text>
							<Text style={styles.statValue}>{s.correct}/{s.total} ({Math.round((s.correct/s.total)*100)}%)</Text>
						</View>
					))}

					<Text style={styles.subtitle}>By Topic</Text>
					{analytics.topics?.map((t: any) => (
						<View key={t.topicId} style={styles.statRow}>
							<Text style={styles.statLabel}>Topic {t.topicId}</Text>
							<Text style={styles.statValue}>{t.correct}/{t.total} ({Math.round((t.correct/t.total)*100)}%)</Text>
						</View>
					))}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
	},
	logoutButton: {
		padding: 8,
	},
	logoutText: {
		color: '#FF3B30',
		fontWeight: '500',
	},
	startButton: {
		backgroundColor: '#007AFF',
		margin: 20,
		padding: 15,
		borderRadius: 8,
	},
	startButtonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: 'bold',
		fontSize: 16,
	},
	analytics: {
		backgroundColor: 'white',
		margin: 20,
		padding: 20,
		borderRadius: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '600',
		marginTop: 15,
		marginBottom: 10,
		color: '#666',
	},
	statRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	statLabel: {
		color: '#333',
	},
	statValue: {
		color: '#007AFF',
		fontWeight: '500',
	},
}); 