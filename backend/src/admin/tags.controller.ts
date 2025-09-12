import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTagsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '50');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {};
		
		// Add search functionality
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}

		// Get total count for pagination
		const totalItems = await this.prisma.tag.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get tags with pagination and question count
		const tags = await this.prisma.tag.findMany({
			where,
			include: {
				_count: {
					select: {
						questions: true
					}
				}
			},
			orderBy: { name: 'asc' },
			skip,
			take: itemsPerPage,
		});

		return {
			tags,
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
		const tag = await this.prisma.tag.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						questions: true
					}
				},
				questions: {
					include: {
						question: {
							include: {
								subject: true,
								topic: true,
								subtopic: true
							}
						}
					},
					take: 10,
					orderBy: {
						question: {
							createdAt: 'desc'
						}
					}
				}
			}
		});

		if (!tag) {
			throw new BadRequestException('Tag not found');
		}

		return tag;
	}

	@Post()
	async create(@Body() body: { name: string }) {
		if (!body.name || !body.name.trim()) {
			throw new BadRequestException('Tag name is required');
		}

		const trimmedName = body.name.trim();
		
		// Check if tag already exists
		const existingTag = await this.prisma.tag.findUnique({
			where: { name: trimmedName }
		});

		if (existingTag) {
			throw new BadRequestException('Tag with this name already exists');
		}

		return this.prisma.tag.create({ 
			data: { name: trimmedName },
			include: {
				_count: {
					select: {
						questions: true
					}
				}
			}
		});
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: { name?: string }) {
		if (!body.name || !body.name.trim()) {
			throw new BadRequestException('Tag name is required');
		}

		const trimmedName = body.name.trim();
		
		// Check if tag already exists with the new name
		const existingTag = await this.prisma.tag.findFirst({
			where: { 
				name: trimmedName,
				id: { not: id }
			}
		});

		if (existingTag) {
			throw new BadRequestException('Tag with this name already exists');
		}

		return this.prisma.tag.update({ 
			where: { id }, 
			data: { name: trimmedName },
			include: {
				_count: {
					select: {
						questions: true
					}
				}
			}
		});
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		// Check if tag exists
		const tag = await this.prisma.tag.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						questions: true
					}
				}
			}
		});

		if (!tag) {
			throw new BadRequestException('Tag not found');
		}

		// Check if tag is used by any questions
		if (tag._count.questions > 0) {
			throw new BadRequestException(`Cannot delete tag "${tag.name}" as it is used by ${tag._count.questions} question${tag._count.questions !== 1 ? 's' : ''}. Please remove the tag from all questions first.`);
		}

		return this.prisma.tag.delete({ where: { id } });
	}

	@Delete('bulk')
	async bulkDelete(@Body() body: { ids: string[] }) {
		if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
			throw new BadRequestException('Tag IDs array is required');
		}

		// Check which tags are used by questions
		const tagsWithQuestions = await this.prisma.tag.findMany({
			where: {
				id: { in: body.ids }
			},
			include: {
				_count: {
					select: {
						questions: true
					}
				}
			}
		});

		const tagsWithQuestionsList = tagsWithQuestions.filter(tag => tag._count.questions > 0);
		
		if (tagsWithQuestionsList.length > 0) {
			const tagNames = tagsWithQuestionsList.map(tag => `"${tag.name}"`).join(', ');
			throw new BadRequestException(`Cannot delete the following tags as they are used by questions: ${tagNames}. Please remove them from all questions first.`);
		}

		const result = await this.prisma.tag.deleteMany({
			where: {
				id: {
					in: body.ids
				}
			}
		});
		
		return { 
			ok: true, 
			deletedCount: result.count,
			message: `Successfully deleted ${result.count} tag${result.count !== 1 ? 's' : ''}`
		};
	}
} 