import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('expert')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EXPERT')
export class ExpertController {
	constructor(private readonly prisma: PrismaService) {}

	// Questions Management
	@Get('questions')
	async getQuestions(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('difficulty') difficulty?: string
	) {
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		const where: any = {};

		if (search) {
			where.OR = [
				{ stem: { contains: search, mode: 'insensitive' } },
				{ explanation: { contains: search, mode: 'insensitive' } },
				{ subject: { name: { contains: search, mode: 'insensitive' } } },
				{ topic: { name: { contains: search, mode: 'insensitive' } } },
				{ subtopic: { name: { contains: search, mode: 'insensitive' } } }
			];
		}

		if (subjectId) where.subjectId = subjectId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		if (difficulty) where.difficulty = difficulty;

		const [questions, total] = await Promise.all([
			this.prisma.question.findMany({
				where,
				include: {
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
					},
					options: {
						select: {
							id: true,
							text: true,
							isCorrect: true,
							order: true
						},
						orderBy: { order: 'asc' }
					},
					tags: {
						select: {
							tag: {
								select: {
									id: true,
									name: true
								}
							}
						}
					},
					_count: {
						select: {
							answers: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limitNum
			}),
			this.prisma.question.count({ where })
		]);

		return {
			questions,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				pages: Math.ceil(total / limitNum)
			}
		};
	}

	@Get('questions/:id')
	async getQuestion(@Param('id') id: string) {
		const question = await this.prisma.question.findUnique({
			where: { id },
			include: {
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
				},
				options: {
					select: {
						id: true,
						text: true,
						isCorrect: true,
						order: true
					},
					orderBy: { order: 'asc' }
				},
				tags: {
					select: {
						tag: {
							select: {
								id: true,
								name: true
							}
						}
					}
				}
			}
		});

		if (!question) {
			throw new ForbiddenException('Question not found');
		}

		return question;
	}

	@Post('questions')
	async createQuestion(@Body() body: any) {
		const { options, tags, ...questionData } = body;

		const question = await this.prisma.question.create({
			data: {
				...questionData,
				options: {
					create: options.map((option: any, index: number) => ({
						text: option.text,
						isCorrect: option.isCorrect,
						order: index
					}))
				},
				tags: tags && tags.length > 0 ? {
					create: tags.map((tagId: string) => ({
						tag: {
							connect: { id: tagId }
						}
					}))
				} : undefined
			},
			include: {
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
				},
				options: {
					select: {
						id: true,
						text: true,
						isCorrect: true,
						order: true
					},
					orderBy: { order: 'asc' }
				},
				tags: {
					select: {
						tag: {
							select: {
								id: true,
								name: true
							}
						}
					}
				}
			}
		});

		return question;
	}

	@Put('questions/:id')
	async updateQuestion(@Param('id') id: string, @Body() body: any) {
		const { options, tags, ...questionData } = body;

		// Delete existing options and tags
		await this.prisma.questionOption.deleteMany({
			where: { questionId: id }
		});

		await this.prisma.questionTag.deleteMany({
			where: { questionId: id }
		});

		const question = await this.prisma.question.update({
			where: { id },
			data: {
				...questionData,
				options: {
					create: options.map((option: any, index: number) => ({
						text: option.text,
						isCorrect: option.isCorrect,
						order: index
					}))
				},
				tags: tags && tags.length > 0 ? {
					create: tags.map((tagId: string) => ({
						tag: {
							connect: { id: tagId }
						}
					}))
				} : undefined
			},
			include: {
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
				},
				options: {
					select: {
						id: true,
						text: true,
						isCorrect: true,
						order: true
					},
					orderBy: { order: 'asc' }
				},
				tags: {
					select: {
						tag: {
							select: {
								id: true,
								name: true
							}
						}
					}
				}
			}
		});

		return question;
	}

	@Delete('questions/:id')
	async deleteQuestion(@Param('id') id: string) {
		await this.prisma.question.delete({
			where: { id }
		});

		return { message: 'Question deleted successfully' };
	}

	// Question Reports Management
	@Get('question-reports')
	async getQuestionReports(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('status') status?: string,
		@Query('type') type?: string
	) {
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		const where: any = {};

		if (status && status !== 'all') where.status = status;
		if (type && type !== 'all') where.reportType = type;

		const [reports, total] = await Promise.all([
			this.prisma.questionReport.findMany({
				where,
				include: {
					question: {
						select: {
							id: true,
							stem: true,
							explanation: true,
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
							}
						}
					},
					user: {
						select: {
							id: true,
							fullName: true,
							email: true
						}
					},
					suggestedOptions: {
						select: {
							id: true,
							text: true,
							isCorrect: true,
							order: true
						},
						orderBy: { order: 'asc' }
					},
					reviewedBy: {
						select: {
							id: true,
							fullName: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limitNum
			}),
			this.prisma.questionReport.count({ where })
		]);

		return {
			reports,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				pages: Math.ceil(total / limitNum)
			}
		};
	}

	@Get('question-reports/stats')
	async getQuestionReportStats() {
		const [total, pending, approved, rejected] = await Promise.all([
			this.prisma.questionReport.count(),
			this.prisma.questionReport.count({ where: { status: 'PENDING' } }),
			this.prisma.questionReport.count({ where: { status: 'APPROVED' } }),
			this.prisma.questionReport.count({ where: { status: 'REJECTED' } })
		]);

		const typeStats = await this.prisma.questionReport.groupBy({
			by: ['reportType'],
			_count: {
				reportType: true
			}
		});

		return {
			total,
			pending,
			approved,
			rejected,
			typeStats: typeStats.map(stat => ({
				type: stat.reportType,
				count: stat._count.reportType
			}))
		};
	}

	@Get('question-reports/:id')
	async getQuestionReport(@Param('id') id: string) {
		const report = await this.prisma.questionReport.findUnique({
			where: { id },
			include: {
				question: {
					select: {
						id: true,
						stem: true,
						explanation: true,
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
						}
					}
				},
				user: {
					select: {
						id: true,
						fullName: true,
						email: true
					}
				},
				suggestedOptions: {
					select: {
						id: true,
						text: true,
						isCorrect: true,
						order: true
					},
					orderBy: { order: 'asc' }
				},
				reviewedBy: {
					select: {
						id: true,
						fullName: true
					}
				}
			}
		});

		if (!report) {
			throw new ForbiddenException('Report not found');
		}

		return report;
	}

	@Post('question-reports/:id/review')
	async reviewQuestionReport(
		@Param('id') id: string,
		@Body() body: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string },
		@Req() req: any
	) {
		const reviewerId = req.user.id;

		const report = await this.prisma.questionReport.findUnique({
			where: { id },
			include: { question: true }
		});

		if (!report) {
			throw new ForbiddenException('Report not found');
		}

		if (report.status !== 'PENDING') {
			throw new ForbiddenException('Report has already been reviewed');
		}

		const result = await this.prisma.$transaction(async (prisma) => {
			const updatedReport = await prisma.questionReport.update({
				where: { id },
				data: {
					status: body.status,
					reviewedById: reviewerId,
					reviewedAt: new Date(),
					reviewNotes: body.reviewNotes
				}
			});

			// If approved and it's a suggested explanation, add it to alternative explanations
			if (body.status === 'APPROVED' && report.reportType === 'SUGGESTED_EXPLANATION' && report.alternativeExplanation) {
				await prisma.questionAlternativeExplanation.create({
					data: {
						questionId: report.questionId,
						explanation: report.alternativeExplanation,
						source: 'REPORT_APPROVED',
						reportId: report.id
					}
				});
			}

			return updatedReport;
		});

		return {
			message: `Report ${body.status.toLowerCase()} successfully`,
			report: result
		};
	}

	// Get subjects, topics, subtopics for question management
	@Get('subjects')
	async getSubjects() {
		return this.prisma.subject.findMany({
			include: {
				stream: {
					select: {
						id: true,
						name: true,
						code: true
					}
				},
				_count: {
					select: {
						questions: true
					}
				}
			},
			orderBy: { name: 'asc' }
		});
	}

	@Get('topics')
	async getTopics(@Query('subjectId') subjectId?: string) {
		const where: any = {};
		if (subjectId) where.subjectId = subjectId;

		return this.prisma.topic.findMany({
			where,
			include: {
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
				_count: {
					select: {
						questions: true
					}
				}
			},
			orderBy: { name: 'asc' }
		});
	}

	@Get('subtopics')
	async getSubtopics(@Query('topicId') topicId?: string) {
		const where: any = {};
		if (topicId) where.topicId = topicId;

		return this.prisma.subtopic.findMany({
			where,
			include: {
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
				_count: {
					select: {
						questions: true
					}
				}
			},
			orderBy: { name: 'asc' }
		});
	}

	@Get('tags')
	async getTags() {
		return this.prisma.tag.findMany({
			orderBy: { name: 'asc' }
		});
	}
} 