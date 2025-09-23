import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminLessonsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string
	) {
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause
		const where: any = {};
		
		if (subjectId) {
			where.subjectId = subjectId;
		}
		
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ subject: { name: { contains: search, mode: 'insensitive' } } },
				{ subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
				{ subject: { stream: { code: { contains: search, mode: 'insensitive' } } } }
			];
		}

		// Get total count
		const totalItems = await this.prisma.lesson.count({ where });
		const totalPages = Math.ceil(totalItems / limitNum);

		// Get lessons with pagination
		const lessons = await this.prisma.lesson.findMany({ 
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
						topics: true
					}
				}
			},
			orderBy: { order: 'asc' },
			skip,
			take: limitNum
		});

		return {
			lessons,
			pagination: {
				currentPage: pageNum,
				totalPages,
				totalItems,
				itemsPerPage: limitNum,
				hasNextPage: pageNum < totalPages,
				hasPreviousPage: pageNum > 1
			}
		};
	}

	@Post()
	create(@Body() body: { subjectId: string; name: string; description?: string; order?: number }) {
		return this.prisma.lesson.create({ 
			data: { 
				subjectId: body.subjectId, 
				name: body.name, 
				description: body.description || null,
				order: body.order || 0
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
				}
			}
		});
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string; subjectId?: string; order?: number }) {
		return this.prisma.lesson.update({ 
			where: { id }, 
			data: { 
				name: body.name, 
				description: body.description, 
				subjectId: body.subjectId,
				order: body.order
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
				}
			}
		});
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.lesson.delete({ where: { id } });
	}

	@Get(':id/topics')
	async getLessonTopics(@Param('id') id: string) {
		return this.prisma.topic.findMany({
			where: { lessonId: id },
			include: {
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
				_count: {
					select: {
						subtopics: true
					}
				}
			},
			orderBy: { order: 'asc' }
		});
	}
}






