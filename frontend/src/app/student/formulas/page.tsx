'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Calculator, Tag, Filter, Star, Eye, Download } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import MathFormula from '@/components/MathFormula';

interface Formula {
  id: string;
  title: string;
  formula: string;
  description?: string;
  subject?: string;
  tags: string[];
  topicId?: string;
  subtopicId?: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
  suggestedQuestions?: Question[];
}

interface Question {
  id: string;
  stem: string;
  difficulty: string;
  subject: string;
  topicId?: string;
  subtopicId?: string;
}

export default function StudentFormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [bookmarkedFormulas, setBookmarkedFormulas] = useState<Set<string>>(new Set());

  const subjects = [
    { value: '', label: 'All Subjects' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Mathematics', label: 'Mathematics' },
  ];

  useEffect(() => {
    fetchFormulas();
    loadBookmarks();
  }, []);

  useEffect(() => {
    // Extract all unique tags
    const tags = new Set<string>();
    formulas.forEach(formula => {
      formula.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags).sort());
  }, [formulas]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedTag) params.append('tags', selectedTag);

      const response = await fetch(`/api/formulas?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFormulas(data.formulas || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = () => {
    const bookmarks = JSON.parse(localStorage.getItem('formulaBookmarks') || '[]');
    setBookmarkedFormulas(new Set(bookmarks));
  };

  const toggleBookmark = (formulaId: string) => {
    const newBookmarks = new Set(bookmarkedFormulas);
    if (newBookmarks.has(formulaId)) {
      newBookmarks.delete(formulaId);
    } else {
      newBookmarks.add(formulaId);
    }
    
    setBookmarkedFormulas(newBookmarks);
    localStorage.setItem('formulaBookmarks', JSON.stringify(Array.from(newBookmarks)));
  };

  const handleFormulaClick = async (formula: Formula) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/formulas/${formula.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedFormula(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching formula details:', error);
    }
  };

  const filteredFormulas = formulas.filter(formula => {
    const matchesSearch = formula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formula.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formula.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formula.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !selectedSubject || formula.subject === selectedSubject;
    const matchesTag = !selectedTag || formula.tags.includes(selectedTag);
    return matchesSearch && matchesSubject && matchesTag;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'bg-red-100 text-red-800';
      case 'Chemistry': return 'bg-blue-100 text-blue-800';
      case 'Mathematics': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              Formula Bank
            </h1>
            <p className="text-gray-600 text-lg">
              Master your studies with comprehensive formula collection and practice questions
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search formulas by title, content, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {subjects.map(subject => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={fetchFormulas}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </button>
              
              {(searchTerm || selectedSubject || selectedTag) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('');
                    setSelectedTag('');
                    fetchFormulas();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Formulas</p>
                  <p className="text-2xl font-bold text-gray-900">{formulas.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Physics</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formulas.filter(f => f.subject === 'Physics').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Chemistry</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formulas.filter(f => f.subject === 'Chemistry').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Mathematics</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formulas.filter(f => f.subject === 'Mathematics').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFormulas.map((formula) => (
              <div
                key={formula.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleFormulaClick(formula)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {formula.title}
                      </h3>
                      {formula.subject && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getSubjectColor(formula.subject)}`}>
                          {formula.subject}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(formula.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        bookmarkedFormulas.has(formula.id)
                          ? 'text-yellow-500 bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={bookmarkedFormulas.has(formula.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      <Star className={`h-5 w-5 ${bookmarkedFormulas.has(formula.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <MathFormula formula={formula.formula} />
                    </div>
                  </div>
                  
                  {formula.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {formula.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                      {formula.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formula.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {formula.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{formula.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>View Details</span>
                    <Eye className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredFormulas.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No formulas found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedSubject || selectedTag ? 'Try adjusting your search criteria.' : 'No formulas available at the moment.'}
              </p>
            </div>
          )}
        </div>

        {/* Formula Detail Modal */}
        {showModal && selectedFormula && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedFormula.title}</h3>
                    {selectedFormula.subject && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getSubjectColor(selectedFormula.subject)}`}>
                        {selectedFormula.subject}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Formula Display */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center">
                      <div className="mb-2">
                        <MathFormula formula={selectedFormula.formula} />
                      </div>
                      <p className="text-gray-600">Mathematical Expression</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedFormula.description && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                      <div 
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: selectedFormula.description }}
                      />
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFormula.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Practice Questions */}
                  {selectedFormula.suggestedQuestions && selectedFormula.suggestedQuestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Suggested Practice Questions</h4>
                      <div className="space-y-3">
                        {selectedFormula.suggestedQuestions.slice(0, 5).map((question) => (
                          <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-800 mb-2">{question.stem}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                              <span className="text-gray-500">{question.subject}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                  <button
                    onClick={() => toggleBookmark(selectedFormula.id)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      bookmarkedFormulas.has(selectedFormula.id)
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${bookmarkedFormulas.has(selectedFormula.id) ? 'fill-current' : ''}`} />
                    {bookmarkedFormulas.has(selectedFormula.id) ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </StudentLayout>
    </ProtectedRoute>
  );
}