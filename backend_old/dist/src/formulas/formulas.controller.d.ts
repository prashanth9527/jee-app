import { FormulasService } from './formulas.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
export declare class FormulasController {
    private readonly formulasService;
    constructor(formulasService: FormulasService);
    create(createFormulaDto: CreateFormulaDto): Promise<import("./dto/formula-response.dto").FormulaResponseDto>;
    findAllAdmin(page: number, limit: number, subject?: string, topicId?: string, subtopicId?: string, tags?: string): Promise<{
        formulas: import("./dto/formula-response.dto").FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneAdmin(id: string): Promise<import("./dto/formula-response.dto").FormulaResponseDto>;
    update(id: string, updateFormulaDto: UpdateFormulaDto): Promise<import("./dto/formula-response.dto").FormulaResponseDto>;
    remove(id: string): Promise<void>;
    findAll(page: number, limit: number, subject?: string, topicId?: string, subtopicId?: string, tags?: string): Promise<{
        formulas: import("./dto/formula-response.dto").FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./dto/formula-response.dto").FormulaResponseDto>;
    findBySubject(subject: string, page: number, limit: number): Promise<{
        formulas: import("./dto/formula-response.dto").FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByTopic(topicId: string, page: number, limit: number): Promise<{
        formulas: import("./dto/formula-response.dto").FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findBySubtopic(subtopicId: string, page: number, limit: number): Promise<{
        formulas: import("./dto/formula-response.dto").FormulaResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
