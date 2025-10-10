import { Injectable } from '@nestjs/common';
import { AIProvider, AIProviderType } from './ai-provider.interface';
import { OpenAIService } from './openai.service';
import { DeepSeekService } from './deepseek.service';
import { ClaudeService } from './claude.service';

@Injectable()
export class AIProviderFactory {
  private readonly providers: Map<AIProviderType, AIProvider> = new Map();

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly deepseekService: DeepSeekService,
    private readonly claudeService: ClaudeService
  ) {
    this.providers.set('openai', this.openaiService);
    this.providers.set('deepseek', this.deepseekService);
    this.providers.set('claude', this.claudeService);
  }

  getProvider(type: AIProviderType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`AI provider '${type}' not found`);
    }
    return provider;
  }

  getAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  isProviderAvailable(type: AIProviderType): boolean {
    const provider = this.providers.get(type);
    if (!provider) {
      return false;
    }

    // Check if the provider has the required configuration
    if (type === 'openai') {
      return !!process.env.OPENAI_API_KEY;
    } else if (type === 'deepseek') {
      return !!process.env.DEEPSEEK_API_KEY;
    } else if (type === 'claude') {
      return !!process.env.ANTHROPIC_API_KEY;
    }

    return false;
  }
}
