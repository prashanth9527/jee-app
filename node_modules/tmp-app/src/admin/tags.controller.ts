import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
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
	list() {
		return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
	}

	@Post()
	create(@Body() body: { name: string }) {
		return this.prisma.tag.create({ data: { name: body.name } });
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string }) {
		return this.prisma.tag.update({ where: { id }, data: { name: body.name } });
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.tag.delete({ where: { id } });
	}
} 