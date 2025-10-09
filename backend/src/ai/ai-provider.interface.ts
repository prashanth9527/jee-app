export interface AIProvider {
  name: string;
  processPDF(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any>;
  uploadFile(filePath: string): Promise<{ id: string }>;
  processWithChunkedApproach?(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any>;
  processLatexContent?(latexContent: string, systemPrompt: string): Promise<any>;
}

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export type AIProviderType = 'openai' | 'deepseek';
