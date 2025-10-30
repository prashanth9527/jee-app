'use client';

import { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import LatexContentDisplay, { LatexQuestionExplanation } from '@/components/LatexContentDisplay';
import Swal from 'sweetalert2';
import { useToastContext } from '@/contexts/ToastContext';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  _count: {
    questions: number;
  };
}

interface Lesson {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface Topic {
  id: string;
  name: string;
  lesson: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
    };
  };
  _count: {
    questions: number;
  };
}

interface Subtopic {
  id: string;
  name: string;
  topic: {
    id: string;
    name: string;
    lesson: {
      id: string;
      name: string;
      subject: {
        id: string;
        name: string;
      };
    };
  };
  _count: {
    questions: number;
  };
}

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH';
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }[];
  correctNumericAnswer?: number;
  answerTolerance?: number;
  subQuestions?: Question[];
}

interface PracticeProgress {
  id: string;
  contentType: 'lesson' | 'topic' | 'subtopic';
  contentId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  completedQuestions: number;
  visitedQuestions: string[];
  isCompleted: boolean;
  startedAt: string;
  lastAccessedAt: string;
}

interface TreeItem {
  id: string;
  name: string;
  type: 'subject' | 'lesson' | 'topic' | 'subtopic';
  questionCount: number;
  completedCount: number;
  isExpanded: boolean;
  isSelected: boolean;
  children: TreeItem[];
  parentId?: string;
}

function ContentPracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showInfo } = useToastContext();
  
  // State for content tree
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for practice session
  const [selectedContent, setSelectedContent] = useState<{
    type: 'lesson' | 'topic' | 'subtopic';
    id: string;
    name: string;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const isAnyPanelOpen = showLeftPanel || showSidePanel;
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStudyContent, setShowStudyContent] = useState(false);
  const [studyContent, setStudyContent] = useState<string>('');
  const [studyLoading, setStudyLoading] = useState(false);
  const contentCacheRef = useRef<Map<string, string>>(new Map());

  // Helper: update URL query params without navigation
  const updateUrlParams = (updates: Record<string, string | number | undefined | null>) => {
    try {
      const current = new URLSearchParams(searchParams?.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });
      const qs = current.toString();
      router.replace(`?${qs}`, { scroll: false });
    } catch {}
  };
  
  // State for progress tracking
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress | null>(null);
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());
  const [isPracticeActive, setIsPracticeActive] = useState(false);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    fetchContentTree();
  }, []);

  // On initial load, try restore from URL params
  useEffect(() => {
    const ct = searchParams?.get('ct') as 'lesson' | 'topic' | 'subtopic' | null;
    const cid = searchParams?.get('cid');
    const qParam = searchParams?.get('q');
    const fm = searchParams?.get('fm');

    if (fm === '1') setFocusMode(true);

    if (!ct || !cid || treeData.length === 0) return;

    const findItem = (items: TreeItem[]): TreeItem | null => {
      for (const item of items) {
        if (item.id === cid && item.type === ct) return item;
        if (item.children?.length) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const target = findItem(treeData);
    if (target) {
      // Expand ancestors visually
      const expandAncestors = (items: TreeItem[], id: string): boolean => {
        for (const it of items) {
          if (it.id === id) return true;
          if (it.children?.length && expandAncestors(it.children, id)) {
            setTreeData(prev => updateTreeItem(prev, it.id, x => ({ ...x, isExpanded: true })));
            return true;
          }
        }
        return false;
      };
      expandAncestors(treeData, target.id);
      // Select & fetch
      (async () => {
        await selectContent(target);
        const qIndex = Math.max(0, Math.min(Number(qParam ?? 0), questions.length - 1));
        setCurrentQuestionIndex(isNaN(qIndex) ? 0 : qIndex);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!isPracticeActive || questions.length === 0) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          event.preventDefault();
          handlePreviousQuestion();
          break;
        case 'ArrowRight':
        case 'd':
          event.preventDefault();
          handleNextQuestion();
          break;
        case ' ':
          event.preventDefault();
          handleCheckAnswer();
          break;
        case 'b':
          event.preventDefault();
          handleBookmark();
          break;
        case 'm':
          event.preventDefault();
          handleMarkForReview();
          break;
        case 'p':
          event.preventDefault();
          setShowSidePanel(!showSidePanel);
          break;
        case 'h':
          event.preventDefault();
          setShowSidePanel(!showSidePanel);
          break;
        case 'Escape':
          event.preventDefault();
          setShowSidePanel(false);
          break;
        default:
          // Handle number keys 1-9 for quick navigation
          if (event.key >= '1' && event.key <= '9') {
            const questionNumber = parseInt(event.key) - 1;
            if (questionNumber < questions.length) {
              event.preventDefault();
              handleJumpToQuestion(questionNumber);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPracticeActive, questions.length, currentQuestionIndex, showSidePanel, showQuestionPalette, showShortcutsLegend]);

  // Keep local progress state in sync for UI (API saves triggered on answer/check)
  useEffect(() => {
    if (practiceProgress && questions.length > 0) {
      const completedCount = Object.keys(checkedQuestions).length;
      const visitedQuestions = Object.keys(userAnswers);
      setPracticeProgress(prev => prev ? {
        ...prev,
        currentQuestionIndex,
        completedQuestions: completedCount,
        visitedQuestions,
        isCompleted: completedCount >= questions.length
      } : null);
    }
  }, [checkedQuestions, currentQuestionIndex, practiceProgress, questions.length, userAnswers]);

  const fetchContentTree = async () => {
    try {
      setLoading(true);
      // Optimized single call – backend returns the full tree with counts and progress
      const response = await api.get('/student/practice/content-tree');
      setTreeData(response.data);
    } catch (error) {
      console.error('Error fetching content tree:', error);
      Swal.fire('Error', 'Failed to load content tree', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    setTreeData(prev => updateTreeItem(prev, itemId, item => ({
      ...item,
      isExpanded: !item.isExpanded
    })));
  };

  const selectContent = async (item: TreeItem) => {
    if (item.type === 'subject') return; // Can't practice a subject directly
    
    // Clear previous selection
    setTreeData(prev => updateTreeItem(prev, item.id, item => ({
      ...item,
      isSelected: true
    })));

    setSelectedContent({
      type: item.type as 'lesson' | 'topic' | 'subtopic',
      id: item.id,
      name: item.name
    });

    // Fetch questions for selected content
    await fetchQuestions(item.type, item.id);
    
    // Load or create practice progress
    await loadPracticeProgress(item.type, item.id);

    // Update URL
    updateUrlParams({ ct: item.type, cid: item.id, q: 0 });
  };

  const fetchQuestions = async (contentType: string, contentId: string) => {
    try {
      const response = await api.get(`/student/practice/content/${contentType}/${contentId}/questions`);
      setQuestions(response.data);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setCheckedQuestions({});
      // Ensure totalQuestions reflects fetched list
      setPracticeProgress(prev => prev ? { ...prev, totalQuestions: response.data.length } : prev);
      // Best-effort sync to backend (non-blocking)
      if (practiceProgress) {
        api.put(`/student/practice/progress/${practiceProgress.id}/update`, {
          currentQuestionIndex: 0,
          completedQuestions: Object.keys(checkedQuestions).length,
          visitedQuestions: Object.keys(userAnswers),
          isCompleted: Object.keys(checkedQuestions).length >= response.data.length
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      Swal.fire('Error', 'Failed to load questions', 'error');
    }
  };

  const loadPracticeProgress = async (contentType: string, contentId: string) => {
    try {
      const res = await api.get(`/student/practice/progress/${contentType}/${contentId}`);
      if (res.data) {
        const progress = res.data;
        const sessions: any[] = progress.sessions || [];
        const visitedFromSessions = Array.from(new Set(sessions.map((s: any) => s.questionId)));
        const practicedFromSessions = new Set(sessions.filter((s: any) => s.isChecked).map((s: any) => s.questionId));
        setPracticedIds(practicedFromSessions);
        setPracticeProgress({
          ...progress,
          visitedQuestions: Array.from(new Set([...(progress.visitedQuestions || []), ...visitedFromSessions]))
        });
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
        setIsPracticeActive(true);
        return;
      }
    } catch {}
    await createPracticeProgress(contentType, contentId);
  };

  const createPracticeProgress = async (contentType: string, contentId: string) => {
    try {
      const response = await api.post('/student/practice/progress/start', {
        contentType,
        contentId,
        totalQuestions: questions.length
      });
      setPracticeProgress(response.data);
      setIsPracticeActive(true);
    } catch (error) {
      console.error('Error creating practice progress:', error);
    }
  };

  const updateTreeItem = (items: TreeItem[], itemId: string, updateFn: (item: TreeItem) => TreeItem): TreeItem[] => {
    return items.map(item => {
      if (item.id === itemId) {
        return updateFn(item);
      }
      if (item.children.length > 0) {
        return {
          ...item,
          children: updateTreeItem(item.children, itemId, updateFn)
        };
      }
      return item;
    });
  };

  // Practice session handlers
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
      setQuestionStartTime(Date.now());
      setShowQuestionPalette(false);
    }
  };

  // Keep URL q param in sync
  useEffect(() => {
    if (selectedContent) {
      updateUrlParams({ q: currentQuestionIndex });
    }
  }, [currentQuestionIndex, selectedContent]);

  const handleCheckAnswer = async () => {
    if (!practiceProgress || isCheckingAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsCheckingAnswer(true);
    
    try {
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      
      // Validate answer (supports MCQ, OPEN_ENDED, PARAGRAPH)
      const isCorrect = validateAnswer(currentQuestion);

      // Save checked answer attempt
      await api.post('/student/practice/session', {
        progressId: practiceProgress.id,
        questionId: currentQuestion.id,
        userAnswer: userAnswers[currentQuestion.id],
        isCorrect,
        timeSpent,
        isChecked: true
      });

      // Update server progress (completed count and current index)
      const completedCount = Object.keys({
        ...checkedQuestions,
        [currentQuestion.id]: true
      }).length;
      await api.put(`/student/practice/progress/${practiceProgress.id}/update`, {
        currentQuestionIndex,
        completedQuestions: completedCount,
        visitedQuestions: Object.keys({ ...userAnswers, [currentQuestion.id]: userAnswers[currentQuestion.id] }),
        isCompleted: completedCount >= questions.length
      });

      // Reflect visited locally so badges show even on refresh of state
      setPracticeProgress(prev => prev ? {
        ...prev,
        visitedQuestions: Array.from(new Set([...(prev.visitedQuestions || []), currentQuestion.id])),
        completedQuestions: completedCount
      } : prev);

      // Mark as practiced locally for badges/palette
      setPracticedIds(prev => new Set(prev).add(currentQuestion.id));

      // Update local state
      setCheckedQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: true
      }));

      // Show feedback
      if (isCorrect) {
        showSuccess('Correct', 'Correct answer! 🎉');
      } else {
        showInfo('Incorrect', 'Check the explanation below.');
      }

    } catch (error) {
      console.error('Error checking answer:', error);
      Swal.fire('Error', 'Failed to check answer', 'error');
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const handleBookmark = async () => {
    if (!practiceProgress) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isBookmarked = bookmarkedQuestions.has(currentQuestion.id);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        setBookmarkedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentQuestion.id);
          return newSet;
        });
        showInfo('Bookmark', 'Bookmark removed');
      } else {
        // Add bookmark
        setBookmarkedQuestions(prev => new Set([...prev, currentQuestion.id]));
        showSuccess('Bookmark', 'Question bookmarked! 🔖');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleMarkForReview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isMarked = markedForReview.has(currentQuestion.id);
    
    if (isMarked) {
      setMarkedForReview(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestion.id);
        return newSet;
      });
      showInfo('Review', 'Removed from review');
    } else {
      setMarkedForReview(prev => new Set([...prev, currentQuestion.id]));
      showSuccess('Review', 'Marked for review! 📝');
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    // Save draft answer (not checked yet)
    if (practiceProgress) {
      api.post('/student/practice/session', {
        progressId: practiceProgress.id,
        questionId,
        userAnswer: answer,
        isChecked: false
      }).catch(() => {});
    }
  };

  // Helpers: validation and rendering for different question types
  const validateAnswer = (question: Question): boolean => {
    const answer = userAnswers[question.id];
    switch (question.questionType) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTIPLE': {
        if (!question.options) return false;
        const selected: string[] = Array.isArray(answer) ? answer : [];
        const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id);
        return selected.length === correctIds.length && correctIds.every(id => selected.includes(id));
      }
      case 'OPEN_ENDED': {
        if (question.correctNumericAnswer === undefined) return false;
        const tolerance = question.answerTolerance ?? 0.01;
        const val = typeof answer === 'number' ? answer : parseFloat(answer);
        return !isNaN(val) && Math.abs(val - question.correctNumericAnswer) <= tolerance;
      }
      case 'PARAGRAPH': {
        if (!question.subQuestions) return false;
        return question.subQuestions.every(sub => validateAnswer(sub));
      }
      default:
        return false;
    }
  };

  const hasAnyAnswer = (question: Question): boolean => {
    if (userAnswers[question.id]) return true;
    if (question.subQuestions) {
      return question.subQuestions.some(sub => hasAnyAnswer(sub));
    }
    return false;
  };

  const renderQuestionInput = (question: Question, indexPrefix = '') => {
    if (question.questionType === 'MCQ_SINGLE' || question.questionType === 'MCQ_MULTIPLE') {
      const sel = userAnswers[question.id] || [];
      const isChecked = !!checkedQuestions[question.id];
      return (
        <div className="space-y-3 mb-6">
          {question.options?.map((option, idx) => {
            const isSelected = Array.isArray(sel) && sel.includes(option.id);
            const isCorrect = option.isCorrect;
            return (
              <label
                key={option.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  isChecked
                    ? isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isSelected
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-300'
                    : isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type={question.questionType === 'MCQ_MULTIPLE' ? 'checkbox' : 'radio'}
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={(e) => {
                    const current = (userAnswers[question.id] || []) as string[];
                    let next: string[];
                    if (question.questionType === 'MCQ_MULTIPLE') {
                      next = e.target.checked ? [...current, option.id] : current.filter((answerId: string) => answerId !== option.id);
                    } else {
                      next = e.target.checked ? [option.id] : [];
                    }
                    handleAnswerChange(question.id, next);
                  }}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-gray-900 ${isChecked && isCorrect ? 'font-semibold' : ''}`}>
                  <LatexContentDisplay content={option.text || ''} />
                </span>
                {isChecked && isCorrect && (
                  <span className="ml-auto text-green-600 font-semibold">✓ Correct</span>
                )}
                {isChecked && !isCorrect && isSelected && (
                  <span className="ml-auto text-red-600 font-semibold">✗ Incorrect</span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    if (question.questionType === 'OPEN_ENDED') {
      const val = userAnswers[question.id] ?? '';
      const placeholder = 'Enter a number';
      return (
        <div className="space-y-3 mb-6">
          <input
            type="number"
            value={val}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (question.questionType === 'PARAGRAPH') {
      return (
        <div className="space-y-6">
          {question.subQuestions?.map((sub, idx) => (
            <div key={sub.id} className="border-l-4 border-blue-500 pl-4">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 mr-2">Question {idx + 1}</span>
                <LatexContentDisplay content={sub.stem || ''} />
              </div>
              {renderQuestionInput(sub, `${indexPrefix}${idx + 1}.`)}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const renderTreeItem = (item: TreeItem, level: number = 0) => {
    const isSelectable = item.type !== 'subject';
    const progressPercentage = item.questionCount > 0 ? (item.completedCount / item.questionCount) * 100 : 0;
    
    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
            item.isSelected ? 'bg-blue-100 border border-blue-300' : ''
          } ${isSelectable ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (item.children.length > 0) {
              toggleExpanded(item.id);
            } else if (isSelectable) {
              selectContent(item);
            }
          }}
        >
          {/* Expand/Collapse Icon */}
          {item.children.length > 0 && (
            <div className="mr-2">
              {item.isExpanded ? (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          )}

          {/* Content Icon */}
          <div className="mr-2">
            {item.type === 'subject' && <span className="text-lg">📚</span>}
            {item.type === 'lesson' && <span className="text-lg">📖</span>}
            {item.type === 'topic' && <span className="text-lg">📝</span>}
            {item.type === 'subtopic' && <span className="text-lg">🔍</span>}
          </div>

          {/* Content Name */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {item.name}
            </div>
            <div className="text-xs text-gray-500">
              {item.completedCount}/{item.questionCount} questions
              {progressPercentage > 0 && ` (${Math.round(progressPercentage)}% complete)`}
            </div>
          </div>

          {/* Progress Bar */}
          {item.questionCount > 0 && (
            <div className="w-16 h-2 bg-gray-200 rounded-full ml-2">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Children */}
        {item.isExpanded && item.children.length > 0 && (
          <div className="ml-2">
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter tree by search query while preserving ancestors of matches
  const filterTreeByQuery = (items: TreeItem[], query: string): TreeItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const walk = (list: TreeItem[]): TreeItem[] => {
      const result: TreeItem[] = [];
      for (const it of list) {
        const nameMatch = it.name.toLowerCase().includes(q);
        const filteredChildren = it.children ? walk(it.children) : [];
        if (nameMatch || filteredChildren.length > 0) {
          result.push({
            ...it,
            isExpanded: filteredChildren.length > 0 || it.isExpanded,
            children: filteredChildren
          });
        }
      }
      return result;
    };
    return walk(items);
  };

  const visibleTree = useMemo(() => filterTreeByQuery(treeData, searchQuery), [treeData, searchQuery]);

  // Build breadcrumb Subject -> Lesson -> Topic -> Subtopic for header
  const getBreadcrumb = () => {
    if (!selectedContent) return '';
    const path: string[] = [];
    const traverse = (items: TreeItem[], targetId: string, trail: string[]): boolean => {
      for (const it of items) {
        const nextTrail = [...trail, it.name];
        if (it.id === targetId) { path.push(...nextTrail); return true; }
        if (it.children?.length && traverse(it.children, targetId, nextTrail)) return true;
      }
      return false;
    };
    traverse(treeData, selectedContent.id, []);
    return path.join(' -> ');
  };

  // Resolve current lesson/topic/subtopic ids for selected node
  const getCurrentHierarchyIds = (): { lessonId?: string; topicId?: string; subtopicId?: string } => {
    if (!selectedContent) return {};
    let lessonId: string | undefined;
    let topicId: string | undefined;
    let subtopicId: string | undefined;
    const dfs = (items: TreeItem[], parent?: { lessonId?: string; topicId?: string }) => {
      for (const it of items) {
        const nextParent = { ...parent };
        if (it.type === 'lesson') nextParent.lessonId = it.id;
        if (it.type === 'topic') nextParent.topicId = it.id;
        if (it.id === selectedContent.id) {
          lessonId = nextParent.lessonId;
          topicId = nextParent.topicId;
          if (selectedContent.type === 'subtopic') subtopicId = selectedContent.id;
          if (selectedContent.type === 'topic') topicId = selectedContent.id;
          if (selectedContent.type === 'lesson') lessonId = selectedContent.id;
          return true;
        }
        if (it.children?.length && dfs(it.children, nextParent)) return true;
      }
      return false;
    };
    dfs(treeData);
    return { lessonId, topicId, subtopicId };
  };

  const fetchStudyContent = async () => {
    if (!selectedContent) return;
    const key = `${selectedContent.type}:${selectedContent.id}`;
    if (contentCacheRef.current.has(key)) {
      setStudyContent(contentCacheRef.current.get(key) || '');
      return;
    }
    setStudyLoading(true);
    try {
      const ids = getCurrentHierarchyIds();
      let html = '';
      // Try subtopic -> topic -> lesson
      if (ids.subtopicId) {
        try {
          const r = await api.get(`/student/lms/content?subtopicId=${ids.subtopicId}`);
          html = r.data?.content || r.data?.html || '';
        } catch {}
      }
      if (!html && ids.topicId) {
        try {
          const r = await api.get(`/student/lms/content?topicId=${ids.topicId}`);
          html = r.data?.content || r.data?.html || '';
        } catch {}
      }
      if (!html && ids.lessonId) {
        try {
          const r = await api.get(`/student/lms/content?lessonId=${ids.lessonId}`);
          html = r.data?.content || r.data?.html || '';
        } catch {}
      }
      contentCacheRef.current.set(key, html || '');
      setStudyContent(html || '');
    } finally {
      setStudyLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading practice content...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Left Sidebar - Content Tree */}
          <div className={`${showLeftPanel ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Practice Questions</h1>
                  <p className="text-sm text-gray-600 mt-1">Select content to practice</p>
                </div>
                {/* <button
                  onClick={() => setShowLeftPanel(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50"
                  title="Collapse panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button> */}
              </div>
              {/* Search */}
              <div className="mt-3 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lessons, topics, subtopics..."
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"/></svg>
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {visibleTree.map(item => renderTreeItem(item))}
            </div>
          </div>

          {/* Right Side - Practice Area */}
          <div className={`flex-1 flex flex-col relative ${showSidePanel && !focusMode ? 'pr-80' : ''}`}>
            

            {/* Floating toggle button at top-left of question area (collapse/expand left panel) */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              title={showLeftPanel ? 'Collapse content panel' : 'Expand content panel'}
              className="absolute left-2 top-2 z-30 p-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              {showLeftPanel ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Floating toggle button at top-right of question area */}
            <button
              onClick={async () => {
                const next = !showStudyContent;
                setShowStudyContent(next);
                if (next) await fetchStudyContent();
              }}
              title={showStudyContent ? 'Show Questions' : 'Show Study Content'}
              className="absolute right-2 top-2 z-30 p-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              {/* info-like icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m2-4h.01M12 20a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
            </button>
            {selectedContent ? (
              <div className="flex-1 flex flex-col">
                {/* Practice Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pl-9 md:pl-10">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getBreadcrumb() || selectedContent.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {questions.length} questions • {selectedContent.type}
                      </p>
                      {practiceProgress && (
                        <div className="mt-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>Progress:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(practiceProgress.completedQuestions / Math.max(1, practiceProgress.totalQuestions)) * 100}%`
                                  }}
                                />
                              </div>
                              <span>{practiceProgress.completedQuestions}/{practiceProgress.totalQuestions}</span>
                            </div>
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>

                {/* Practice Content */}
                <div className="flex-1 p-6 relative">
                  {questions.length > 0 ? (
                    <div className={`${focusMode ? 'max-w-none mx-2 md:mx-6 lg:mx-10' : (isAnyPanelOpen ? 'max-w-4xl mx-auto' : 'max-w-none mx-4 md:mx-6 lg:mx-10')}`}>
                      {/* Right Side Collapsible Panel (Palette + Shortcuts) */}
                      <div className={`fixed top-20 right-0 bottom-0 z-40 w-80 transform transition-transform duration-300 ${
                        showSidePanel ? 'translate-x-0' : 'translate-x-full'
                      }`}>
                        <div className="h-full bg-white border-l border-gray-200 shadow-xl flex flex-col">
                          <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
                            <button
                              onClick={() => setShowSidePanel(false)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Close (Esc)"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Palette */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-900">Question Palette</h4>
                                <span className="text-xs text-gray-500">{questions.length} items</span>
                              </div>
                              <div className="grid grid-cols-6 gap-2">
                                {questions.map((question, index) => {
                                  const isVisited = (practicedIds.has(question.id) || hasAnyAnswer(question)) && !checkedQuestions[question.id];
                                  return (
                                  <button
                                    key={question.id}
                                    onClick={() => handleJumpToQuestion(index)}
                                    className={`p-2 rounded text-xs font-medium transition-colors ${
                                      index === currentQuestionIndex
                                        ? 'bg-blue-600 text-white'
                                        : checkedQuestions[question.id]
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : bookmarkedQuestions.has(question.id)
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                        : markedForReview.has(question.id)
                                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                        : isVisited
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                        : 'p-2 rounded text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {index + 1}
                                  </button>
                                );})}
                              </div>
                            </div>

                            {/* Shortcuts */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
                              <div className="space-y-2 text-xs text-gray-700">
                                <div className="flex justify-between"><span>Previous Question</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">← / A</kbd></div>
                                <div className="flex justify-between"><span>Next Question</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">→ / D</kbd></div>
                                <div className="flex justify-between"><span>Check Answer</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">Space</kbd></div>
                                <div className="flex justify-between"><span>Bookmark</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">B</kbd></div>
                                <div className="flex justify-between"><span>Mark for Review</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">M</kbd></div>
                                <div className="flex justify-between"><span>Open/Close Panel</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">P / H</kbd></div>
                                <div className="flex justify-between"><span>Jump to Question</span><kbd className="inline-flex items-center justify-center  min-w-6 h-6 px-1.5 text-xs font-medium rounded-md  bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm  dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600">1-9</kbd></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Question {currentQuestionIndex + 1} of {questions.length}
                          </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const next = !focusMode;
                          setFocusMode(next);
                          if (next) {
                            setShowLeftPanel(false);
                            setShowSidePanel(false);
                          }
                          updateUrlParams({ fm: next ? 1 : null });
                        }}
                        className={`p-2 rounded-lg border ${focusMode ? 'bg-blue-50 text-blue-600 border-blue-300' : 'text-blue-600 border-blue-300 hover:bg-blue-50'} transition-colors`}
                        title="Toggle focus mode"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
                        </svg>
                      </button>
                            <button
                              onClick={() => setShowSidePanel(!showSidePanel)}
                              className="p-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Open tools (Palette & Shortcuts)"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                              </svg>
                            </button>
                            <span className="text-sm text-gray-500">
                              {questions[currentQuestionIndex]?.difficulty}
                            </span>
                            {(() => {
                              const q = questions[currentQuestionIndex];
                              const isChecked = !!checkedQuestions[q?.id] || practicedIds.has(q?.id as string);
                              const isVisited = (practiceProgress?.visitedQuestions?.includes(q?.id) ?? false) || hasAnyAnswer(q);
                              if (isChecked) {
                                return (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                    Practiced
                                  </span>
                                );
                              }
                              if (isVisited) {
                                return (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300">
                                    Visited
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        
                        {showStudyContent ? (
                          <div className="prose max-w-none mb-6">
                            {studyLoading ? (
                              <div className="text-sm text-gray-500">Loading content…</div>
                            ) : studyContent ? (
                              <LatexContentDisplay content={studyContent} className="text-gray-900 leading-relaxed" />
                            ) : (
                              <div className="text-sm text-gray-500">No study content available.</div>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Question Stem */}
                            <div className="prose max-w-none mb-6">
                              <LatexContentDisplay 
                                content={questions[currentQuestionIndex]?.stem || ''}
                                className="text-gray-900 leading-relaxed"
                              />
                            </div>

                            {/* Question Input by Type */}
                            {renderQuestionInput(questions[currentQuestionIndex])}
                          </>
                        )}

                        {/* Explanation (shown after checking answer) */}
                        {checkedQuestions[questions[currentQuestionIndex]?.id] && questions[currentQuestionIndex]?.explanation && (
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                            <LatexQuestionExplanation explanation={questions[currentQuestionIndex].explanation || ''} />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-3">
                            <button
                              onClick={handlePreviousQuestion}
                              disabled={currentQuestionIndex === 0}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              ← Previous (A)
                            </button>
                            
                            <button
                              onClick={handleNextQuestion}
                              disabled={currentQuestionIndex === questions.length - 1}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Next (D) →
                            </button>
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleCheckAnswer}
                              disabled={isCheckingAnswer || checkedQuestions[questions[currentQuestionIndex]?.id]}
                              className="px-4 py-2 text-pink-600 border border-pink-300 rounded-lg hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isCheckingAnswer ? 'Checking...' : 'Check Answer (Space)'}
                            </button>
                            
                            <button
                              onClick={handleBookmark}
                              className={`px-4 py-2 border rounded-lg transition-colors ${
                                bookmarkedQuestions.has(questions[currentQuestionIndex]?.id)
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  : 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                              }`}
                            >
                              {bookmarkedQuestions.has(questions[currentQuestionIndex]?.id) ? '✓ Bookmarked' : 'Bookmark (B)'}
                            </button>
                            
                            <button
                              onClick={handleMarkForReview}
                              className={`px-4 py-2 border rounded-lg transition-colors ${
                                markedForReview.has(questions[currentQuestionIndex]?.id)
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                              }`}
                            >
                              {markedForReview.has(questions[currentQuestionIndex]?.id) ? '✓ Marked' : 'Mark (M)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📚</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                      <p className="text-gray-600">This content doesn't have any questions yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content to Practice</h3>
                  <p className="text-gray-600">Choose a lesson, topic, or subtopic from the sidebar to start practicing.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default function ContentPracticePage() {
  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <Suspense fallback={
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          </StudentLayout>
        }>
          <ContentPracticePageContent />
        </Suspense>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}
