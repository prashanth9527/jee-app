import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { parse } from 'fast-csv';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminQuestionsController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
		private readonly aiService: AiService
	) {}

	@Get()
	async list(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string,
		@Query('lessonId') lessonId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('subjectIds') subjectIds?: string,
		@Query('lessonIds') lessonIds?: string,
		@Query('topicIds') topicIds?: string,
		@Query('subtopicIds') subtopicIds?: string,
		@Query('difficulty') difficulty?: string,
		@Query('status') status?: string,
		@Query('reviewMode') reviewMode?: string,
		@Query('parentQuestionId') parentQuestionId?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {
			createdById: null
		};
		
		// Filter by parentQuestionId
		if (parentQuestionId === 'null') {
			where.parentQuestionId = null;
		} else if (parentQuestionId) {
			where.parentQuestionId = parentQuestionId;
		}
		
		// Special filtering for review mode (question-review page)
		if (reviewMode === 'true') {
			where.OR = [
				{ status: 'underreview' },
				{ 
					AND: [
						{ isOpenEnded: true },
						{ correctNumericAnswer: null }
					]
				}
			];
		}
		
		// Support both single ID and multiple IDs
		if (subjectId) where.subjectId = subjectId;
		if (lessonId) where.lessonId = lessonId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		
		// Support multiple IDs (comma-separated)
		if (subjectIds) {
			const ids = subjectIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.subjectId = { in: ids };
		}
		if (lessonIds) {
			const ids = lessonIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.lessonId = { in: ids };
		}
		if (topicIds) {
			const ids = topicIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.topicId = { in: ids };
		}
		if (subtopicIds) {
			const ids = subtopicIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.subtopicId = { in: ids };
		}
		
		if (difficulty) where.difficulty = difficulty;
		if (status) where.status = status;
		
		// Add search functionality
		if (search) {
			where.OR = [
				{ stem: { contains: search, mode: 'insensitive' } },
				{ explanation: { contains: search, mode: 'insensitive' } },
				{ subject: { name: { contains: search, mode: 'insensitive' } } },
				{ subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
				{ subject: { stream: { code: { contains: search, mode: 'insensitive' } } } },
				{ lesson: { name: { contains: search, mode: 'insensitive' } } },
				{ topic: { name: { contains: search, mode: 'insensitive' } } },
				{ topic: { lesson: { name: { contains: search, mode: 'insensitive' } } } },
				{ topic: { subject: { name: { contains: search, mode: 'insensitive' } } } },
				{ topic: { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } } },
				{ topic: { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { name: { contains: search, mode: 'insensitive' } } },
				{ subtopic: { topic: { name: { contains: search, mode: 'insensitive' } } } },
				{ subtopic: { topic: { lesson: { name: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { topic: { subject: { name: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { topic: { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } } } },
				{ subtopic: { topic: { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } } } },
				// { tags: { tag: { name: { contains: search, mode: 'insensitive' } } } }
			];
		}

		// Get total count for pagination
		const totalItems = await this.prisma.question.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get questions with pagination
		const questions = await this.prisma.question.findMany({
			where,
			include: { 
				options: true, 
				tags: { include: { tag: true } },
				subject: {
					select: {
						id: true,
						name: true,
						stream: {
							select: {
								id: true,
								name: true,
								code: true
							}
						}
					}
				},
				lesson: {
					select: {
						id: true,
						name: true,
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				topic: {
					select: {
						id: true,
						name: true,
						lesson: {
							select: {
								id: true,
								name: true,
								subject: {
									select: {
										id: true,
										name: true,
										stream: {
											select: {
												id: true,
												name: true,
												code: true
											}
										}
									}
								}
							}
						},
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				subtopic: {
					select: {
						id: true,
						name: true,
						topic: {
							select: {
								id: true,
								name: true,
								lesson: {
									select: {
										id: true,
										name: true,
										subject: {
											select: {
												id: true,
												name: true,
												stream: {
													select: {
														id: true,
														name: true,
														code: true
													}
												}
											}
										}
									}
								},
								subject: {
									select: {
										id: true,
										name: true,
										stream: {
											select: {
												id: true,
												name: true,
												code: true
											}
										}
									}
								}
							}
						}
					}
				}
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			questions,
			pagination: {
				currentPage,
				totalPages,
				totalItems,
				itemsPerPage,
				hasNextPage: currentPage < totalPages,
				hasPreviousPage: currentPage > 1
			}
		};
	}

	@Get('open-ended')
	async listOpenEndedQuestions(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string,
		@Query('lessonId') lessonId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('subjectIds') subjectIds?: string,
		@Query('lessonIds') lessonIds?: string,
		@Query('topicIds') topicIds?: string,
		@Query('subtopicIds') subtopicIds?: string,
		@Query('difficulty') difficulty?: string,
		@Query('status') status?: string,
		@Query('reviewMode') reviewMode?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {
			createdById: null,
			parentQuestionId: null,
			questionType: 'OPEN_ENDED'
		};
		
		// Special filtering for review mode (question-review page)
		if (reviewMode === 'true') {
			where.OR = [
				{ status: 'underreview' },
				{ 
					AND: [
						{ isOpenEnded: true },
						{ correctNumericAnswer: null }
					]
				}
			];
		}
		
		// For open-ended questions, include questions without options and without numeric answers
		where.AND = [
			...(where.AND || []),
			{
				OR: [
					{ isOpenEnded: true },
					{
						options: {
							none: {}
						}
					}
				]
			},
			{
				correctNumericAnswer: null
			}
		];
		
		// Support both single ID and multiple IDs
		if (subjectId) where.subjectId = subjectId;
		if (lessonId) where.lessonId = lessonId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		
		// Support multiple IDs (comma-separated)
		if (subjectIds) {
			const ids = subjectIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.subjectId = { in: ids };
		}
		if (lessonIds) {
			const ids = lessonIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.lessonId = { in: ids };
		}
		if (topicIds) {
			const ids = topicIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.topicId = { in: ids };
		}
		if (subtopicIds) {
			const ids = subtopicIds.split(',').filter(id => id.trim());
			if (ids.length > 0) where.subtopicId = { in: ids };
		}
		
		if (difficulty) where.difficulty = difficulty;
		if (status) where.status = status;
		
		// Add search functionality
		if (search) {
			where.OR = [
				{ stem: { contains: search, mode: 'insensitive' } },
				{ explanation: { contains: search, mode: 'insensitive' } },
				{ subject: { name: { contains: search, mode: 'insensitive' } } },
				{ subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
				{ subject: { stream: { code: { contains: search, mode: 'insensitive' } } } },
				{ lesson: { name: { contains: search, mode: 'insensitive' } } },
				{ topic: { name: { contains: search, mode: 'insensitive' } } },
				{ topic: { lesson: { name: { contains: search, mode: 'insensitive' } } } },
				{ topic: { subject: { name: { contains: search, mode: 'insensitive' } } } },
				{ topic: { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } } },
				{ topic: { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { name: { contains: search, mode: 'insensitive' } } },
				{ subtopic: { topic: { name: { contains: search, mode: 'insensitive' } } } },
				{ subtopic: { topic: { lesson: { name: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { topic: { subject: { name: { contains: search, mode: 'insensitive' } } } } },
				{ subtopic: { topic: { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } } } },
				{ subtopic: { topic: { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } } } },
				// { tags: { tag: { name: { contains: search, mode: 'insensitive' } } } }
			];
		}

		// Get total count for pagination
		const totalItems = await this.prisma.question.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get questions with pagination
		const questions = await this.prisma.question.findMany({
			where,
			include: { 
				options: true, 
				tags: { include: { tag: true } },
				subject: {
					select: {
						id: true,
						name: true,
						stream: {
							select: {
								id: true,
								name: true,
								code: true
							}
						}
					}
				},
				lesson: {
					select: {
						id: true,
						name: true,
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				topic: {
					select: {
						id: true,
						name: true,
						lesson: {
							select: {
								id: true,
								name: true,
								subject: {
									select: {
										id: true,
										name: true,
										stream: {
											select: {
												id: true,
												name: true,
												code: true
											}
										}
									}
								}
							}
						},
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				subtopic: {
					select: {
						id: true,
						name: true,
						topic: {
							select: {
								id: true,
								name: true,
								lesson: {
									select: {
										id: true,
										name: true,
										subject: {
											select: {
												id: true,
												name: true,
												stream: {
													select: {
														id: true,
														name: true,
														code: true
													}
												}
											}
										}
									}
								},
								subject: {
									select: {
										id: true,
										name: true,
										stream: {
											select: {
												id: true,
												name: true,
												code: true
											}
										}
									}
								}
							}
						}
					}
				}
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			questions,
			pagination: {
				currentPage,
				totalPages,
				totalItems,
				itemsPerPage,
				hasNextPage: currentPage < totalPages,
				hasPreviousPage: currentPage > 1
			}
		};
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.prisma.question.findUnique({
			where: { id },
			include: { 
				options: true, 
				tags: { include: { tag: true } },
				subject: {
					select: {
						id: true,
						name: true,
						stream: {
							select: {
								id: true,
								name: true,
								code: true
							}
						}
					}
				},
				lesson: {
					select: {
						id: true,
						name: true,
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				topic: {
					select: {
						id: true,
						name: true,
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						}
					}
				},
				subtopic: {
					select: {
						id: true,
						name: true,
						topic: {
							select: {
								id: true,
								name: true,
								subject: {
									select: {
										id: true,
										name: true,
										stream: {
											select: {
												id: true,
												name: true,
												code: true
											}
										}
									}
								}
							}
						}
					}
				}
			}
		});
	}

	@Post()
	async create(@Body() body: { 
		stem: string; 
		explanation?: string; 
		tip_formula?: string; 
		difficulty?: 'EASY'|'MEDIUM'|'HARD'; 
		yearAppeared?: number; 
		isPreviousYear?: boolean; 
		subjectId?: string; 
		lessonId?: string; 
		topicId?: string; 
		subtopicId?: string; 
		options: { text: string; isCorrect?: boolean; order?: number }[]; 
		tagNames?: string[];
		// Question type and marks system
		questionType?: 'MCQ_SINGLE'|'MCQ_MULTIPLE'|'OPEN_ENDED'|'PARAGRAPH';
		parentQuestionId?: string;
		allowPartialMarking?: boolean;
		fullMarks?: number;
		partialMarks?: number;
		negativeMarks?: number;
		// Open-ended question fields (legacy support)
		isOpenEnded?: boolean;
		correctNumericAnswer?: number;
		answerTolerance?: number;
	}) {
		// Determine question type based on legacy isOpenEnded field or new questionType
		let questionType = body.questionType || 'MCQ_SINGLE';
		if (body.isOpenEnded && !body.questionType) {
			questionType = 'OPEN_ENDED';
		}

		const question = await this.prisma.question.create({ 
			data: {
				stem: body.stem,
				explanation: body.explanation || null,
				tip_formula: body.tip_formula || null,
				difficulty: body.difficulty || 'MEDIUM',
				yearAppeared: body.yearAppeared || null,
				isPreviousYear: !!body.isPreviousYear,
				subjectId: body.subjectId || null,
				lessonId: body.lessonId || null,
				topicId: body.topicId || null,
				subtopicId: body.subtopicId || null,
				// New question type and marks system
				questionType: questionType as any,
				parentQuestionId: body.parentQuestionId || null,
				allowPartialMarking: body.allowPartialMarking || false,
				fullMarks: body.fullMarks || 4.0,
				partialMarks: body.partialMarks || 2.0,
				negativeMarks: body.negativeMarks || -2.0,
				// Handle open-ended questions (legacy support)
				isOpenEnded: body.isOpenEnded || questionType === 'OPEN_ENDED',
				correctNumericAnswer: body.correctNumericAnswer || null,
				answerTolerance: body.answerTolerance || 0.01,
				options: { 
					create: (body.options || []).map((o: any) => ({ 
						text: o.text, 
						isCorrect: !!o.isCorrect, 
						order: o.order ?? 0 
					})) 
				},
			}
		});
		
		if (body.tagNames?.length) {
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({ 
					where: { name }, 
					update: {}, 
					create: { name } 
				});
				await this.prisma.questionTag.create({ 
					data: { questionId: question.id, tagId: tag.id } 
				});
			}
		}
		
		return this.prisma.question.findUnique({ 
			where: { id: question.id }, 
			include: { options: true, tags: { include: { tag: true } } } 
		});
	}
	

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: { 
		stem?: string; 
		explanation?: string; 
		tip_formula?: string; 
		difficulty?: 'EASY'|'MEDIUM'|'HARD'; 
		yearAppeared?: number; 
		isPreviousYear?: boolean; 
		subjectId?: string; 
		lessonId?: string; 
		topicId?: string; 
		subtopicId?: string; 
		status?: 'approved'|'underreview'|'rejected';
		options?: { id?: string; text: string; isCorrect?: boolean; order?: number }[]; 
		tagNames?: string[];
		// Question type and marks system
		questionType?: 'MCQ_SINGLE'|'MCQ_MULTIPLE'|'OPEN_ENDED'|'PARAGRAPH';
		parentQuestionId?: string;
		allowPartialMarking?: boolean;
		fullMarks?: number;
		partialMarks?: number;
		negativeMarks?: number;
		// Open-ended question fields (legacy support)
		isOpenEnded?: boolean;
		correctNumericAnswer?: number;
		answerTolerance?: number;
	}) {
		// Determine question type based on legacy isOpenEnded field or new questionType
		let questionType = body.questionType;
		if (body.isOpenEnded && !body.questionType) {
			questionType = 'OPEN_ENDED';
		}

		await this.prisma.question.update({ 
			where: { id }, 
			data: {
				stem: body.stem,
				explanation: body.explanation,
				tip_formula: body.tip_formula,
				difficulty: body.difficulty,
				yearAppeared: body.yearAppeared,
				isPreviousYear: body.isPreviousYear,
				subjectId: body.subjectId,
				lessonId: body.lessonId,
				topicId: body.topicId,
				subtopicId: body.subtopicId,
				status: body.status,
				// New question type and marks system
				questionType: questionType as any,
				parentQuestionId: body.parentQuestionId,
				allowPartialMarking: body.allowPartialMarking,
				fullMarks: body.fullMarks,
				partialMarks: body.partialMarks,
				negativeMarks: body.negativeMarks,
				// Handle open-ended questions (legacy support)
				isOpenEnded: body.isOpenEnded,
				correctNumericAnswer: body.correctNumericAnswer,
				answerTolerance: body.answerTolerance,
			}
		});
		
		// Handle options based on question type
		if (body.options && (questionType === 'MCQ_SINGLE' || questionType === 'MCQ_MULTIPLE')) {
			await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
			await this.prisma.questionOption.createMany({ 
				data: body.options.map((o: any) => ({ 
					questionId: id, 
					text: o.text, 
					isCorrect: !!o.isCorrect, 
					order: o.order ?? 0 
				})) 
			});
		} else if (questionType === 'OPEN_ENDED' || questionType === 'PARAGRAPH') {
			// Clear options for open-ended and paragraph questions
			await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
		}
		
		if (body.tagNames) {
			await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({ 
					where: { name }, 
					update: {}, 
					create: { name } 
				});
				await this.prisma.questionTag.create({ 
					data: { questionId: id, tagId: tag.id } 
				});
			}
		}
		
		return this.prisma.question.findUnique({ 
			where: { id }, 
			include: { options: true, tags: { include: { tag: true } } } 
		});
	}

	@Put(':id/status')
	async updateStatus(@Param('id') id: string, @Body() body: { status: 'approved'|'underreview'|'rejected' }) {
		return this.prisma.question.update({
			where: { id },
			data: { status: body.status }
		});
	}

	@Post(':id/generate-answer')
	async generateAnswer(@Param('id') id: string) {
		// Get the question with all related data
		const question = await this.prisma.question.findUnique({
			where: { id },
			include: {
				options: true,
				subject: {
					select: {
						name: true,
						stream: {
							select: {
								name: true,
								code: true
							}
						}
					}
				},
				topic: {
					select: {
						name: true
					}
				},
				subtopic: {
					select: {
						name: true
					}
				}
			}
		});

		if (!question) {
			throw new BadRequestException('Question not found');
		}

		// Prepare context for AI
		const context = {
			subject: question.subject?.name || 'Mathematics',
			stream: question.subject?.stream?.code || 'JEE',
			topic: question.topic?.name || '',
			subtopic: question.subtopic?.name || '',
			difficulty: question.difficulty,
			question: question.stem,
			explanation: question.explanation || '',
			existingOptions: question.options.map(opt => ({
				text: opt.text,
				isCorrect: opt.isCorrect,
				order: opt.order
			}))
		};

		// Call AI service to generate answer
		
		try {
			const aiResponse = await this.aiService.generateQuestionAnswer({
				question: question.stem,
				explanation: question.explanation || '',
				subject: question.subject?.name || 'Mathematics',
				topic: question.topic?.name || '',
				subtopic: question.subtopic?.name || '',
				difficulty: question.difficulty,
				existingOptions: question.options
			});

			// Update the question with AI-generated answer
			const updateData: any = {
				explanation: aiResponse.explanation || question.explanation,
				tip_formula: aiResponse.tip_formula || question.tip_formula,
			};

			// Handle different question types
			if (aiResponse.isOpenEnded) {
				// Open-ended question: update numeric answer fields
				updateData.isOpenEnded = true;
				updateData.correctNumericAnswer = aiResponse.correctNumericAnswer;
				updateData.answerTolerance = aiResponse.answerTolerance || 0.01;
				
				// Remove all options for open-ended questions
				updateData.options = {
					deleteMany: {}
				};
			} else {
				// MCQ question: update options
				updateData.isOpenEnded = false;
				updateData.options = {
					deleteMany: {},
					create: (aiResponse.options || []).map((option: any, index: number) => ({
						text: option.text,
						isCorrect: option.isCorrect,
						order: index
					}))
				};
			}

			const updatedQuestion = await this.prisma.question.update({
				where: { id },
				data: updateData,
				include: {
					options: true,
					subject: {
						select: {
							name: true,
							stream: {
								select: {
									name: true,
									code: true
								}
							}
						}
					},
					topic: {
						select: {
							name: true
						}
					},
					subtopic: {
						select: {
							name: true
						}
					}
				}
			});

			return {
				success: true,
				message: 'Answer generated successfully',
				question: updatedQuestion
			};

		} catch (error) {
			console.error('AI Answer Generation Error:', error);
			throw new BadRequestException('Failed to generate answer with AI. Please try again.');
		}
	}

	

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.question.delete({ where: { id } });
	}

	@Delete('bulk')
	async bulkDelete(@Body() body: { ids: string[] }) {
		if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
			throw new BadRequestException('Question IDs array is required');
		}
		
		const result = await this.prisma.question.deleteMany({
			where: {
				id: {
					in: body.ids
				}
			}
		});
		
		return { 
			ok: true, 
			deletedCount: result.count,
			message: `Successfully deleted ${result.count} question${result.count !== 1 ? 's' : ''}`
		};
	}

	@Post('bulk-delete')
	async bulkDeletePost(@Body() body: { ids: string[] }) {
		if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
			throw new BadRequestException('Question IDs array is required');
		}
		
		const result = await this.prisma.question.deleteMany({
			where: {
				id: {
					in: body.ids
				}
			}
		});
		
		return { 
			ok: true, 
			deletedCount: result.count,
			message: `Successfully deleted ${result.count} question${result.count !== 1 ? 's' : ''}`
		};
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	async importCsv(@UploadedFile() file?: Express.Multer.File) {
		if (!file || !file.buffer) throw new BadRequestException('File is required');
		const content = file.buffer.toString('utf8');
		const rows: any[] = [];
		await new Promise<void>((resolve, reject) => {
			parseString(content, rows, (err) => err ? reject(err) : resolve());
		});
		for (const r of rows) {
			let options: { text: string; isCorrect?: boolean; order?: number }[] = [];
			let tagNames: string[] = [];
			try { options = JSON.parse(r.options || '[]'); } catch {}
			try { tagNames = JSON.parse(r.tagNames || '[]'); } catch {}
			await this.create({
				stem: r.stem,
				explanation: r.explanation,
				difficulty: (r.difficulty as any) || 'MEDIUM',
				yearAppeared: r.yearAppeared ? Number(r.yearAppeared) : undefined,
				isPreviousYear: r.isPreviousYear === 'true' || r.isPreviousYear === true,
				subjectId: r.subjectId || undefined,
				lessonId: r.lessonId || undefined,
				topicId: r.topicId || undefined,
				subtopicId: r.subtopicId || undefined,
				options,
				tagNames,
				// Handle open-ended questions from CSV
				isOpenEnded: r.isOpenEnded === 'true' || r.isOpenEnded === true,
				correctNumericAnswer: r.correctNumericAnswer ? Number(r.correctNumericAnswer) : undefined,
				answerTolerance: r.answerTolerance ? Number(r.answerTolerance) : undefined,
			});
		}
		return { ok: true, count: rows.length };
	}

	@Get('export')
	async exportCsv(@Res() res: Response) {
		const questions = await this.prisma.question.findMany({ 
			include: { options: true, tags: { include: { tag: true } } } 
		});
		const header = ['stem','explanation','difficulty','yearAppeared','isPreviousYear','subjectId','lessonId','topicId','subtopicId','options','tagNames'];
		const escape = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
		const lines = [header.join(',')];
		for (const q of questions as any[]) {
			const record = [
				escape(q.stem),
				escape(q.explanation || ''),
				escape(q.difficulty),
				escape(q.yearAppeared || ''),
				escape(q.isPreviousYear),
				escape(q.subjectId || ''),
				escape(q.lessonId || ''),
				escape(q.topicId || ''),
				escape(q.subtopicId || ''),
				escape(JSON.stringify((q.options || []).map((o: any) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })))),
				escape(JSON.stringify((q.tags || []).map((t: any) => t.tag.name))),
			];
			lines.push(record.join(','));
		}
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
		res.send(lines.join('\n'));
	}

	// New endpoints for paragraph-based questions
	@Get('paragraph/:id')
	async getParagraphWithSubQuestions(@Param('id') id: string) {
		const paragraph = await this.prisma.question.findUnique({
			where: { id },
			include: {
				subQuestions: {
					include: {
						options: true,
						tags: { include: { tag: true } },
						subject: {
							select: {
								id: true,
								name: true,
								stream: {
									select: {
										id: true,
										name: true,
										code: true
									}
								}
							}
						},
						topic: {
							select: {
								id: true,
								name: true
							}
						},
						subtopic: {
							select: {
								id: true,
								name: true
							}
						}
					},
					orderBy: { createdAt: 'asc' }
				},
				subject: {
					select: {
						id: true,
						name: true,
						stream: {
							select: {
								id: true,
								name: true,
								code: true
							}
						}
					}
				},
				topic: {
					select: {
						id: true,
						name: true
					}
				},
				subtopic: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		if (!paragraph || paragraph.questionType !== 'PARAGRAPH') {
			throw new BadRequestException('Paragraph question not found');
		}

		return paragraph;
	}

	@Post('paragraph')
	async createParagraphQuestion(@Body() body: {
		stem: string;
		explanation?: string;
		tip_formula?: string;
		difficulty?: 'EASY'|'MEDIUM'|'HARD';
		yearAppeared?: number;
		isPreviousYear?: boolean;
		subjectId?: string;
		lessonId?: string;
		topicId?: string;
		subtopicId?: string;
		tagNames?: string[];
		subQuestions: {
			stem: string;
			explanation?: string;
			questionType: 'MCQ_SINGLE'|'MCQ_MULTIPLE'|'OPEN_ENDED';
			options?: { text: string; isCorrect?: boolean; order?: number }[];
			correctNumericAnswer?: number;
			answerTolerance?: number;
			allowPartialMarking?: boolean;
			fullMarks?: number;
			partialMarks?: number;
			negativeMarks?: number;
		}[];
	}) {
		// Create the paragraph question
		const paragraph = await this.prisma.question.create({
			data: {
				stem: body.stem,
				explanation: body.explanation || null,
				tip_formula: body.tip_formula || null,
				difficulty: body.difficulty || 'MEDIUM',
				yearAppeared: body.yearAppeared || null,
				isPreviousYear: !!body.isPreviousYear,
				subjectId: body.subjectId || null,
				lessonId: body.lessonId || null,
				topicId: body.topicId || null,
				subtopicId: body.subtopicId || null,
				questionType: 'PARAGRAPH',
				allowPartialMarking: false,
				fullMarks: 4.0,
				partialMarks: 2.0,
				negativeMarks: -2.0,
			}
		});

		// Create sub-questions
		const subQuestions = [];
		for (const subQ of body.subQuestions) {
			const subQuestion = await this.prisma.question.create({
				data: {
					stem: subQ.stem,
					explanation: subQ.explanation || null,
					difficulty: body.difficulty || 'MEDIUM',
					yearAppeared: body.yearAppeared || null,
					isPreviousYear: !!body.isPreviousYear,
					subjectId: body.subjectId || null,
					lessonId: body.lessonId || null,
					topicId: body.topicId || null,
					subtopicId: body.subtopicId || null,
					questionType: subQ.questionType,
					parentQuestionId: paragraph.id,
					allowPartialMarking: subQ.allowPartialMarking || false,
					fullMarks: subQ.fullMarks || 4.0,
					partialMarks: subQ.partialMarks || 2.0,
					negativeMarks: subQ.negativeMarks || -2.0,
					correctNumericAnswer: subQ.correctNumericAnswer || null,
					answerTolerance: subQ.answerTolerance || 0.01,
					options: {
						create: (subQ.options || []).map((o: any) => ({
							text: o.text,
							isCorrect: !!o.isCorrect,
							order: o.order ?? 0
						}))
					}
				}
			});
			subQuestions.push(subQuestion);
		}

		// Handle tags for paragraph
		if (body.tagNames?.length) {
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({
					where: { name },
					update: {},
					create: { name }
				});
				await this.prisma.questionTag.create({
					data: { questionId: paragraph.id, tagId: tag.id }
				});
			}
		}

		return {
			paragraph,
			subQuestions
		};
	}

	@Put('paragraph/:id')
	async updateParagraphQuestion(@Param('id') id: string, @Body() body: {
		stem: string;
		explanation?: string;
		tip_formula?: string;
		difficulty?: 'EASY'|'MEDIUM'|'HARD';
		yearAppeared?: number;
		isPreviousYear?: boolean;
		subjectId?: string;
		lessonId?: string;
		topicId?: string;
		subtopicId?: string;
		tagNames?: string[];
		subQuestions: {
			stem: string;
			explanation?: string;
			questionType: 'MCQ_SINGLE'|'MCQ_MULTIPLE'|'OPEN_ENDED';
			options?: { text: string; isCorrect?: boolean; order?: number }[];
			correctNumericAnswer?: number;
			answerTolerance?: number;
			allowPartialMarking?: boolean;
			fullMarks?: number;
			partialMarks?: number;
			negativeMarks?: number;
		}[];
	}) {
		// Verify the question exists and is a paragraph question
		const existingQuestion = await this.prisma.question.findUnique({
			where: { id },
			include: { subQuestions: true }
		});

		if (!existingQuestion || existingQuestion.questionType !== 'PARAGRAPH') {
			throw new BadRequestException('Paragraph question not found');
		}

		// Update the main paragraph question
		const updatedParagraph = await this.prisma.question.update({
			where: { id },
			data: {
				stem: body.stem,
				explanation: body.explanation,
				tip_formula: body.tip_formula,
				difficulty: body.difficulty,
				yearAppeared: body.yearAppeared,
				isPreviousYear: body.isPreviousYear,
				subjectId: body.subjectId,
				lessonId: body.lessonId,
				topicId: body.topicId,
				subtopicId: body.subtopicId,
			}
		});

		// Delete existing sub-questions
		await this.prisma.question.deleteMany({
			where: { parentQuestionId: id }
		});

		// Create new sub-questions
		const subQuestions = [];
		for (const subQ of body.subQuestions) {
			const subQuestion = await this.prisma.question.create({
				data: {
					stem: subQ.stem,
					explanation: subQ.explanation,
					questionType: subQ.questionType,
					parentQuestionId: id,
					subjectId: body.subjectId,
					lessonId: body.lessonId,
					topicId: body.topicId,
					subtopicId: body.subtopicId,
					difficulty: body.difficulty,
					yearAppeared: body.yearAppeared,
					isPreviousYear: body.isPreviousYear,
					allowPartialMarking: subQ.allowPartialMarking,
					fullMarks: subQ.fullMarks,
					partialMarks: subQ.partialMarks,
					negativeMarks: subQ.negativeMarks,
					correctNumericAnswer: subQ.correctNumericAnswer,
					answerTolerance: subQ.answerTolerance,
					status: 'approved'
				}
			});

			// Add options for MCQ sub-questions
			if (subQ.options && subQ.questionType !== 'OPEN_ENDED') {
				await this.prisma.questionOption.createMany({
					data: subQ.options.map((opt, index) => ({
						questionId: subQuestion.id,
						text: opt.text,
						isCorrect: !!opt.isCorrect,
						order: opt.order ?? index
					}))
				});
			}

			subQuestions.push(subQuestion);
		}

		// Handle tags for paragraph
		if (body.tagNames && body.tagNames.length > 0) {
			await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({ 
					where: { name }, 
					update: {}, 
					create: { name } 
				});
				await this.prisma.questionTag.create({ 
					data: { questionId: id, tagId: tag.id } 
				});
			}
		}

		// Return the updated paragraph with sub-questions
		return this.prisma.question.findUnique({
			where: { id },
			include: {
				subQuestions: {
					include: {
						options: true
					}
				},
				tags: { include: { tag: true } }
			}
		});
	}

	
}

function parseString(content: string, rows: any[], cb: (err?: Error) => void) {
	const stream = Readable.from([content]);
	stream
		.pipe(parse({ headers: true }))
		.on('error', (error) => cb(error as any))
		.on('data', (row) => rows.push(row))
		.on('end', () => cb());
}

