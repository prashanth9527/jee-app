import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExam(userId: string, examId: string) {
    console.log('Getting exam:', { userId, examId });

    const exam = await this.prisma.examPaper.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if user has access to this exam
    if (exam.createdById !== userId) {
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
      questions: questions.map(question => ({
        id: question.id,
        stem: question.stem,
        options: question.options.map(option => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect
        })),
        explanation: question.explanation,
        difficulty: question.difficulty
      }))
    };
  }

  async submitExam(userId: string, examId: string, answers: Array<{ questionId: string; optionId: string }>) {
    console.log('Submitting exam:', { userId, examId, answerCount: answers.length });

    // Get exam details
    const exam = await this.prisma.examPaper.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if user has access to this exam
    if (exam.createdById !== userId) {
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
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const selectedOption = question.options.find(o => o.id === answer.optionId);
        if (selectedOption && selectedOption.isCorrect) {
          correctCount++;
        }
      }
    }

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    // Create exam submission
    const submission = await this.prisma.examSubmission.create({
      data: {
        userId,
        examPaperId: examId,
        scorePercent,
        correctCount,
        totalQuestions,
        submittedAt: new Date(),
        answers: {
          create: answers.map(answer => ({
            questionId: answer.questionId,
            selectedOptionId: answer.optionId
          }))
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

    console.log('Exam submitted:', { submissionId: submission.id, score: scorePercent });

		return {
      submissionId: submission.id,
      scorePercent,
      correctCount,
      totalQuestions,
				submittedAt: submission.submittedAt,
      answers: submission.answers.map(answer => ({
				questionId: answer.questionId,
        question: answer.question.stem,
        selectedOption: answer.question.options.find(o => o.id === answer.selectedOptionId),
        correctOption: answer.question.options.find(o => o.isCorrect),
        isCorrect: answer.question.options.find(o => o.id === answer.selectedOptionId)?.isCorrect || false
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
      answers: submission.answers.map(answer => ({
        questionId: answer.questionId,
        question: answer.question.stem,
        selectedOption: answer.question.options.find(o => o.id === answer.selectedOptionId),
        correctOption: answer.question.options.find(o => o.isCorrect),
        isCorrect: answer.question.options.find(o => o.id === answer.selectedOptionId)?.isCorrect || false
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
        timeLimitMin: submission.examPaper.timeLimitMin
      },
      questionIds: submission.examPaper.questionIds,
				startedAt: submission.startedAt,
				submittedAt: submission.submittedAt,
				totalQuestions: submission.totalQuestions,
      scorePercent: submission.scorePercent,
				correctCount: submission.correctCount,
      answers: submission.answers.map(answer => ({
				questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.question.options.find(o => o.id === answer.selectedOptionId)?.isCorrect || false
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
        subtopic: true
      }
    });

    return questions.map(question => ({
      id: question.id,
				stem: question.stem,
      explanation: question.explanation,
      tip_formula: question.tip_formula,
      difficulty: question.difficulty,
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
      options: question.options.map(option => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect
      }))
    }));
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
    if (exam.createdById !== userId) {
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
} 