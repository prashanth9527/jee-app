import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/streams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminStreamsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	list() {
		return this.prisma.stream.findMany({ 
			orderBy: { name: 'asc' },
			include: {
				_count: {
					select: {
						subjects: true,
						users: true,
					}
				}
			}
		});
	}

	@Post()
	create(@Body() body: { name: string; description?: string; code: string }) {
		return this.prisma.stream.create({ 
			data: { 
				name: body.name, 
				description: body.description || null,
				code: body.code.toUpperCase(),
				isActive: true
			} 
		});
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: { name?: string; description?: string; code?: string; isActive?: boolean }) {
		console.log('Updating stream:', id, 'with data:', body);
		
		try {
			const updatedStream = await this.prisma.stream.update({ 
				where: { id }, 
				data: { 
					name: body.name, 
					description: body.description,
					code: body.code?.toUpperCase(),
					isActive: body.isActive
				} 
			});
			
			console.log('Stream updated successfully:', updatedStream);
			return updatedStream;
		} catch (error) {
			console.error('Error updating stream:', error);
			throw error;
		}
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		// Check if stream has subjects or users
		const stream = await this.prisma.stream.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						subjects: true,
						users: true,
					}
				}
			}
		});

		if (!stream) {
			throw new Error('Stream not found');
		}

		if (stream._count.subjects > 0 || stream._count.users > 0) {
			throw new Error(`Cannot delete stream with ${stream._count.subjects} subjects and ${stream._count.users} users`);
		}

		return this.prisma.stream.delete({ where: { id } });
	}
} 