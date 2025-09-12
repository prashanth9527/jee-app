'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Calculator, Tag } from 'lucide-react';

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
  title: string;
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
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      const response = await fetch('/api/formulas');
      const data = await response.json();
      setFormulas(data.formulas || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormulaClick = async (formula: Formula) => {
    try {
      const response = await fetch(`/api/formulas/${formula.id}`);
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
                         formula.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !selectedSubject || formula.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Formula Bank</h1>
        <p className="text-gray-600">
          Browse and study formulas with suggested practice questions
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search formulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
          </select>
        </div>
      </div>

      {/* Formulas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFormulas.map((formula) => (
          <div
            key={formula.id}
            onClick={() => handleFormulaClick(formula)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{formula.title}</h3>
              </div>
              {formula.subject && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {formula.subject}
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <code className="text-sm bg-gray-100 px-3 py-2 rounded block font-mono">
                {formula.formula}
              </code>
            </div>
            
            {formula.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {formula.description}
              </p>
            )}
            
            {formula.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formula.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
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
            )}
          </div>
        ))}
      </div>

      {filteredFormulas.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No formulas found.</p>
        </div>
      )}

      {/* Formula Detail Modal */}
      {showModal && selectedFormula && (
        <FormulaDetailModal
          formula={selectedFormula}
          onClose={() => {
            setShowModal(false);
            setSelectedFormula(null);
          }}
        />
      )}
    </div>
  );
}

// Formula Detail Modal Component
function FormulaDetailModal({ formula, onClose }: {
  formula: Formula;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{formula.title}</h2>
              {formula.subject && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {formula.subject}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formula Details */}
            <div>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Formula</h3>
                <code className="text-lg bg-white px-4 py-3 rounded block font-mono border">
                  {formula.formula}
                </code>
              </div>

              {formula.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-700">{formula.description}</p>
                </div>
              )}

              {formula.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formula.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Suggested Practice Questions</h3>
              {formula.suggestedQuestions && formula.suggestedQuestions.length > 0 ? (
                <div className="space-y-3">
                  {formula.suggestedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{question.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span>{question.subject}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No suggested questions available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
