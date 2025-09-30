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

      // Read the PDF file
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = filePath.split('/').pop() || 'document.pdf';
      
      // Convert PDF to base64 for DeepSeek
      const base64Content = fileBuffer.toString('base64');

      // Create the request payload
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
                text: userPrompt || 'Please process this PDF and extract all questions according to the system prompt instructions.'
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

      this.logger.log('Sending request to DeepSeek API...');

      // Make the API request
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
      this.logger.log('Received response from DeepSeek API');

      // Try to parse JSON from response
      try {
        return JSON.parse(content);
      } catch (parseError) {
        this.logger.warn('Direct JSON parse failed, attempting to extract JSON...');
        
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

      // Read the PDF file
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = filePath.split('/').pop() || 'document.pdf';
      
      // Convert PDF to base64 for DeepSeek
      const base64Content = fileBuffer.toString('base64');

      let allQuestions: any[] = [];

      // First chunk: Pages 1-3, Questions Q1-Q10
      const firstChunkPrompt = userPrompt || 'AGGRESSIVE CHUNKED PROCESSING: Process this PDF in chunks to ensure complete coverage. JEE papers have 25-30 questions. First, read pages 1-3 and extract questions Q1-Q10. You MUST find at least 8-10 questions in this first chunk. Look for question numbers Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10. Do not stop until you find all questions in these pages. Return ONLY valid JSON for this chunk. Every question MUST have a "lesson" field. Ensure all mathematical expressions use LaTeX format with $$...$$ for display math. For each question, identify the lesson following this hierarchy - Chemistry: "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"; Physics: "Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics", "Waves"; Mathematics: "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", "Coordinate Geometry". Also generate tip_formula and set isPreviousYear to true. CRITICAL: If any question has missing options, explanations, or unclear correct answers, you MUST generate them as a JEE expert. Create realistic options and detailed explanations using your subject expertise.';

      const firstChunkResponse = await this.makeDeepSeekRequest(systemPrompt, firstChunkPrompt, base64Content);
      if (firstChunkResponse.questions && Array.isArray(firstChunkResponse.questions)) {
        allQuestions = [...firstChunkResponse.questions];
        this.logger.log(`First chunk: Found ${firstChunkResponse.questions.length} questions`);
      }

      // Second chunk: Pages 4-6, Questions Q11-Q20
      if (allQuestions.length < 20) {
        const secondChunkPrompt = `CRITICAL SECOND CHUNK: You only found ${allQuestions.length} questions in the first chunk. JEE papers have 25-30 questions total. You MUST read pages 4-6 of the PDF and extract questions Q11-Q20. Do not stop until you find at least 8-10 more questions. Look for question numbers Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20. Return ONLY valid JSON for this chunk. Every question MUST have a "lesson" field. Ensure all mathematical expressions use LaTeX format with $$...$$ for display math. CRITICAL: If any question has missing options, explanations, or unclear correct answers, you MUST generate them as a JEE expert. Create realistic options and detailed explanations using your subject expertise.`;

        const secondChunkResponse = await this.makeDeepSeekRequest(systemPrompt, secondChunkPrompt, base64Content);
        if (secondChunkResponse.questions && Array.isArray(secondChunkResponse.questions)) {
          allQuestions = [...allQuestions, ...secondChunkResponse.questions];
          this.logger.log(`Second chunk: Found ${secondChunkResponse.questions.length} questions. Total: ${allQuestions.length}`);
        }
      }

      // Third chunk: Pages 7-12, Questions Q21-Q30+
      if (allQuestions.length < 25) {
        const thirdChunkPrompt = `CRITICAL THIRD CHUNK: You have only found ${allQuestions.length} questions total. JEE papers have 25-30 questions. You MUST read pages 7-12 of the PDF and extract questions Q21-Q30+. This is the final chunk. Look for question numbers Q21, Q22, Q23, Q24, Q25, Q26, Q27, Q28, Q29, Q30, Q31, Q32, Q33, Q34, Q35. Do not stop until you find at least 10-15 more questions. Return ONLY valid JSON for this chunk. Every question MUST have a "lesson" field. Ensure all mathematical expressions use LaTeX format with $$...$$ for display math. CRITICAL: If any question has missing options, explanations, or unclear correct answers, you MUST generate them as a JEE expert. Create realistic options and detailed explanations using your subject expertise.`;

        const thirdChunkResponse = await this.makeDeepSeekRequest(systemPrompt, thirdChunkPrompt, base64Content);
        if (thirdChunkResponse.questions && Array.isArray(thirdChunkResponse.questions)) {
          allQuestions = [...allQuestions, ...thirdChunkResponse.questions];
          this.logger.log(`Third chunk: Found ${thirdChunkResponse.questions.length} questions. Total: ${allQuestions.length}`);
        }
      }

      // Create final combined response
      if (allQuestions.length > 0) {
        const finalResponse = {
          questions: allQuestions,
          metadata: {
            totalQuestions: allQuestions.length,
            subjects: [...new Set(allQuestions.map(q => q.subject))],
            topics: [...new Set(allQuestions.map(q => q.topic))],
            difficultyDistribution: {
              easy: allQuestions.filter(q => q.difficulty === 'EASY').length,
              medium: allQuestions.filter(q => q.difficulty === 'MEDIUM').length,
              hard: allQuestions.filter(q => q.difficulty === 'HARD').length
            },
            processingTime: 120,
            processingMethod: 'chunked',
            provider: 'DeepSeek'
          }
        };
        
        this.logger.log(`Chunked processing complete: Total questions found: ${allQuestions.length}`);
        return finalResponse;
      } else {
        throw new Error('No questions found in any chunk');
      }

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
