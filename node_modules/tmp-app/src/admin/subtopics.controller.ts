import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/subtopics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSubtopicsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('topicId') topicId?: string,
		@Query('subjectId') subjectId?: string
	) {
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause
		const where: any = {};
		
		if (topicId) {
			where.topicId = topicId;
		}
		
		if (subjectId) {
			where.topic = {
				subjectId: subjectId
			};
		}
		
		if (search) {
			where.OR = [
				{
					name: {
						contains: search,
						mode: 'insensitive'
					}
				},
				{
					topic: {
						name: {
							contains: search,
							mode: 'insensitive'
						}
					}
				},
				{
					topic: {
						subject: {
							name: {
								contains: search,
								mode: 'insensitive'
							}
						}
					}
				},
				{
					topic: {
						subject: {
							stream: {
								name: {
									contains: search,
									mode: 'insensitive'
								}
							}
						}
					}
				},
				{
					topic: {
						subject: {
							stream: {
								code: {
									contains: search,
									mode: 'insensitive'
								}
							}
						}
					}
				}
			];
		}

		const [totalItems, subtopics] = await Promise.all([
			this.prisma.subtopic.count({ where }),
			this.prisma.subtopic.findMany({
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
					}
				},
				orderBy: { name: 'asc' },
				skip,
				take: limitNum
			})
		]);

		const totalPages = Math.ceil(totalItems / limitNum);

		return {
			subtopics,
			pagination: {
				currentPage: pageNum,
				totalPages,
				totalItems,
				itemsPerPage: limitNum
			}
		};
	}

	@Post()
	create(@Body() body: { topicId: string; name: string; description?: string }) {
		return this.prisma.subtopic.create({ 
			data: { 
				topicId: body.topicId, 
				name: body.name, 
				description: body.description || null 
			} 
		});
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
		return this.prisma.subtopic.update({ 
			where: { id }, 
			data: { 
				name: body.name, 
				description: body.description 
			} 
		});
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.subtopic.delete({ where: { id } });
	}
} 