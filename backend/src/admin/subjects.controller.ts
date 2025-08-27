import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSubjectsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	list() {
		return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
	}

	@Post()
	create(@Body() body: { name: string; description?: string }) {
		return this.prisma.subject.create({ data: { name: body.name, description: body.description || null } });
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
		return this.prisma.subject.update({ where: { id }, data: { name: body.name, description: body.description } });
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.subject.delete({ where: { id } });
	}
} 