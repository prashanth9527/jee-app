'use client';

import { useState } from 'react';
import api from '@/lib/api';
import LatexContentDisplay from '@/components/LatexContentDisplay';
import Swal from 'sweetalert2';

interface QuestionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: (questionId: string) => void;
  questionId: string;
  questionStem: string;
  currentExplanation?: string;
  currentOptions?: Array<{ id: string; text: string; isCorrect: boolean }>;
}

export default function QuestionReportModal({
  isOpen,
  onClose,
  onReportSubmitted,
  questionId,
  questionStem,
  currentExplanation
}: QuestionReportModalProps) {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [alternativeExplanation, setAlternativeExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = [
    { value: 'INCORRECT_ANSWER', label: 'Incorrect Answer' },
    { value: 'INCORRECT_EXPLANATION', label: 'Incorrect Explanation' },
    { value: 'SUGGESTED_EXPLANATION', label: 'Suggested Explanation' },
    { value: 'GRAMMATICAL_ERROR', label: 'Grammatical Error' },
    { value: 'TECHNICAL_ERROR', label: 'Technical Error' },
    { value: 'OTHER', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) return;

    setSubmitting(true);
    try {
      const reportData = {
        questionId,
        reportType,
        reason,
        description: description || undefined,
        alternativeExplanation: alternativeExplanation || undefined
      };

      await api.post('/student/question-reports', reportData);
      
      // Show success message
      await Swal.fire({
        title: 'Report Submitted!',
        text: 'Your report has been submitted successfully.',
        icon: 'success',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          confirmButton: 'swal-dark-confirm'
        }
      });
      
      // Notify parent component that report was submitted
      if (onReportSubmitted) {
        onReportSubmitted(questionId);
      }
      
      onClose();
      // Reset form
      setReportType('');
      setReason('');
      setDescription('');
      setAlternativeExplanation('');
    } catch (error) {
      console.error('Error submitting report:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to submit report. Please try again.',
        icon: 'error',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          confirmButton: 'swal-dark-confirm'
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Question Issue</h2>
            <button
            onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Question:</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            <LatexContentDisplay content={questionStem} />
          </p>
            {currentExplanation && (
            <>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 mt-4">Current Explanation:</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <LatexContentDisplay content={currentExplanation} />
              </p>
            </>
            )}
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="" className="text-gray-900 dark:text-white">Select report type</option>
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value} className="text-gray-900 dark:text-white bg-white dark:bg-gray-700">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief reason for the report"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Detailed description of the issue"
            />
          </div>

          {reportType === 'SUGGESTED_EXPLANATION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested Explanation
              </label>
              <textarea
                value={alternativeExplanation}
                onChange={(e) => setAlternativeExplanation(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Provide your suggested explanation"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
              type="submit"
              disabled={!reportType || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
              {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
} 
