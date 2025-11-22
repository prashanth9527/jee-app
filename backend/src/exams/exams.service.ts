import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { ExamType } from '@prisma/client';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async getExam(userId: string, examId: string) {
    console.log('Getting exam:', { userId, examId });

    const exam = await this.prisma.examPaper.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if user has access to this exam
    if (exam.createdById && exam.createdById !== userId) {
      throw new BadRequestException('You do not have access to this exam');
    }

    // Fetch questions using the questionIds
    const questions = await this.prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
			include: {
        options: {
          orderBy: { order: 'asc' }
				}
			}
		});

    console.log('Exam found:', exam.title, 'Questions:', questions.length);

		return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      questionCount: questions.length,
      timeLimitMin: exam.timeLimitMin,
      examType: 'REGULAR',
      questions: questions.map((question: any) => ({
        id: question.id,
        stem: question.stem,
        isOpenEnded: question.isOpenEnded,
        correctNumericAnswer: question.correctNumericAnswer,
        answerTolerance: question.answerTolerance,
        options: question.options.map((option: any) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect
        })),
        explanation: question.explanation,
        difficulty: question.difficulty
      }))
    };
  }

  async submitExam(userId: string, examId: string, answers: Array<{ questionId: string; optionId?: string; numericValue?: number }>, submissionId?: string) {
    console.log('Submitting exam:', { userId, examId, submissionId, answerCount: answers.length });

    // Get exam details
    const exam = await this.prisma.examPaper.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if user has access to this exam
    if (exam.createdById && exam.createdById !== userId) {
      throw new BadRequestException('You do not have access to this exam');
    }

    // Fetch questions using questionIds
		const questions = await this.prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
			include: {
        options: true
      }
    });

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions.length;

    for (const answer of answers) {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (question) {
        let isCorrect = false;
        
        if (question.isOpenEnded) {
          // Handle open-ended questions
          if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
            const tolerance = question.answerTolerance || 0.01;
            isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
            console.log('Open-ended validation:', {
              questionId: question.id,
              userAnswer: answer.numericValue,
              correctAnswer: question.correctNumericAnswer,
              tolerance: tolerance,
              difference: Math.abs(answer.numericValue - question.correctNumericAnswer),
              isCorrect: isCorrect
            });
          }
        } else if (!question.options || question.options.length === 0) {
          // Fallback: if question has no options, treat as open-ended
          console.log('Fallback: treating question without options as open-ended');
          if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
            const tolerance = question.answerTolerance || 0.01;
            isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
            console.log('Fallback open-ended validation:', {
              questionId: question.id,
              userAnswer: answer.numericValue,
              correctAnswer: question.correctNumericAnswer,
              tolerance: tolerance,
              difference: Math.abs(answer.numericValue - question.correctNumericAnswer),
              isCorrect: isCorrect
            });
          }
        } else {
          // Handle multiple choice questions
          if (answer.optionId) {
            const selectedOption = question.options.find((o: any) => o.id === answer.optionId);
            isCorrect = selectedOption ? selectedOption.isCorrect : false;
          }
        }
        
        if (isCorrect) {
          correctCount++;
        }
      }
    }

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    let submission;
    
    if (submissionId) {
      // Update existing submission
      submission = await this.prisma.examSubmission.update({
        where: { id: submissionId },
        data: {
          scorePercent,
          correctCount,
          totalQuestions,
          submittedAt: new Date(),
          answers: {
            deleteMany: {}, // Delete existing answers
            create: answers.map((answer: any) => {
              // Find the question to determine if the answer is correct
              const question = questions.find((q: any) => q.id === answer.questionId);
              let isCorrect = false;
              
              if (question) {
                if (question.isOpenEnded) {
                  if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
                    const tolerance = question.answerTolerance || 0.01;
                    isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
                  }
                } else if (!question.options || question.options.length === 0) {
                  // Fallback for questions without options
                  if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
                    const tolerance = question.answerTolerance || 0.01;
                    isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
                  }
                } else {
                  // Multiple choice questions
                  if (answer.optionId) {
                    const selectedOption = question.options.find((o: any) => o.id === answer.optionId);
                    isCorrect = selectedOption ? selectedOption.isCorrect : false;
                  }
                }
              }
              
              return {
                questionId: answer.questionId,
                selectedOptionId: answer.optionId,
                numericValue: answer.numericValue,
                isCorrect: isCorrect
              };
            })
          }
        },
        include: {
          answers: {
            include: {
              question: {
                include: {
                  options: true
                }
              }
            }
          }
        }
      });
    } else {
      // Create new submission
      submission = await this.prisma.examSubmission.create({
        data: {
          userId,
          examPaperId: examId,
          scorePercent,
          correctCount,
          totalQuestions,
          submittedAt: new Date(),
          answers: {
            create: answers.map((answer: any) => {
              // Find the question to determine if the answer is correct
              const question = questions.find((q: any) => q.id === answer.questionId);
              let isCorrect = false;
              
              if (question) {
                if (question.isOpenEnded) {
                  if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
                    const tolerance = question.answerTolerance || 0.01;
                    isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
                  }
                } else if (!question.options || question.options.length === 0) {
                  // Fallback for questions without options
                  if (answer.numericValue !== undefined && question.correctNumericAnswer !== null) {
                    const tolerance = question.answerTolerance || 0.01;
                    isCorrect = Math.abs(answer.numericValue - question.correctNumericAnswer) <= tolerance;
                  }
                } else {
                  // Multiple choice questions
                  if (answer.optionId) {
                    const selectedOption = question.options.find((o: any) => o.id === answer.optionId);
                    isCorrect = selectedOption ? selectedOption.isCorrect : false;
                  }
                }
              }
              
              return {
                questionId: answer.questionId,
                selectedOptionId: answer.optionId,
                numericValue: answer.numericValue,
                isCorrect: isCorrect
              };
            })
          }
        },
        include: {
          answers: {
            include: {
              question: {
                include: {
                  options: true
                }
              }
            }
          }
        }
      });
    }

    console.log('Exam submitted:', { submissionId: submission.id, score: scorePercent });

		return {
      submissionId: submission.id,
      scorePercent,
      correctCount,
      totalQuestions,
				submittedAt: submission.submittedAt,
      answers: submission.answers.map((answer: any) => ({
				questionId: answer.questionId,
        question: answer.question.stem,
        isOpenEnded: answer.question.isOpenEnded,
        correctNumericAnswer: answer.question.correctNumericAnswer,
        answerTolerance: answer.question.answerTolerance,
        selectedOption: answer.question.isOpenEnded ? 
          { text: answer.numericValue?.toString() || '', isCorrect: answer.isCorrect } :
          answer.question.options.find((o: any) => o.id === answer.selectedOptionId),
        correctOption: answer.question.isOpenEnded ?
          { text: answer.question.correctNumericAnswer?.toString() || '', isCorrect: true } :
          answer.question.options.find((o: any) => o.isCorrect),
        isCorrect: answer.isCorrect
			}))
		};
	}

  async getExamResults(userId: string, examId: string) {
    console.log('Getting exam results:', { userId, examId });

    const submission = await this.prisma.examSubmission.findFirst({
      where: {
        userId,
        examPaperId: examId
      },
      include: {
        examPaper: true,
        answers: {
          include: {
            question: {
			include: {
					options: true
				}
            }
				}
        }
      },
      orderBy: {
        submittedAt: 'desc'
			}
		});

		if (!submission) {
      throw new NotFoundException('Exam results not found');
    }

		return {
      submissionId: submission.id,
      scorePercent: submission.scorePercent,
      correctCount: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      submittedAt: submission.submittedAt,
      examTitle: submission.examPaper.title,
      answers: submission.answers.map((answer: any) => ({
        questionId: answer.questionId,
        question: answer.question.stem,
        selectedOption: answer.question.isOpenEnded ? 
          { text: answer.numericValue?.toString() || '', isCorrect: answer.isCorrect } :
          answer.question.options.find((o: any) => o.id === answer.selectedOptionId),
        correctOption: answer.question.isOpenEnded ?
          { text: answer.question.correctNumericAnswer?.toString() || '', isCorrect: true } :
          answer.question.options.find((o: any) => o.isCorrect),
        isCorrect: answer.isCorrect
      }))
    };
  }

  async getSubmission(userId: string, submissionId: string) {
    console.log('Getting submission:', { userId, submissionId });

		const submission = await this.prisma.examSubmission.findUnique({
			where: { id: submissionId },
			include: {
        examPaper: true,
				answers: {
					include: {
						question: {
							include: {
                options: true
							}
						}
					}
				}
			}
		});

		if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check if user has access to this submission
    if (submission.userId !== userId) {
      throw new BadRequestException('You do not have access to this submission');
		}

		return {
				id: submission.id,
      userId: submission.userId,
      examPaper: {
        id: submission.examPaper.id,
        title: submission.examPaper.title,
        timeLimitMin: submission.examPaper.timeLimitMin,
        examType: submission.examPaper.examType
      },
      questionIds: submission.examPaper.questionIds,
				startedAt: submission.startedAt,
				submittedAt: submission.submittedAt,
				totalQuestions: submission.totalQuestions,
      scorePercent: submission.scorePercent,
				correctCount: submission.correctCount,
      answers: submission.answers.map((answer: any) => ({
				questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.question.options.find((o: any) => o.id === answer.selectedOptionId)?.isCorrect || false
			}))
		};
	}

  async getSubmissionQuestions(userId: string, submissionId: string) {
    console.log('Getting submission questions:', { userId, submissionId });

    const submission = await this.prisma.examSubmission.findUnique({
      where: { id: submissionId },
				include: {
        examPaper: true
      }
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Check if user has access to this submission
    if (submission.userId !== userId) {
      throw new BadRequestException('You do not have access to this submission');
    }

    // Fetch questions using the questionIds from the exam paper
    const questions = await this.prisma.question.findMany({
      where: { id: { in: submission.examPaper.questionIds } },
			include: {
				options: {
          orderBy: { order: 'asc' }
        },
        subject: true,
        topic: true,
        subtopic: true,
        subQuestions: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return questions.map((question: any) => {
      console.log('Question data:', {
        id: question.id,
        isOpenEnded: question.isOpenEnded,
        correctNumericAnswer: question.correctNumericAnswer,
        answerTolerance: question.answerTolerance,
        optionsCount: question.options?.length || 0,
        subQuestionsCount: question.subQuestions?.length || 0
      });
      
      return {
        id: question.id,
				stem: question.stem,
        explanation: question.explanation,
        tip_formula: question.tip_formula,
        difficulty: question.difficulty,
        isOpenEnded: question.isOpenEnded,
        correctNumericAnswer: question.correctNumericAnswer,
        answerTolerance: question.answerTolerance,
        questionType: question.questionType,
        parentQuestionId: question.parentQuestionId,
      subject: question.subject ? {
        id: question.subject.id,
        name: question.subject.name
      } : undefined,
      topic: question.topic ? {
        id: question.topic.id,
        name: question.topic.name
      } : undefined,
      subtopic: question.subtopic ? {
        id: question.subtopic.id,
        name: question.subtopic.name
      } : undefined,
      options: question.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect
      })),
      subQuestions: question.subQuestions ? question.subQuestions.map((subQ: any) => ({
        id: subQ.id,
        stem: subQ.stem,
        explanation: subQ.explanation,
        difficulty: subQ.difficulty,
        questionType: subQ.questionType,
        isOpenEnded: subQ.isOpenEnded,
        correctNumericAnswer: subQ.correctNumericAnswer,
        answerTolerance: subQ.answerTolerance,
        options: subQ.options.map((option: any) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect
        }))
      })) : undefined
      };
    });
  }

  async getSubmissionResults(userId: string, submissionId: string) {
    console.log('Getting submission results by submissionId:', { userId, submissionId });

    const submission = await this.prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: {
        examPaper: true,
        answers: {
          include: {
            question: { include: { options: true } }
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.userId !== userId) {
      throw new BadRequestException('You do not have access to this submission');
    }

    // Calculate marks based on specific marking scheme
    let totalMarksObtained = 0;
    let totalMarksAvailable = 0;
    const answersWithMarks = submission.answers.map((a: any) => {
      const question = a.question;
      const questionType = question.questionType || 'MCQ_SINGLE';
      const fullMarks = question.fullMarks || 4.0;
      const partialMarks = question.partialMarks || 2.0;
      const negativeMarks = question.negativeMarks || -1.0;
      
      totalMarksAvailable += fullMarks;
      
      let marksObtained = 0;
      
      // Apply specific marking scheme based on question type
      switch (questionType) {
        case 'MCQ_SINGLE':
        case 'OPEN_ENDED':
          if (a.isCorrect) {
            marksObtained = fullMarks; // +4 for correct
          } else if (a.selectedOptionId || a.numericValue !== null) {
            marksObtained = negativeMarks; // -1 for wrong answer
          } else {
            marksObtained = 0; // 0 for not attempted
          }
          break;
          
        case 'PARAGRAPH':
          if (a.isCorrect) {
            marksObtained = fullMarks; // +2 for correct
          } else {
            marksObtained = 0; // 0 in all other cases
          }
          break;
          
        case 'MCQ_MULTIPLE':
          if (a.isCorrect) {
            marksObtained = fullMarks; // +4 for all correct options
          } else if (a.selectedOptionId) {
            // For MCQ_MULTIPLE, implement complex partial marking logic
            const selectedOptions = a.selectedOptionId ? [a.selectedOptionId] : [];
            const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
            const selectedCorrectOptions = selectedOptions.filter(optId => 
              correctOptions.some((opt: any) => opt.id === optId)
            );
            const selectedIncorrectOptions = selectedOptions.filter(optId => 
              !correctOptions.some((opt: any) => opt.id === optId)
            );
            
            if (selectedIncorrectOptions.length > 0) {
              // Any incorrect selection gets -2 marks
              marksObtained = -2;
            } else if (selectedCorrectOptions.length === correctOptions.length) {
              // All correct options selected
              marksObtained = fullMarks;
            } else if (selectedCorrectOptions.length === 3 && correctOptions.length === 4) {
              // 3 out of 4 correct options selected
              marksObtained = 3;
            } else if (selectedCorrectOptions.length === 2 && correctOptions.length >= 3) {
              // 2 out of 3+ correct options selected
              marksObtained = 2;
            } else if (selectedCorrectOptions.length === 1 && correctOptions.length >= 2) {
              // 1 out of 2+ correct options selected
              marksObtained = 1;
            } else {
              marksObtained = -2; // Default negative marking
            }
          } else {
            marksObtained = 0; // 0 for not attempted
          }
          break;
          
        default:
          // Fallback to original logic
          if (a.isCorrect) {
            marksObtained = fullMarks;
          } else if (a.selectedOptionId) {
            marksObtained = negativeMarks;
          } else {
            marksObtained = 0;
          }
      }
      
      totalMarksObtained += marksObtained;
      
      return {
        questionId: a.questionId,
        question: a.question.stem,
        selectedOption: a.question.isOpenEnded ? 
          { text: a.numericValue?.toString() || '', isCorrect: a.isCorrect } :
          a.question.options.find((o: any) => o.id === a.selectedOptionId) || null,
        correctOption: a.question.isOpenEnded ?
          { text: a.question.correctNumericAnswer?.toString() || '', isCorrect: true } :
          a.question.options.find((o: any) => o.isCorrect) || null,
        isCorrect: a.isCorrect,
        marksObtained: marksObtained,
        fullMarks: fullMarks,
        partialMarks: partialMarks,
        negativeMarks: negativeMarks,
        allowPartialMarking: question.allowPartialMarking,
        questionType: questionType
      };
    });

    console.log('Submission results:', { submissionId: submission.answers, score: submission.scorePercent });
    return {
      submissionId: submission.id,
      scorePercent: submission.scorePercent,
      correctCount: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      submittedAt: submission.submittedAt,
      examTitle: submission.examPaper.title,
      totalMarksObtained: totalMarksObtained,
      totalMarksAvailable: totalMarksAvailable,
      answers: answersWithMarks
    };
  }

  async startExam(userId: string, examId: string) {
    console.log('Starting exam:', { userId, examId });

    // Get exam details
    const exam = await this.prisma.examPaper.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if user has access to this exam
    if (exam.createdById && exam.createdById !== userId) {
      throw new BadRequestException('You do not have access to this exam');
    }

    // Create a new exam submission
    const submission = await this.prisma.examSubmission.create({
      data: {
        userId,
        examPaperId: examId,
        startedAt: new Date(),
        totalQuestions: exam.questionIds.length,
        correctCount: 0,
        scorePercent: 0
      }
    });

    console.log('Exam started, submission created:', submission.id);

		return {
      submissionId: submission.id,
      examId: exam.id,
      title: exam.title,
      timeLimitMin: exam.timeLimitMin,
      totalQuestions: exam.questionIds.length
		};
	}

  async generateAIPracticeTest(userId: string, config: {
    subjectId: string;
    lessonId?: string;
    topicId?: string;
    subtopicId?: string;
    questionCount: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
    timeLimitMin: number;
    title?: string;
    questionType?: 'PYQ' | 'LMS';
  }) {
    console.log('Generating AI practice test:', { userId, config });

    try {
      // Get subject, topic, and subtopic information for AI generation
      const subject = await this.prisma.subject.findUnique({
        where: { id: config.subjectId }
      });

      let topic = null;
      if (config.topicId) {
        topic = await this.prisma.topic.findUnique({
          where: { id: config.topicId }
        });
      }

      let subtopic = null;
      if (config.subtopicId) {
        subtopic = await this.prisma.subtopic.findUnique({
          where: { id: config.subtopicId }
        });
      }

      let lesson = null;
      if (config.lessonId) {
        lesson = await this.prisma.lesson.findUnique({
          where: { id: config.lessonId }
        });
      }

      if (!subject) {
        throw new BadRequestException('Subject not found');
      }

      // Generate questions using AI
      const aiQuestions = await this.aiService.generateQuestionsWithTips({
        subject: subject.name,
        lesson: lesson?.name,
        topic: topic?.name,
        subtopic: subtopic?.name,
        difficulty: config.difficulty === 'MIXED' ? 'MEDIUM' : config.difficulty,
        questionCount: config.questionCount,
        subjectId: config.subjectId,
        topicId: config.topicId,
        subtopicId: config.subtopicId
      });

      // Create questions in database
      const createdQuestions = [];
      for (const aiQuestion of aiQuestions.questions) {
        const questionData: any = {
          stem: aiQuestion.question,
          explanation: aiQuestion.explanation,
          tip_formula: aiQuestion.tip_formula,
          difficulty: aiQuestion.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          subjectId: config.subjectId,
          lessonId: config.lessonId,
          topicId: config.topicId,
          subtopicId: config.subtopicId,
        };

        // Handle open-ended questions
        if (aiQuestion.isOpenEnded) {
          questionData.isOpenEnded = true;
          questionData.correctNumericAnswer = aiQuestion.correctNumericAnswer;
          questionData.answerTolerance = aiQuestion.answerTolerance || 0.01;
        } else {
          // Handle multiple choice questions
          if (aiQuestion.options && Array.isArray(aiQuestion.options)) {
            questionData.options = {
              create: aiQuestion.options.map((option: any, index: number) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: index + 1
              }))
            };
          }
        }

        const question = await this.prisma.question.create({
          data: questionData,
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          }
        });
        createdQuestions.push(question);
      }

      // Create exam paper
      const examPaper = await this.prisma.examPaper.create({
        data: {
          title: config.title || `AI Practice Test - ${new Date().toLocaleDateString()}`,
          description: 'AI Generated Practice Test',
          questionIds: createdQuestions.map(q => q.id),
          timeLimitMin: config.timeLimitMin,
          examType: 'PRACTICE_EXAM' as any,
          createdById: userId
        }
      });

      console.log('AI practice test created:', { examPaperId: examPaper.id, questionCount: createdQuestions.length });

      return {
        examPaper: {
          id: examPaper.id,
          title: examPaper.title,
          timeLimitMin: examPaper.timeLimitMin,
          examType: examPaper.examType
        },
        questions: createdQuestions,
        totalQuestions: createdQuestions.length
      };
    } catch (error) {
      console.error('Error generating AI practice test:', error);
      throw new BadRequestException(`Failed to generate AI practice test: ${error.message}`);
    }
  }

  async generateManualPracticeTest(userId: string, config: {
    subjectId: string;
    lessonId?: string;
    topicId?: string;
    subtopicId?: string;
    year?: number;
    questionCount: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
    timeLimitMin: number;
    title?: string;
    questionType?: 'PYQ' | 'LMS';
  }) {
    console.log('Generating manual practice test:', { userId, config });

    // Build where clause for question selection
    const where: any = {
      subjectId: config.subjectId
    };

    if (config.lessonId) where.lessonId = config.lessonId;
    if (config.topicId) where.topicId = config.topicId;
    if (config.subtopicId) where.subtopicId = config.subtopicId;
    if (config.difficulty !== 'MIXED') where.difficulty = config.difficulty;
    
    // Filter by question type: PYQ = isPreviousYear: true, LMS = isPreviousYear: false
    if (config.questionType === 'PYQ') {
      where.isPreviousYear = true;
    } else if (config.questionType === 'LMS') {
      where.isPreviousYear = false;
    }
    // If questionType is undefined or 'ALL', no filter is applied
    
    // If year is specified, filter for PYQ questions (yearAppeared is not null)
    const isPYQTest = config.year !== undefined;
    if (isPYQTest) {
      where.yearAppeared = config.year;
    }

    // Get available questions
    const availableQuestions = await this.prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        subject: true,
        topic: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (availableQuestions.length === 0) {
      throw new BadRequestException('No questions available with the specified criteria');
    }

    // Randomly select questions
    const selectedQuestions = availableQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(config.questionCount, availableQuestions.length));

    // Create exam paper
    const examPaper = await this.prisma.examPaper.create({
      data: {
        title: config.title || `${isPYQTest ? 'PYQ' : 'Manual'} Practice Test - ${new Date().toLocaleDateString()}`,
        description: isPYQTest ? 'Previous Year Questions Practice Test' : 'Manual Practice Test from existing questions',
        questionIds: selectedQuestions.map((q: any) => q.id),
        timeLimitMin: config.timeLimitMin,
        examType: isPYQTest ? 'PYQ_PRACTICE' as any : 'PRACTICE_EXAM' as any,
        createdById: userId
      }
    });

    console.log('Manual practice test created:', { examPaperId: examPaper.id, questionCount: selectedQuestions.length });

    // Start the exam (create submission)
    const submission = await this.startExam(userId, examPaper.id);

    return {
      submissionId: submission.submissionId,
      examPaper: {
        id: examPaper.id,
        title: examPaper.title,
        timeLimitMin: examPaper.timeLimitMin,
        examType: examPaper.examType
      },
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length
    };
  }

} 