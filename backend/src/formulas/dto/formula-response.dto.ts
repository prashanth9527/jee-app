export class FormulaResponseDto {
  id: string;
  title: string;
  formula: string;
  description?: string;
  subject?: string;
  tags: string[];
  topicId?: string;
  subtopicId?: string;
  targetRole?: string;
  createdAt: Date;
  updatedAt: Date;
  suggestedQuestions?: any[];
}
