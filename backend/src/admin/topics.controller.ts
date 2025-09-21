import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTopicsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string,
		@Query('lessonId') lessonId?: string
	) {
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause
		const where: any = {};
		
		if (subjectId) {
			where.subjectId = subjectId;
		}

		if (lessonId) {
			where.lessonId = lessonId;
		}
		
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ subject: { name: { contains: search, mode: 'insensitive' } } },
				{ lesson: { name: { contains: search, mode: 'insensitive' } } },
				{ subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
				{ subject: { stream: { code: { contains: search, mode: 'insensitive' } } } }
			];
		}

		// Get total count
		const totalItems = await this.prisma.topic.count({ where });
		const totalPages = Math.ceil(totalItems / limitNum);

		// Get topics with pagination
		const topics = await this.prisma.topic.findMany({ 
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
				lesson: {
					select: {
						id: true,
						name: true,
						order: true
					}
				},
				_count: {
					select: {
						subtopics: true
					}
				}
			},
			orderBy: { order: 'asc' },
			skip,
			take: limitNum
		});

		return {
			topics,
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
	create(@Body() body: { subjectId: string; lessonId: string; name: string; description?: string }) {
		return this.prisma.topic.create({ 
			data: { subjectId: body.subjectId, lessonId: body.lessonId, name: body.name, description: body.description || null },
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
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string; subjectId?: string }) {
		return this.prisma.topic.update({ 
			where: { id }, 
			data: { name: body.name, description: body.description, subjectId: body.subjectId },
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
		return this.prisma.topic.delete({ where: { id } });
	}
} 