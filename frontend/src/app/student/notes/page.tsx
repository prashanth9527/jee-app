'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Calendar, BookOpen, Tag, Search, Filter } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import api from '@/lib/api';

interface NoteItem {
  id: string;
  contentId: string;
  contentTitle: string;
  subject: string;
  topic: string;
  subtopic: string;
  notes: {
    notes: string;
    lastUpdated: string;
    version: number;
  };
  lastUpdated: string;
}

function NotesPageContent() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const { showError } = useToastContext();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/content-learning/notes');
      setNotes(response.data || []);
      
      // Extract unique subjects
      const uniqueSubjects = [...new Set(response.data?.map((note: NoteItem) => note.subject) || [])] as string[];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showError('Failed to load notes', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.subtopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.notes.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filterSubject || note.subject === filterSubject;
    
    return matchesSearch && matchesSubject;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
              <p className="text-gray-600 mt-2">
                All your saved notes from learning content
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span>{notes.length} notes</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notes, subjects, topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterSubject ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterSubject 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start taking notes while learning content to see them here.'
              }
            </p>
            {!searchTerm && !filterSubject && (
              <Link
                href="/student/lms"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {note.contentTitle}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          <span>{note.subject}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatDate(note.lastUpdated)}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/notes/${note.contentId}`}
                      className="flex items-center px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Edit</span>
                    </Link>
                  </div>

                  {/* Content Path */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{note.subject}</span>
                      <span className="mx-2">›</span>
                      <span>{note.topic}</span>
                      <span className="mx-2">›</span>
                      <span>{note.subtopic}</span>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {truncateText(note.notes.notes)}
                    </p>
                    {note.notes.notes.length > 150 && (
                      <Link
                        href={`/student/notes/${note.contentId}`}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2 inline-block"
                      >
                        Read more...
                      </Link>
                    )}
                  </div>

                  {/* Version Info */}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Version {note.notes.version}</span>
                    <span>Last updated: {formatDate(note.notes.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <StudentLayout>
        <NotesPageContent />
      </StudentLayout>
    </ProtectedRoute>
  );
}
