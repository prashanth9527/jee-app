import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderConfig } from './ai-provider.interface';
import * as fs from 'fs';
import axios from 'axios';

@Injectable()
export class DeepSeekService implements AIProvider {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly config: AIProviderConfig;
  private readonly baseUrl: string;

  constructor() {
    this.config = {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: 'deepseek-chat'
    };

    this.baseUrl = this.config.baseUrl || 'https://api.deepseek.com';

    if (!this.config.apiKey) {
      this.logger.warn('DeepSeek API key not found in environment variables');
    }
  }

  get name(): string {
    return 'DeepSeek';
  }

  async uploadFile(filePath: string): Promise<{ id: string }> {
    try {
      // DeepSeek doesn't have a separate file upload API like OpenAI
      // We'll read the file and include it in the request
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = filePath.split('/').pop() || 'document.pdf';
      
      // For DeepSeek, we'll return a mock file ID since we'll handle the file directly
      return { id: `deepseek_${Date.now()}_${fileName}` };
    } catch (error) {
      this.logger.error('Error preparing file for DeepSeek:', error);
      throw new Error(`Failed to prepare file: ${error.message}`);
    }
  }

  async processPDF(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    try {
      if (!this.config.apiKey) {
        throw new Error('DeepSeek API key not configured');
      }

      // DeepSeek doesn't support PDF files directly like OpenAI
      // We need to inform the user about this limitation
      throw new Error('DeepSeek API doesn\'t support PDF file processing directly. Please use OpenAI instead for PDF processing.');

    } catch (error) {
      this.logger.error('Error processing PDF with DeepSeek:', error);
      throw new Error(`DeepSeek processing failed: ${error.message}`);
    }
  }

  async processWithChunkedApproach(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    try {
      if (!this.config.apiKey) {
        throw new Error('DeepSeek API key not configured');
      }

      // DeepSeek doesn't support PDF files directly like OpenAI
      // We need to inform the user about this limitation
      throw new Error('DeepSeek API doesn\'t support PDF file processing directly. Please use OpenAI instead for PDF processing.');

    } catch (error) {
      this.logger.error('Error in chunked processing with DeepSeek:', error);
      throw error;
    }
  }

  private async makeDeepSeekRequest(systemPrompt: string, userPrompt: string, base64Content: string): Promise<any> {
    const payload = {
      model: this.config.model,
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
              text: userPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Content}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    const content = response.data.choices[0].message.content;

    // Try to parse JSON from response
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = content.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(jsonString);
        } catch (extractError) {
          this.logger.error('Failed to extract JSON from DeepSeek response');
        }
      }
      
      // If all else fails, try regex approach
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (regexError) {
          this.logger.error('Failed to parse JSON with regex');
        }
      }
      
      throw new Error(`Could not parse JSON from DeepSeek response. Content: ${content.substring(0, 500)}...`);
    }
  }
}
