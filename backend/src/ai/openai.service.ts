import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderConfig } from './ai-provider.interface';
import { OpenAI } from 'openai';
import * as fs from 'fs';

@Injectable()
export class OpenAIService implements AIProvider {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly config: AIProviderConfig;
  private readonly openai?: OpenAI;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o'
    };

    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }

    if (!this.config.apiKey) {
      this.logger.warn('OpenAI API key not found in environment variables');
    }
  }

  get name(): string {
    return 'OpenAI';
  }

  async uploadFile(filePath: string): Promise<{ id: string }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized - API key missing');
    }
    
    try {
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
      });
      return { id: file.id };
    } catch (error) {
      this.logger.error('Error uploading file to OpenAI:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async processPDF(filePath: string, systemPrompt: string, userPrompt?: string): Promise<any> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized - API key missing');
      }

      // Step 1: Upload file to OpenAI
      const fileUpload = await this.uploadFile(filePath);

      // Step 2: Create assistant
      const assistant = await this.openai.beta.assistants.create({
        name: "JEE PDF Processor - Complete Reader",
        instructions: systemPrompt,
        model: this.config.model || 'gpt-4o',
        tools: [{ type: "file_search" }],
        temperature: 0.1
      });

      // Step 3: Create thread
      const thread = await this.openai.beta.threads.create();

      // Step 4: Send message
      const userMessage = userPrompt || 'AGGRESSIVE CHUNKED PROCESSING: Process this PDF in chunks to ensure complete coverage. JEE papers have 25-30 questions. First, read pages 1-3 and extract questions Q1-Q10. You MUST find at least 8-10 questions in this first chunk. Look for question numbers Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10. Do not stop until you find all questions in these pages. Return ONLY valid JSON for this chunk. Every question MUST have a "lesson" field. Ensure all mathematical expressions use LaTeX format with $$...$$ for display math. For each question, identify the lesson following this hierarchy - Chemistry: "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"; Physics: "Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics", "Waves"; Mathematics: "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", "Coordinate Geometry". Also generate tip_formula and set isPreviousYear to true. CRITICAL: If any question has missing options, explanations, or unclear correct answers, you MUST generate them as a JEE expert. Create realistic options and detailed explanations using your subject expertise.';
      
      await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage,
        attachments: [
          {
            file_id: fileUpload.id,
            tools: [{ type: "file_search" }]
          }
        ]
      });

      // Step 5: Run and fetch response
      const run = await this.openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id
      });

      if (run.status !== 'completed') {
        throw new Error(`Assistant run failed with status: ${run.status}`);
      }

      // Step 6: Get the response
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      
      if (!lastMessage.content || lastMessage.content.length === 0) {
        throw new Error('No response content from assistant');
      }

      const content = lastMessage.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from assistant');
      }

      const responseText = content.text.value;
      this.logger.log('Assistant response content received');

      // Try to parse JSON from response
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        this.logger.warn('Direct JSON parse failed, attempting to extract JSON...');
        
        // If direct parsing fails, try to extract JSON from the response
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonString = responseText.substring(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(jsonString);
          } catch (extractError) {
            this.logger.error('Failed to extract JSON from OpenAI response');
          }
        }
        
        // If all else fails, try regex approach
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (regexError) {
            this.logger.error('Failed to parse JSON with regex');
          }
        }
        
        throw new Error(`Could not parse JSON from assistant response. Content: ${responseText.substring(0, 500)}...`);
      }

    } catch (error) {
      this.logger.error('Error processing PDF with OpenAI:', error);
      throw new Error(`OpenAI processing failed: ${error.message}`);
    }
  }
}
