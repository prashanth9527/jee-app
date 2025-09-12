import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
import { FormulaResponseDto } from './dto/formula-response.dto';
export declare class FormulasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createFormulaDto: CreateFormulaDto): Promise<FormulaResponseDto>;
    findAll(page?: number, limit?: number, subject?: string, topicId?: string, subtopicId?: string, tags?: string[]): Promise<{
        formulas: FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, includeSuggestedQuestions?: boolean): Promise<FormulaResponseDto>;
    update(id: string, updateFormulaDto: UpdateFormulaDto): Promise<FormulaResponseDto>;
    remove(id: string): Promise<void>;
    getSuggestedQuestions(formula: any): Promise<any[]>;
    private mapToResponseDto;
}
