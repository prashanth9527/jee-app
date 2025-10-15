import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIProviderConfig } from './ai-provider.interface';
import OpenAI from 'openai';
import * as fs from 'fs';

@Injectable()
export class OpenAIService implements AIProvider {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly config: AIProviderConfig;
  private readonly openai?: OpenAI;

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o'
    };

    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }

    if (!this.config.apiKey) {
      this.logger.warn('OpenAI API key not found in environment variables');
    } else {
      this.logger.log(`OpenAI API key loaded: ${this.config.apiKey.substring(0, 10)}...`);
    }
  }

  get name(): string {
    return 'OpenAI';
  }

  async processPDF(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Upload file to OpenAI
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants',
      });

      // Process with GPT-4 Vision
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt || 'Please analyze this document and extract the relevant information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `file://${filePath}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      return {
        content: response.choices[0]?.message?.content,
        fileId: file.id
      };
    } catch (error) {
      this.logger.error('Error processing PDF with OpenAI:', error);
      throw error;
    }
  }

  async uploadFile(filePath: string): Promise<{ id: string }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants',
      });

      return { id: file.id };
    } catch (error) {
      this.logger.error('Error uploading file to OpenAI:', error);
      throw error;
    }
  }

  async processWithChunkedApproach(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    // For OpenAI, we can use the same approach as processPDF since GPT-4o has large context window
    return this.processPDF(filePath, systemPrompt, userPrompt);
  }

  async processLatexContent(latexContent: string, systemPrompt: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please process this LaTeX content:\n\n${latexContent}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      return {
        content: response.choices[0]?.message?.content
      };
    } catch (error) {
      this.logger.error('Error processing LaTeX content with OpenAI:', error);
      throw error;
    }
  }

  async generateContentSummary(content: string, title: string, contentType: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const prompt = this.buildSummaryPrompt(content, title, contentType);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o', // Using the latest model as requested
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content summarizer. Create concise, comprehensive summaries that help students understand key concepts and retain important information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent, factual summaries
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate content summary');
    }
  }

  private buildSummaryPrompt(content: string, title: string, contentType: string): string {
    const basePrompt = `Please create a comprehensive summary for the following educational content:

Title: ${title}
Content Type: ${contentType}

Content:
${content}

Please provide a well-structured summary that includes:
1. Key concepts and main points
2. Important definitions or formulas
3. Critical takeaways for students
4. Any practical applications or examples mentioned

Format the summary in a clear, educational manner that will help students review and retain the information.`;

    return basePrompt;
  }

  async generateMindMap(content: string, title: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const prompt = `Create a mind map structure for the following educational content:

Title: ${title}
Content: ${content}

Please provide a structured mind map in text format that shows:
1. Main topic at the center
2. Primary branches for major concepts
3. Secondary branches for sub-concepts
4. Key points and details

Format it as a hierarchical text structure that can be easily converted to a visual mind map.`;

      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating educational mind maps. Create clear, logical structures that help students visualize and understand complex topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.4,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Mind Map Error:', error);
      throw new Error('Failed to generate mind map');
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Text Generation Error:', error);
      throw new Error('Failed to generate text');
    }
  }
}