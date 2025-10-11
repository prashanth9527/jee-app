'use client';

import { useState } from 'react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: any;
  selectedSubject: string | null;
  selectedLesson: string | null;
  selectedTopic: string | null;
  selectedSubtopic: string | null;
  onSubjectSelect: (subjectId: string | null) => void;
  onLessonSelect: (lessonId: string | null) => void;
  onTopicSelect: (topicId: string | null) => void;
  onSubtopicSelect: (subtopicId: string | null) => void;
  onClearFilters: () => void;
  filteredQuestions: any[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  className?: string;
}

export default function FilterSidebar({
  isOpen,
  onClose,
  treeData,
  selectedSubject,
  selectedLesson,
  selectedTopic,
  selectedSubtopic,
  onSubjectSelect,
  onLessonSelect,
  onTopicSelect,
  onSubtopicSelect,
  onClearFilters,
  filteredQuestions,
  currentQuestionIndex,
  onQuestionSelect,
  className = ''
}: FilterSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 left-0 lg:left-auto h-full lg:h-auto w-80 bg-white shadow-xl z-50 lg:z-auto ${className}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Filter Questions</h3>
            <div className="flex items-center space-x-2">
              {(selectedSubject || selectedLesson || selectedTopic || selectedSubtopic) && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Tree Structure */}
            {treeData && (
              <div className="space-y-2 mb-6">
                {Object.values(treeData).map((subject: any) => (
                  <div key={subject.id} className="border border-gray-200 rounded-md">
                    <button
                      onClick={() => {
                        onSubjectSelect(selectedSubject === subject.id ? null : subject.id);
                        onLessonSelect(null);
                        onTopicSelect(null);
                        onSubtopicSelect(null);
                      }}
                      className={`w-full text-left p-3 text-sm font-medium flex items-center justify-between rounded-t-md ${
                        selectedSubject === subject.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        {subject.name}
                      </div>
                      <span className="text-xs text-gray-500">({subject.count})</span>
                    </button>
                    
                    {selectedSubject === subject.id && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {Object.values(subject.lessons).map((lesson: any) => (
                          <div key={lesson.id} className="border-b border-gray-200 last:border-b-0">
                            <button
                              onClick={() => {
                                onLessonSelect(selectedLesson === lesson.id ? null : lesson.id);
                                onTopicSelect(null);
                                onSubtopicSelect(null);
                              }}
                              className={`w-full text-left p-3 pl-6 text-sm flex items-center justify-between ${
                                selectedLesson === lesson.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {lesson.name}
                              </div>
                              <span className="text-xs text-gray-500">({lesson.count})</span>
                            </button>
                            
                            {selectedLesson === lesson.id && (
                              <div className="bg-white">
                                {Object.values(lesson.topics).map((topic: any) => (
                                  <div key={topic.id} className="border-b border-gray-100 last:border-b-0">
                                    <button
                                      onClick={() => {
                                        onTopicSelect(selectedTopic === topic.id ? null : topic.id);
                                        onSubtopicSelect(null);
                                      }}
                                        className={`w-full text-left p-3 pl-8 text-sm flex items-center justify-between ${
                                          selectedTopic === topic.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                      <div className="flex items-center">
                                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        {topic.name}
                                      </div>
                                      <span className="text-xs text-gray-500">({topic.count})</span>
                                    </button>
                                    
                                    {selectedTopic === topic.id && (
                                      <div className="bg-gray-50">
                                        {Object.values(topic.subtopics).map((subtopic: any) => (
                                          <button
                                            key={subtopic.id}
                                            onClick={() => onSubtopicSelect(selectedSubtopic === subtopic.id ? null : subtopic.id)}
                                            className={`w-full text-left p-3 pl-10 text-sm flex items-center justify-between ${
                                              selectedSubtopic === subtopic.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                                            }`}
                                          >
                                            <div className="flex items-center">
                                              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                              </svg>
                                              {subtopic.name}
                                            </div>
                                            <span className="text-xs text-gray-500">({subtopic.count})</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Question Navigation */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Questions ({filteredQuestions.length})</h4>
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => onQuestionSelect(index)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
