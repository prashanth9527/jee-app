import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	RefreshControl,
	TextInput,
} from 'react-native';
import { bookmarkApi } from '../lib/api';

interface Bookmark {
	id: string;
	createdAt: string;
	question: {
		id: string;
		stem: string;
		explanation?: string;
		tip_formula?: string;
		difficulty: 'EASY' | 'MEDIUM' | 'HARD';
		yearAppeared?: number;
		isPreviousYear: boolean;
		isAIGenerated: boolean;
		subject?: {
			id: string;
			name: string;
		};
		topic?: {
			id: string;
			name: string;
		};
		options: {
			id: string;
			text: string;
			isCorrect: boolean;
			order: number;
		}[];
	};
}

interface BookmarksResponse {
	bookmarks: Bookmark[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export default function BookmarksScreen({ navigation }: any) {
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);

	useEffect(() => {
		fetchBookmarks();
	}, [currentPage]);

	useEffect(() => {
		// Filter bookmarks based on search term
		if (searchTerm.trim() === '') {
			setFilteredBookmarks(bookmarks);
		} else {
			const filtered = bookmarks.filter(
				(bookmark) =>
					bookmark.question.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
					bookmark.question.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					bookmark.question.topic?.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
			setFilteredBookmarks(filtered);
		}
	}, [bookmarks, searchTerm]);

	const fetchBookmarks = async () => {
		try {
			setLoading(true);
			const response = await bookmarkApi.getUserBookmarks(currentPage, 20);
			const data: BookmarksResponse = response.data;
			
			if (currentPage === 1) {
				setBookmarks(data.bookmarks);
			} else {
				setBookmarks(prev => [...prev, ...data.bookmarks]);
			}
			
			setTotalPages(data.pagination.totalPages);
		} catch (error: any) {
			console.error('Error fetching bookmarks:', error);
			Alert.alert('Error', error?.response?.data?.message || 'Failed to load bookmarks');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		setCurrentPage(1);
		fetchBookmarks();
	};

	const loadMore = () => {
		if (currentPage < totalPages && !loading) {
			setCurrentPage(prev => prev + 1);
		}
	};

	const removeBookmark = async (bookmarkId: string, questionId: string) => {
		Alert.alert(
			'Remove Bookmark',
			'Are you sure you want to remove this question from your bookmarks?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						try {
							await bookmarkApi.remove(questionId);
							setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
							Alert.alert('Success', 'Bookmark removed successfully');
						} catch (error: any) {
							console.error('Error removing bookmark:', error);
							Alert.alert('Error', error?.response?.data?.message || 'Failed to remove bookmark');
						}
					},
				},
			]
		);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'EASY': return '#10B981';
			case 'MEDIUM': return '#F59E0B';
			case 'HARD': return '#EF4444';
			default: return '#6B7280';
		}
	};

	const renderBookmark = ({ item }: { item: Bookmark }) => (
		<View style={styles.bookmarkCard}>
			<View style={styles.bookmarkHeader}>
				<View style={styles.badgeContainer}>
					{item.question.yearAppeared && (
						<View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
							<Text style={styles.badgeText}>{item.question.yearAppeared}</Text>
						</View>
					)}
					<View style={[styles.badge, { backgroundColor: getDifficultyColor(item.question.difficulty) }]}>
						<Text style={styles.badgeText}>{item.question.difficulty}</Text>
					</View>
					{item.question.subject && (
						<View style={[styles.badge, { backgroundColor: '#6B7280' }]}>
							<Text style={styles.badgeText}>{item.question.subject.name}</Text>
						</View>
					)}
					{item.question.isAIGenerated && (
						<View style={[styles.badge, { backgroundColor: '#8B5CF6' }]}>
							<Text style={styles.badgeText}>AI</Text>
						</View>
					)}
				</View>
				
				<TouchableOpacity
					onPress={() => removeBookmark(item.id, item.question.id)}
					style={styles.removeButton}
				>
					<Text style={styles.removeButtonText}>Remove</Text>
				</TouchableOpacity>
			</View>
			
			<Text style={styles.questionText}>{item.question.stem}</Text>
			
			<View style={styles.optionsContainer}>
				{item.question.options.map((option) => (
					<View
						key={option.id}
						style={[
							styles.optionItem,
							option.isCorrect && styles.correctOption,
						]}
					>
						<Text
							style={[
								styles.optionText,
								option.isCorrect && styles.correctOptionText,
							]}
						>
							{option.text}
						</Text>
						{option.isCorrect && <Text style={styles.correctLabel}>(Correct)</Text>}
					</View>
				))}
			</View>
			
			{item.question.tip_formula && (
				<View style={styles.tipContainer}>
					<Text style={styles.tipTitle}>💡 Tips & Formulas</Text>
					<Text style={styles.tipText}>{item.question.tip_formula}</Text>
				</View>
			)}
			
			{item.question.explanation && (
				<View style={styles.explanationContainer}>
					<Text style={styles.explanationTitle}>📖 Explanation</Text>
					<Text style={styles.explanationText}>{item.question.explanation}</Text>
				</View>
			)}
			
			<Text style={styles.dateText}>
				Bookmarked on {new Date(item.createdAt).toLocaleDateString()}
			</Text>
		</View>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Text style={styles.emptyStateIcon}>📚</Text>
			<Text style={styles.emptyStateTitle}>No bookmarks found</Text>
			<Text style={styles.emptyStateText}>
				{searchTerm.trim() === ''
					? 'Start bookmarking questions from practice tests to see them here.'
					: 'Try adjusting your search to see more results.'}
			</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => navigation.goBack()}
					style={styles.backButton}
				>
					<Text style={styles.backButtonText}>← Back</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Bookmarks</Text>
				<View style={styles.placeholder} />
			</View>
			
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search bookmarks..."
					value={searchTerm}
					onChangeText={setSearchTerm}
					placeholderTextColor="#9CA3AF"
				/>
			</View>
			
			<FlatList
				data={filteredBookmarks}
				renderItem={renderBookmark}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				onEndReached={loadMore}
				onEndReachedThreshold={0.1}
				ListEmptyComponent={!loading ? renderEmptyState : null}
				ListFooterComponent={
					loading && currentPage > 1 ? (
						<View style={styles.loadingFooter}>
							<ActivityIndicator size="small" color="#3B82F6" />
						</View>
					) : null
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	backButton: {
		padding: 8,
	},
	backButtonText: {
		fontSize: 16,
		color: '#3B82F6',
		fontWeight: '500',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
	},
	placeholder: {
		width: 60,
	},
	searchContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	searchInput: {
		height: 40,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		borderRadius: 8,
		paddingHorizontal: 12,
		fontSize: 16,
		backgroundColor: '#F9FAFB',
	},
	listContainer: {
		padding: 16,
	},
	bookmarkCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	bookmarkHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	badgeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		flex: 1,
	},
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	badgeText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '500',
	},
	removeButton: {
		backgroundColor: '#EF4444',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	removeButtonText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '500',
	},
	questionText: {
		fontSize: 16,
		color: '#111827',
		lineHeight: 24,
		marginBottom: 12,
	},
	optionsContainer: {
		marginBottom: 12,
	},
	optionItem: {
		backgroundColor: '#F3F4F6',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	correctOption: {
		backgroundColor: '#D1FAE5',
		borderColor: '#10B981',
	},
	optionText: {
		fontSize: 14,
		color: '#374151',
		lineHeight: 20,
	},
	correctOptionText: {
		color: '#065F46',
		fontWeight: '500',
	},
	correctLabel: {
		fontSize: 12,
		color: '#10B981',
		fontWeight: '500',
		marginTop: 4,
	},
	tipContainer: {
		backgroundColor: '#FEF3C7',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#F59E0B',
	},
	tipTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#92400E',
		marginBottom: 4,
	},
	tipText: {
		fontSize: 14,
		color: '#92400E',
		lineHeight: 20,
	},
	explanationContainer: {
		backgroundColor: '#DBEAFE',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#3B82F6',
	},
	explanationTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1E40AF',
		marginBottom: 4,
	},
	explanationText: {
		fontSize: 14,
		color: '#1E40AF',
		lineHeight: 20,
	},
	dateText: {
		fontSize: 12,
		color: '#6B7280',
		textAlign: 'center',
		marginTop: 8,
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyStateIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	emptyStateText: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
		lineHeight: 20,
		paddingHorizontal: 32,
	},
	loadingFooter: {
		paddingVertical: 20,
		alignItems: 'center',
	},
});
