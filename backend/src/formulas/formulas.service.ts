import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
import { FormulaResponseDto } from './dto/formula-response.dto';

@Injectable()
export class FormulasService {
  constructor(private prisma: PrismaService) {}

  async create(createFormulaDto: CreateFormulaDto): Promise<FormulaResponseDto> {
    const formula = await this.prisma.formula.create({
      data: {
        ...createFormulaDto,
        tags: createFormulaDto.tags || [],
      },
    });

    return this.mapToResponseDto(formula);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    subject?: string,
    topicId?: string,
    subtopicId?: string,
    tags?: string[],
  ): Promise<{ formulas: FormulaResponseDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (subject) {
      where.subject = subject;
    }
    
    if (topicId) {
      where.topicId = topicId;
    }
    
    if (subtopicId) {
      where.subtopicId = subtopicId;
    }
    
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    const [formulas, total] = await Promise.all([
      this.prisma.formula.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.formula.count({ where }),
    ]);

    const formulaDtos = await Promise.all(
	formulas.map((formula: any) => this.mapToResponseDto(formula))
    );

    return {
      formulas: formulaDtos,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, includeSuggestedQuestions: boolean = false): Promise<FormulaResponseDto> {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    const responseDto = await this.mapToResponseDto(formula);
    
    if (includeSuggestedQuestions) {
      responseDto.suggestedQuestions = await this.getSuggestedQuestions(formula);
    }

    return responseDto;
  }

  async update(id: string, updateFormulaDto: UpdateFormulaDto): Promise<FormulaResponseDto> {
    const existingFormula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!existingFormula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    const formula = await this.prisma.formula.update({
      where: { id },
      data: updateFormulaDto,
    });

    return this.mapToResponseDto(formula);
  }

  async remove(id: string): Promise<void> {
    const existingFormula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!existingFormula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    await this.prisma.formula.delete({
      where: { id },
    });
  }

  async getSuggestedQuestions(formula: any): Promise<any[]> {
    const suggestedQuestions = [];
    
    // Get questions by tags
    if (formula.tags && formula.tags.length > 0) {
      const questionsByTags = await this.prisma.question.findMany({
        where: {
          tags: {
            some: {
              tag: {
                name: {
                  in: formula.tags,
                },
              },
            },
          },
        },
        take: 5,
        select: {
          id: true,
          stem: true,
          difficulty: true,
          subject: true,
          topicId: true,
          subtopicId: true,
        },
      });
      suggestedQuestions.push(...questionsByTags);
    }

    // Get questions by topic
    if (formula.topicId) {
      const questionsByTopic = await this.prisma.question.findMany({
        where: {
          topicId: formula.topicId,
        },
        take: 5,
        select: {
          id: true,
          stem: true,
          difficulty: true,
          subject: true,
          topicId: true,
          subtopicId: true,
        },
      });
      suggestedQuestions.push(...questionsByTopic);
    }

    // Get questions by subtopic
    if (formula.subtopicId) {
      const questionsBySubtopic = await this.prisma.question.findMany({
        where: {
          subtopicId: formula.subtopicId,
        },
        take: 5,
        select: {
          id: true,
          stem: true,
          difficulty: true,
          subject: true,
          topicId: true,
          subtopicId: true,
        },
      });
      suggestedQuestions.push(...questionsBySubtopic);
    }

    // Get questions by subject
    if (formula.subject) {
      const questionsBySubject = await this.prisma.question.findMany({
        where: {
          subject: formula.subject,
        },
        take: 5,
        select: {
          id: true,
          stem: true,
          difficulty: true,
          subject: true,
          topicId: true,
          subtopicId: true,
        },
      });
      suggestedQuestions.push(...questionsBySubject);
    }

    // Remove duplicates and limit to 10 questions
    const uniqueQuestions = suggestedQuestions.filter(
      (question, index, self) =>
        index === self.findIndex(q => q.id === question.id)
    );

    return uniqueQuestions.slice(0, 10);
  }

  private async mapToResponseDto(formula: any): Promise<FormulaResponseDto> {
    return {
      id: formula.id,
      title: formula.title,
      formula: formula.formula,
      description: formula.description,
      subject: formula.subject,
      tags: formula.tags || [],
      topicId: formula.topicId,
      subtopicId: formula.subtopicId,
      targetRole: formula.targetRole,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    };
  }
}
