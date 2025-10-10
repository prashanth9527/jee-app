import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIProviderConfig } from './ai-provider.interface';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ClaudeService implements AIProvider {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly config: AIProviderConfig;
  private readonly anthropic?: Anthropic;
  private readonly maxTokensPerChunk = 180000; // Claude 3.5 Sonnet has 200k context window, leave buffer

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      model: this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-4-5-20250929'
    };

    if (this.config.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: this.config.apiKey,
      });
    }

    if (!this.config.apiKey) {
      this.logger.warn('Anthropic API key not found in environment variables');
    } else {
      this.logger.log(`Anthropic API key loaded: ${this.config.apiKey.substring(0, 10)}...`);
    }
  }

  get name(): string {
    return 'Claude (Anthropic)';
  }

  /**
   * Upload file - Claude doesn't have a separate file upload API
   * We'll read the file content directly
   */
  async uploadFile(filePath: string): Promise<{ id: string }> {
    // Claude doesn't require file upload, just return the file path as ID
    return { id: filePath };
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Split content into chunks based on token limit
   */
  private splitIntoChunks(content: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    const estimatedTokens = this.estimateTokenCount(content);

    if (estimatedTokens <= maxTokens) {
      return [content];
    }

    // Split by paragraphs/sections to maintain context
    const sections = content.split(/\n\n+/);
    let currentChunk = '';
    let currentTokens = 0;

    for (const section of sections) {
      const sectionTokens = this.estimateTokenCount(section);

      if (currentTokens + sectionTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = section;
        currentTokens = sectionTokens;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
        currentTokens += sectionTokens;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Process LaTeX content with Claude API
   */
  async processLatexContent(latexContent: string, systemPrompt: string): Promise<any> {
    try {
      if (!this.anthropic) {
        throw new Error('Claude client not initialized - API key missing');
      }

      const estimatedTokens = this.estimateTokenCount(latexContent);
      this.logger.log(`Processing LaTeX content with estimated ${estimatedTokens} tokens`);

      // Check if content needs to be split
      if (estimatedTokens > this.maxTokensPerChunk) {
        this.logger.log(`Content exceeds token limit, splitting into chunks...`);
        return await this.processWithChunkedApproach(latexContent, systemPrompt);
      }

      // Process in single request
      const response = await this.anthropic.messages.create({
        model: this.config.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Process the following LaTeX content and extract all questions in JSON format:\n\n${latexContent}`
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      this.logger.log('Claude response received');

      return this.parseJSONResponse(responseText);

    } catch (error) {
      this.logger.error('Error processing LaTeX content with Claude:', error);
      throw new Error(`Claude processing failed: ${error.message}`);
    }
  }

  /**
   * Process with chunked approach for large files
   */
  async processWithChunkedApproach(content: string, systemPrompt: string): Promise<any> {
    try {
      const chunks = this.splitIntoChunks(content, this.maxTokensPerChunk);
      this.logger.log(`Split content into ${chunks.length} chunks`);

      const allQuestions: any[] = [];
      const allSubjects = new Set<string>();
      const allTopics = new Set<string>();
      const difficultyCount = { easy: 0, medium: 0, hard: 0 };

      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Processing chunk ${i + 1}/${chunks.length}...`);

        const chunkPrompt = `${systemPrompt}\n\nIMPORTANT: This is chunk ${i + 1} of ${chunks.length}. Extract ALL questions from this chunk. Continue question numbering from where the previous chunk left off.`;

        if (!this.anthropic) {
          throw new Error('Claude client not initialized');
        }

        const response = await this.anthropic.messages.create({
          model: this.config.model || 'claude-sonnet-4-5-20250929',
          max_tokens: 8000,
          temperature: 0.1,
          system: chunkPrompt,
          messages: [
            {
              role: 'user',
              content: `Process this chunk and extract all questions:\n\n${chunks[i]}`
            }
          ]
        });

        const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
        const chunkResult = this.parseJSONResponse(responseText);

        if (chunkResult.questions && Array.isArray(chunkResult.questions)) {
          allQuestions.push(...chunkResult.questions);

          // Aggregate metadata
          chunkResult.questions.forEach((q: any) => {
            if (q.subject) allSubjects.add(q.subject);
            if (q.topic) allTopics.add(q.topic);
            if (q.difficulty) {
              const diff = q.difficulty.toLowerCase();
              if (diff === 'easy') difficultyCount.easy++;
              else if (diff === 'medium') difficultyCount.medium++;
              else if (diff === 'hard') difficultyCount.hard++;
            }
          });
        }

        // Add delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        questions: allQuestions,
        metadata: {
          totalQuestions: allQuestions.length,
          subjects: Array.from(allSubjects),
          topics: Array.from(allTopics),
          difficultyDistribution: difficultyCount,
          chunksProcessed: chunks.length
        }
      };

    } catch (error) {
      this.logger.error('Error in chunked processing:', error);
      throw error;
    }
  }

  /**
   * Process PDF file (reads LaTeX content from file)
   */
  async processPDF(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    try {
      if (!this.anthropic) {
        throw new Error('Claude client not initialized - API key missing');
      }

      // Check if file is LaTeX or needs conversion
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext !== '.tex') {
        throw new Error('Claude service currently only supports .tex (LaTeX) files. Please convert PDF to LaTeX first using Mathpix.');
      }

      // Read LaTeX file content
      const latexContent = fs.readFileSync(filePath, 'utf-8');
      this.logger.log(`Read LaTeX file: ${path.basename(filePath)} (${latexContent.length} characters)`);

      return await this.processLatexContent(latexContent, systemPrompt);

    } catch (error) {
      this.logger.error('Error processing PDF with Claude:', error);
      throw new Error(`Claude processing failed: ${error.message}`);
    }
  }

  /**
   * Parse JSON response from Claude
   */
  private parseJSONResponse(responseText: string): any {
    try {
      // Try direct parse first
      return JSON.parse(responseText);
    } catch (parseError) {
      this.logger.warn('Direct JSON parse failed, attempting to extract JSON...');

      // Method 1: Try to extract JSON from markdown code blocks (```json ... ```)
      const codeBlockPatterns = [
        /```json\s*([\s\S]*?)\s*```/,  // ```json ... ```
        /```\s*([\s\S]*?)\s*```/,       // ``` ... ```
      ];

      for (const pattern of codeBlockPatterns) {
        const match = responseText.match(pattern);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1].trim());
            this.logger.log('Successfully parsed JSON from markdown code block');
            return parsed;
          } catch (e) {
            this.logger.warn(`Failed to parse JSON from code block with pattern: ${pattern}`);
          }
        }
      }

      // Method 2: Try to find JSON object by braces
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = responseText.substring(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(jsonString);
          this.logger.log('Successfully parsed JSON by finding braces');
          return parsed;
        } catch (extractError) {
          this.logger.warn('Failed to extract JSON by braces');
        }
      }

      // Method 3: Try to extract everything between first { and last }
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          this.logger.log('Successfully parsed JSON with regex');
          return parsed;
        } catch (regexError) {
          this.logger.warn('Failed to parse JSON with regex');
        }
      }

      throw new Error(`Could not parse JSON from Claude response. Content: ${responseText.substring(0, 500)}...`);
    }
  }
}
