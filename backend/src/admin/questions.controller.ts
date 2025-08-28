import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { parse } from 'fast-csv';

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminQuestionsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	list(@Query('subjectId') subjectId?: string, @Query('topicId') topicId?: string, @Query('subtopicId') subtopicId?: string) {
		return this.prisma.question.findMany({
			where: {
				subjectId: subjectId || undefined,
				topicId: topicId || undefined,
				subtopicId: subtopicId || undefined,
			},
			include: { 
				options: true, 
				tags: { include: { tag: true } },
				subject: true,
				topic: true,
				subtopic: true
			},
			orderBy: { createdAt: 'desc' },
		});
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.prisma.question.findUnique({
			where: { id },
			include: { 
				options: true, 
				tags: { include: { tag: true } },
				subject: true,
				topic: true,
				subtopic: true
			}
		});
	}

	@Post()
	async create(@Body() body: { stem: string; explanation?: string; difficulty?: 'EASY'|'MEDIUM'|'HARD'; yearAppeared?: number; isPreviousYear?: boolean; subjectId?: string; topicId?: string; subtopicId?: string; options: { text: string; isCorrect?: boolean; order?: number }[]; tagNames?: string[] }) {
		const question = await this.prisma.question.create({ data: {
			stem: body.stem,
			explanation: body.explanation || null,
			difficulty: body.difficulty || 'MEDIUM',
			yearAppeared: body.yearAppeared || null,
			isPreviousYear: !!body.isPreviousYear,
			subjectId: body.subjectId || null,
			topicId: body.topicId || null,
			subtopicId: body.subtopicId || null,
			options: { create: (body.options || []).map((o: any) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? 0 })) },
		}});
		if (body.tagNames?.length) {
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
				await this.prisma.questionTag.create({ data: { questionId: question.id, tagId: tag.id } });
			}
		}
		return this.prisma.question.findUnique({ where: { id: question.id }, include: { options: true, tags: { include: { tag: true } } } });
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() body: { stem?: string; explanation?: string; difficulty?: 'EASY'|'MEDIUM'|'HARD'; yearAppeared?: number; isPreviousYear?: boolean; subjectId?: string; topicId?: string; subtopicId?: string; options?: { id?: string; text: string; isCorrect?: boolean; order?: number }[]; tagNames?: string[] }) {
		await this.prisma.question.update({ where: { id }, data: {
			stem: body.stem,
			explanation: body.explanation,
			difficulty: body.difficulty,
			yearAppeared: body.yearAppeared,
			isPreviousYear: body.isPreviousYear,
			subjectId: body.subjectId,
			topicId: body.topicId,
			subtopicId: body.subtopicId,
		}});
		if (body.options) {
			await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
			await this.prisma.questionOption.createMany({ data: body.options.map((o: any) => ({ questionId: id, text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? 0 })) });
		}
		if (body.tagNames) {
			await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
			for (const name of body.tagNames) {
				const tag = await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
				await this.prisma.questionTag.create({ data: { questionId: id, tagId: tag.id } });
			}
		}
		return this.prisma.question.findUnique({ where: { id }, include: { options: true, tags: { include: { tag: true } } } });
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.prisma.question.delete({ where: { id } });
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	async importCsv(@UploadedFile() file?: Express.Multer.File) {
		if (!file || !file.buffer) throw new BadRequestException('File is required');
		const content = file.buffer.toString('utf8');
		const rows: any[] = [];
		await new Promise<void>((resolve, reject) => {
			parseString(content, rows, (err) => err ? reject(err) : resolve());
		});
		for (const r of rows) {
			let options: { text: string; isCorrect?: boolean; order?: number }[] = [];
			let tagNames: string[] = [];
			try { options = JSON.parse(r.options || '[]'); } catch {}
			try { tagNames = JSON.parse(r.tagNames || '[]'); } catch {}
			await this.create({
				stem: r.stem,
				explanation: r.explanation,
				difficulty: (r.difficulty as any) || 'MEDIUM',
				yearAppeared: r.yearAppeared ? Number(r.yearAppeared) : undefined,
				isPreviousYear: r.isPreviousYear === 'true' || r.isPreviousYear === true,
				subjectId: r.subjectId || undefined,
				topicId: r.topicId || undefined,
				subtopicId: r.subtopicId || undefined,
				options,
				tagNames,
			});
		}
		return { ok: true, count: rows.length };
	}

	@Get('export')
	async exportCsv(@Res() res: Response) {
		const questions = await this.prisma.question.findMany({ include: { options: true, tags: { include: { tag: true } } } });
		const header = ['stem','explanation','difficulty','yearAppeared','isPreviousYear','subjectId','topicId','subtopicId','options','tagNames'];
		const escape = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
		const lines = [header.join(',')];
		for (const q of questions as any[]) {
			const record = [
				escape(q.stem),
				escape(q.explanation || ''),
				escape(q.difficulty),
				escape(q.yearAppeared || ''),
				escape(q.isPreviousYear),
				escape(q.subjectId || ''),
				escape(q.topicId || ''),
				escape(q.subtopicId || ''),
				escape(JSON.stringify((q.options || []).map((o: any) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })))),
				escape(JSON.stringify((q.tags || []).map((t: any) => t.tag.name))),
			];
			lines.push(record.join(','));
		}
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
		res.send(lines.join('\n'));
	}
}

function parseString(content: string, rows: any[], cb: (err?: Error) => void) {
	import('stream').then(({ Readable }) => {
		const stream = Readable.from([content]);
		stream
			.pipe(parse({ headers: true }))
			.on('error', (error) => cb(error as any))
			.on('data', (row) => rows.push(row))
			.on('end', () => cb());
	});
} 