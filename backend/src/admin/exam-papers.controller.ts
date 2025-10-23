import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/exam-papers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminExamPapersController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {};
		
		// Add search functionality
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
			];
		}

		// Get total count for pagination
		const totalItems = await this.prisma.examPaper.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get exam papers with pagination and submission count
		const examPapers = await this.prisma.examPaper.findMany({
			where,
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			examPapers,
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
	async findOne(@Param('id') id: string) {
		const examPaper = await this.prisma.examPaper.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						submissions: true
					}
				},
				submissions: {
					include: {
						user: {
							select: {
								id: true,
								fullName: true,
								email: true
							}
						}
					},
					take: 10,
					orderBy: {
						startedAt: 'desc'
					}
				}
			}
		});

		if (!examPaper) {
			throw new BadRequestException('Exam paper not found');
		}

		// Get question details if questionIds exist
		let questions: any[] = [];
		if (examPaper.questionIds && examPaper.questionIds.length > 0) {
			questions = await this.prisma.question.findMany({
				where: {
					id: { in: examPaper.questionIds }
				},
				include: {
					subject: true,
					lesson: true,
					topic: true,
					subtopic: true,
					options: true
				}
			});
		}

		return {
			...examPaper,
			questions
		};
	}

	@Post()
	async create(@Body() body: { 
		title: string; 
		description?: string; 
		subjectIds?: string[]; 
		topicIds?: string[]; 
		subtopicIds?: string[]; 
		questionIds?: string[]; 
		timeLimitMin?: number;
		questionCount?: number;
	}) {
		if (!body.title || !body.title.trim()) {
			throw new BadRequestException('Exam paper title is required');
		}

		const trimmedTitle = body.title.trim();
		
		// Check if exam paper already exists
		const existingPaper = await this.prisma.examPaper.findFirst({
			where: { title: trimmedTitle }
		});

		if (existingPaper) {
			throw new BadRequestException('Exam paper with this title already exists');
		}

		// Generate questions if questionCount is specified and no specific questions provided
		let questionIds = body.questionIds || [];
		if (body.questionCount && body.questionCount > 0 && questionIds.length === 0) {
			const where: any = {};
			if (body.subjectIds?.length) where.subjectId = { in: body.subjectIds };
			if (body.topicIds?.length) where.topicId = { in: body.topicIds };
			if (body.subtopicIds?.length) where.subtopicId = { in: body.subtopicIds };
			
			const questions = await this.prisma.question.findMany({
				where,
				select: { id: true },
				take: body.questionCount,
				orderBy: { createdAt: 'desc' }
			});
			questionIds = questions.map((q: any) => q.id);
		}

		return this.prisma.examPaper.create({ 
			data: {
				title: trimmedTitle,
				description: body.description?.trim() || null,
				subjectIds: body.subjectIds || [],
				topicIds: body.topicIds || [],
				subtopicIds: body.subtopicIds || [],
				questionIds,
				timeLimitMin: body.timeLimitMin || null,
			},
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: { 
		title?: string; 
		description?: string; 
		subjectIds?: string[]; 
		topicIds?: string[]; 
		subtopicIds?: string[]; 
		questionIds?: string[]; 
		timeLimitMin?: number;
		questionCount?: number;
	}) {
		// Check if exam paper exists
		const existingPaper = await this.prisma.examPaper.findUnique({
			where: { id }
		});

		if (!existingPaper) {
			throw new BadRequestException('Exam paper not found');
		}

		// Check for duplicate title if title is being updated
		if (body.title && body.title.trim() !== existingPaper.title) {
			const duplicatePaper = await this.prisma.examPaper.findFirst({
				where: { 
					title: body.title.trim(),
					id: { not: id }
				}
			});

			if (duplicatePaper) {
				throw new BadRequestException('Exam paper with this title already exists');
			}
		}

		// Generate questions if questionCount is specified and no specific questions provided
		let questionIds = body.questionIds;
		if (body.questionCount && body.questionCount > 0 && (!questionIds || questionIds.length === 0)) {
			const where: any = {};
			if (body.subjectIds?.length) where.subjectId = { in: body.subjectIds };
			if (body.topicIds?.length) where.topicId = { in: body.topicIds };
			if (body.subtopicIds?.length) where.subtopicId = { in: body.subtopicIds };
			
			const questions = await this.prisma.question.findMany({
				where,
				select: { id: true },
				take: body.questionCount,
				orderBy: { createdAt: 'desc' }
			});
			questionIds = questions.map((q: any) => q.id);
		}

		return this.prisma.examPaper.update({ 
			where: { id }, 
			data: {
				title: body.title?.trim(),
				description: body.description?.trim(),
				subjectIds: body.subjectIds,
				topicIds: body.topicIds,
				subtopicIds: body.subtopicIds,
				questionIds,
				timeLimitMin: body.timeLimitMin,
			},
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		// Check if exam paper exists
		const examPaper = await this.prisma.examPaper.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});

		if (!examPaper) {
			throw new BadRequestException('Exam paper not found');
		}

		// Check if exam paper has submissions
		if (examPaper._count.submissions > 0) {
			throw new BadRequestException(`Cannot delete exam paper "${examPaper.title}" as it has ${examPaper._count.submissions} submission${examPaper._count.submissions !== 1 ? 's' : ''}. Please delete all submissions first.`);
		}

		return this.prisma.examPaper.delete({ where: { id } });
	}

	@Delete('bulk')
	async bulkDelete(@Body() body: { ids: string[] }) {
		if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
			throw new BadRequestException('Exam paper IDs array is required');
		}

		// Check which exam papers have submissions
		const examPapersWithSubmissions = await this.prisma.examPaper.findMany({
			where: {
				id: { in: body.ids }
			},
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});

		const papersWithSubmissions = examPapersWithSubmissions.filter((paper: any) => paper._count.submissions > 0);
		
		if (papersWithSubmissions.length > 0) {
			const paperTitles = papersWithSubmissions.map((paper: any) => `"${paper.title}"`).join(', ');
			throw new BadRequestException(`Cannot delete the following exam papers as they have submissions: ${paperTitles}. Please delete all submissions first.`);
		}

		const result = await this.prisma.examPaper.deleteMany({
			where: {
				id: {
					in: body.ids
				}
			}
		});
		
		return { 
			ok: true, 
			deletedCount: result.count,
			message: `Successfully deleted ${result.count} exam paper${result.count !== 1 ? 's' : ''}`
		};
	}

	@Post('bulk-delete')
	async bulkDeletePost(@Body() body: { ids: string[] }) {
		if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
			throw new BadRequestException('Exam paper IDs array is required');
		}

		// Check which exam papers have submissions
		const examPapersWithSubmissions = await this.prisma.examPaper.findMany({
			where: {
				id: { in: body.ids }
			},
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});

		const papersWithSubmissions = examPapersWithSubmissions.filter((paper: any) => paper._count.submissions > 0);
		
		if (papersWithSubmissions.length > 0) {
			const paperTitles = papersWithSubmissions.map((paper: any) => `"${paper.title}"`).join(', ');
			throw new BadRequestException(`Cannot delete the following exam papers as they have submissions: ${paperTitles}. Please delete all submissions first.`);
		}

		const result = await this.prisma.examPaper.deleteMany({
			where: {
				id: {
					in: body.ids
				}
			}
		});
		
		return { 
			ok: true, 
			deletedCount: result.count,
			message: `Successfully deleted ${result.count} exam paper${result.count !== 1 ? 's' : ''}`
		};
	}

	@Get(':id/statistics')
	async getStatistics(@Param('id') id: string) {
		const examPaper = await this.prisma.examPaper.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						submissions: true
					}
				}
			}
		});

		if (!examPaper) {
			throw new BadRequestException('Exam paper not found');
		}

		// Get submission statistics
		const submissions = await this.prisma.examSubmission.findMany({
			where: { examPaperId: id },
			select: {
				scorePercent: true,
				correctCount: true,
				totalQuestions: true,
				startedAt: true,
				submittedAt: true
			}
		});

		const completedSubmissions = submissions.filter((s: any) => s.submittedAt);
		const totalSubmissions = submissions.length;
		const completedCount = completedSubmissions.length;

		let averageScore = 0;
		let highestScore = 0;
		let lowestScore = 100;

		if (completedCount > 0) {
		const scores = completedSubmissions.map((s: any) => s.scorePercent || 0);
		averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / completedCount;
			highestScore = Math.max(...scores);
			lowestScore = Math.min(...scores);
		}

		return {
			examPaper,
			statistics: {
				totalSubmissions,
				completedCount,
				averageScore: Math.round(averageScore * 100) / 100,
				highestScore: Math.round(highestScore * 100) / 100,
				lowestScore: Math.round(lowestScore * 100) / 100,
				completionRate: totalSubmissions > 0 ? (completedCount / totalSubmissions) * 100 : 0
			}
		};
	}
} 