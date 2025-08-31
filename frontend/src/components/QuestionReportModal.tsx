'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface QuestionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionStem: string;
  currentExplanation?: string;
  currentOptions?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

const reportTypes = [
  { value: 'INCORRECT_ANSWER', label: 'Incorrect Answer', icon: '❌' },
  { value: 'INCORRECT_EXPLANATION', label: 'Incorrect Explanation', icon: '📝' },
  { value: 'SUGGESTED_EXPLANATION', label: 'Suggested Explanation', icon: '💡' },
  { value: 'GRAMMATICAL_ERROR', label: 'Grammatical Error', icon: '📖' },
  { value: 'TECHNICAL_ERROR', label: 'Technical Error', icon: '🔧' },
  { value: 'OTHER', label: 'Other Issue', icon: '❓' }
];

export default function QuestionReportModal({
  isOpen,
  onClose,
  questionId,
  questionStem,
  currentExplanation,
  currentOptions
}: QuestionReportModalProps) {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [alternativeExplanation, setAlternativeExplanation] = useState('');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [suggestedOptions, setSuggestedOptions] = useState<Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportType || !reason) {
      Swal.fire({
        icon: 'error',
        title: 'Required Fields Missing',
        text: 'Please select a report type and provide a reason.'
      });
      return;
    }

    setLoading(true);
    try {
      const reportData: any = {
        questionId,
        reportType,
        reason,
        description: description || undefined
      };

      if (reportType === 'SUGGESTED_EXPLANATION' && alternativeExplanation) {
        reportData.alternativeExplanation = alternativeExplanation;
      }

      if (reportType === 'INCORRECT_ANSWER') {
        if (suggestedAnswer) {
          reportData.suggestedAnswer = suggestedAnswer;
        }
        if (suggestedOptions.length > 0) {
          reportData.suggestedOptions = suggestedOptions;
        }
      }

      await api.post('/student/question-reports', reportData);

      Swal.fire({
        icon: 'success',
        title: 'Report Submitted',
        text: 'Your question report has been submitted successfully. We will review it shortly.'
      });

      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Failed to submit the report. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setReason('');
    setDescription('');
    setAlternativeExplanation('');
    setSuggestedAnswer('');
    setSuggestedOptions([]);
    onClose();
  };

  const addSuggestedOption = () => {
    setSuggestedOptions([
      ...suggestedOptions,
      { text: '', isCorrect: false, order: suggestedOptions.length }
    ]);
  };

  const updateSuggestedOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = [...suggestedOptions];
    updated[index] = { ...updated[index], [field]: value };
    setSuggestedOptions(updated);
  };

  const removeSuggestedOption = (index: number) => {
    setSuggestedOptions(suggestedOptions.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Report Question</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Question:</h3>
            <p className="text-gray-900 text-sm leading-relaxed">{questionStem}</p>
            {currentExplanation && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-900 mb-1">Current Explanation:</h4>
                <p className="text-gray-900 text-sm leading-relaxed">{currentExplanation}</p>
              </div>
            )}
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Report Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    reportType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              placeholder="Brief reason for the report..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Detailed Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              placeholder="Provide more details about the issue..."
            />
          </div>

          {/* Alternative Explanation */}
          {reportType === 'SUGGESTED_EXPLANATION' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Suggested Explanation *
              </label>
              <textarea
                value={alternativeExplanation}
                onChange={(e) => setAlternativeExplanation(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="Provide your suggested explanation for this question..."
              />
            </div>
          )}

          {/* Suggested Answer */}
          {reportType === 'INCORRECT_ANSWER' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Suggested Answer
              </label>
              <input
                type="text"
                value={suggestedAnswer}
                onChange={(e) => setSuggestedAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="What should be the correct answer?"
              />
            </div>
          )}

          {/* Suggested Options */}
          {reportType === 'INCORRECT_ANSWER' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  Suggested Options
                </label>
                <button
                  type="button"
                  onClick={addSuggestedOption}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                >
                  Add Option
                </button>
              </div>
              {suggestedOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateSuggestedOption(index, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => updateSuggestedOption(index, 'isCorrect', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Correct</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSuggestedOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
} 