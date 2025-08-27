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
	list(@Query('topicId') topicId?: string) {
		return this.prisma.subtopic.findMany({ where: { topicId: topicId || undefined }, orderBy: { name: 'asc' } });
	}

	@Post()
	create(@Body() body: { topicId: string; name: string; description?: string }) {
		return this.prisma.subtopic.create({ data: { topicId: body.topicId, name: body.name, description: body.description || null } });
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
		return this.prisma.subtopic.update({ where: { id }, data: { name: body.name, description: body.description } });
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.subtopic.delete({ where: { id } });
	}
} 