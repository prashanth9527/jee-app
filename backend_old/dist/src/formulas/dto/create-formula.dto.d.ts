import { UserRole } from '@prisma/client';
export declare class CreateFormulaDto {
    title: string;
    formula: string;
    description?: string;
    subject?: string;
    tags?: string[];
    topicId?: string;
    subtopicId?: string;
    targetRole?: UserRole;
}
