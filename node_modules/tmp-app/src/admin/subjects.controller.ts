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
		return this.prisma.subject.findMany({ 
			orderBy: { name: 'asc' },
			include: {
				stream: {
					select: {
						id: true,
						name: true,
						code: true
					}
				}
			}
		});
	}

	@Post()
	create(@Body() body: { name: string; description?: string; streamId: string }) {
		return this.prisma.subject.create({ 
			data: { 
				name: body.name, 
				description: body.description || null,
				streamId: body.streamId
			} 
		});
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string; streamId?: string }) {
		return this.prisma.subject.update({ 
			where: { id }, 
			data: { 
				name: body.name, 
				description: body.description,
				streamId: body.streamId
			} 
		});
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.subject.delete({ where: { id } });
	}
} 