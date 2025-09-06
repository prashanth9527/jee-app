'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';

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
      stream: {
        id: string;
        name: string;
        code: string;
      };
    };
    topic?: {
      id: string;
      name: string;
    };
    subtopic?: {
      id: string;
      name: string;
    };
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      order: number;
    }[];
    tags: {
      tag: {
        id: string;
        name: string;
      };
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

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookmarks();
  }, [currentPage, selectedSubject, selectedDifficulty, searchTerm]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await bookmarkApi.getUserBookmarks(currentPage, 20);
      const data: BookmarksResponse = response.data;
      
      let filteredBookmarks = data.bookmarks;
      
      // Apply filters
      if (selectedSubject) {
        filteredBookmarks = filteredBookmarks.filter(
          bookmark => bookmark.question.subject?.id === selectedSubject
        );
      }
      
      if (selectedDifficulty) {
        filteredBookmarks = filteredBookmarks.filter(
          bookmark => bookmark.question.difficulty === selectedDifficulty
        );
      }
      
      if (searchTerm) {
        filteredBookmarks = filteredBookmarks.filter(
          bookmark => 
            bookmark.question.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookmark.question.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookmark.question.topic?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setBookmarks(filteredBookmarks);
      setTotalPages(data.pagination.totalPages);
      setTotalBookmarks(data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to load bookmarks',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string, questionId: string) => {
    try {
      await bookmarkApi.remove(questionId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      setTotalBookmarks(prev => prev - 1);
      
      Swal.fire({
        title: 'Bookmark Removed',
        text: 'Question removed from bookmarks',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to remove bookmark',
        icon: 'error',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubjects = () => {
    const subjects = new Map();
    bookmarks.forEach(bookmark => {
      if (bookmark.question.subject) {
        subjects.set(bookmark.question.subject.id, bookmark.question.subject);
      }
    });
    return Array.from(subjects.values());
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bookmarks...</p>
              </div>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Bookmarked Questions</h1>
              <p className="mt-2 text-gray-600">
                {totalBookmarks} {totalBookmarks === 1 ? 'question' : 'questions'} bookmarked
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Subjects</option>
                    {getSubjects().map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedSubject('');
                      setSelectedDifficulty('');
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Bookmarks List */}
            {bookmarks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No bookmarks found</h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm || selectedSubject || selectedDifficulty
                    ? 'Try adjusting your filters to see more results.'
                    : 'Start bookmarking questions from practice tests to see them here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {bookmark.question.yearAppeared && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {bookmark.question.yearAppeared}
                            </span>
                          )}
                          <span className={`text-sm px-2 py-1 rounded ${getDifficultyColor(bookmark.question.difficulty)}`}>
                            {bookmark.question.difficulty}
                          </span>
                          {bookmark.question.subject && (
                            <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {bookmark.question.subject.name}
                            </span>
                          )}
                          {bookmark.question.topic && (
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {bookmark.question.topic.name}
                            </span>
                          )}
                          {bookmark.question.isAIGenerated && (
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              AI Generated
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-900 mb-3">{bookmark.question.stem}</p>
                        
                        <div className="space-y-2">
                          {bookmark.question.options.map((option) => (
                            <div key={option.id} className={`p-3 rounded-lg border ${
                              option.isCorrect 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {option.isCorrect && <span className="text-green-600 text-sm">✓</span>}
                                <span className={`text-sm ${
                                  option.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'
                                }`}>
                                  {option.text}
                                </span>
                                {option.isCorrect && <span className="text-xs text-green-600">(Correct)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {bookmark.question.tip_formula && (
                          <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 Tips & Formulas</h4>
                            <p className="text-yellow-800 text-sm">{bookmark.question.tip_formula}</p>
                          </div>
                        )}
                        
                        {bookmark.question.explanation && (
                          <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">📖 Explanation</h4>
                            <p className="text-blue-800 text-sm">{bookmark.question.explanation}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => removeBookmark(bookmark.id, bookmark.question.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                        <span className="text-xs text-gray-500 text-center">
                          {new Date(bookmark.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
