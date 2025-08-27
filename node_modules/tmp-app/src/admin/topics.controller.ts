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
	list(@Query('subjectId') subjectId?: string) {
		return this.prisma.topic.findMany({ where: { subjectId: subjectId || undefined }, orderBy: { name: 'asc' } });
	}

	@Post()
	create(@Body() body: { subjectId: string; name: string; description?: string }) {
		return this.prisma.topic.create({ data: { subjectId: body.subjectId, name: body.name, description: body.description || null } });
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
		return this.prisma.topic.update({ where: { id }, data: { name: body.name, description: body.description } });
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.topic.delete({ where: { id } });
	}
} 