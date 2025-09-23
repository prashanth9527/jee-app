'use client';

import { useState, useEffect } from 'react';
import QuestionDisplay from '../QuestionDisplay';
import MathRenderer from '../MathRenderer';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared?: number;
  subject?: { 
    id: string; 
    name: string;
    stream?: {
      id: string;
      name: string;
      code: string;
    };
  };
  topic?: { id: string; name: string };
  subtopic?: { id: string; name: string };
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
  tags: { tag: { name: string } }[];
}

interface ViewQuestionModalProps {
  question: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewQuestionModal({ question, isOpen, onClose }: ViewQuestionModalProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnswers(false);
    }
  }, [isOpen]);

  if (!isOpen || !question) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HARD':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <>
      <MathRenderer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Question Preview</h2>
                <p className="text-blue-100 mt-1">
                  View how this question appears to students
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Question Metadata */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Year</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {question.yearAppeared || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subject</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {question.subject?.name || 'N/A'}
                      {question.subject?.stream && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {question.subject.stream.code}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Difficulty</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getDifficultyIcon(question.difficulty)}</span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  {question.topic && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Topic</label>
                      <p className="text-lg font-semibold text-gray-900">{question.topic.name}</p>
                    </div>
                  )}
                  {question.subtopic && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subtopic</label>
                      <p className="text-lg font-semibold text-gray-900">{question.subtopic.name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="flex space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        PYQ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tagWrapper: { tag: { name: string } }, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {tagWrapper.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Stem */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    Q
                  </span>
                  Question
                </h3>
                <QuestionDisplay content={question.stem} />
              </div>

              {/* Options */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      A
                    </span>
                    Options
                  </h3>
                  <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showAnswers
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                  </button>
                </div>
                <div className="space-y-3">
                  {question.options
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((option: any, index: number) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          showAnswers && option.isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div className="flex-1">
                            <QuestionDisplay content={option.text} />
                            {showAnswers && option.isCorrect && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      E
                    </span>
                    Explanation
                  </h3>
                  <QuestionDisplay content={question.explanation || ''} />
                </div>
              )}

              {/* Tips & Formulas */}
              {question.tip_formula && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      💡
                    </span>
                    Tips & Formulas
                  </h3>
                  <QuestionDisplay content={question.tip_formula} />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Question ID: {question.id}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
