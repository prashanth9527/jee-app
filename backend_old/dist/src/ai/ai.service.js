"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const subscription_validation_service_1 = require("../subscriptions/subscription-validation.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AIService = AIService_1 = class AIService {
    constructor(configService, subscriptionValidation, prisma) {
        this.configService = configService;
        this.subscriptionValidation = subscriptionValidation;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AIService_1.name);
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    }
    async generateQuestions(request) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const prompt = this.buildQuestionPrompt(request);
            const response = await this.callOpenAI(prompt);
            return this.parseAIResponse(response);
        }
        catch (error) {
            this.logger.error('Error generating AI questions:', error);
            throw new Error('Failed to generate AI questions');
        }
    }
    async generateExplanation(question, correctAnswer, userAnswer) {
        if (!this.openaiApiKey) {
            return 'Explanation not available';
        }
        try {
            const prompt = this.buildExplanationPrompt(question, correctAnswer, userAnswer);
            const response = await this.callOpenAI(prompt);
            return this.parseExplanationResponse(response);
        }
        catch (error) {
            this.logger.error('Error generating explanation:', error);
            return 'Explanation not available';
        }
    }
    async generateExplanationWithTips(question, correctAnswer, userAnswer, tipFormula) {
        if (!this.openaiApiKey) {
            return 'Explanation not available';
        }
        try {
            const prompt = this.buildExplanationPromptWithTips(question, correctAnswer, userAnswer, tipFormula);
            const response = await this.callOpenAI(prompt);
            return this.parseExplanationResponse(response);
        }
        catch (error) {
            this.logger.error('Error generating explanation with tips:', error);
            return 'Explanation not available';
        }
    }
    buildQuestionPrompt(request) {
        const { subject, topic, subtopic, difficulty, questionCount, existingTips } = request;
        let context = `Generate ${questionCount} JEE (Joint Entrance Examination) level questions for ${subject}`;
        if (topic) {
            context += `, specifically on the topic: ${topic}`;
        }
        if (subtopic) {
            context += `, focusing on: ${subtopic}`;
        }
        context += `. The questions should be ${difficulty.toLowerCase()} difficulty level.`;
        let prompt = `You are an expert JEE tutor. ${context}

Please generate exactly ${questionCount} multiple-choice questions in the following JSON format:

[
  {
    "stem": "Question text here",
    "explanation": "Detailed explanation of the correct answer",
    "tip_formula": "Helpful tips, formulas, or solving strategies for this question",
    "difficulty": "${difficulty}",
    "options": [
      {
        "text": "Option A text",
        "isCorrect": false
      },
      {
        "text": "Option B text", 
        "isCorrect": true
      },
      {
        "text": "Option C text",
        "isCorrect": false
      },
      {
        "text": "Option D text",
        "isCorrect": false
      }
    ]
  }
]`;
        if (existingTips && existingTips.length > 0) {
            prompt += `\n\nIMPORTANT: Use the following existing tips and formulas from similar questions to improve your question generation:

${existingTips.map((tip, index) => `${index + 1}. ${tip}`).join('\n')}

Incorporate these insights to create more relevant and helpful questions. Ensure your generated questions include appropriate tip_formula fields that build upon these existing tips.`;
        }
        prompt += `\n\nRequirements:
1. Each question must have exactly 4 options
2. Only one option should be marked as correct (isCorrect: true)
3. Questions should be relevant to JEE syllabus
4. Explanations should be educational and help students understand the concept
5. Each question must include a helpful tip_formula with solving strategies, key formulas, or conceptual hints
6. Return only valid JSON, no additional text

Generate the questions now:`;
        return prompt;
    }
    buildExplanationPrompt(question, correctAnswer, userAnswer) {
        let prompt = `You are an expert JEE tutor. Please provide a detailed explanation for this question:

Question: ${question}
Correct Answer: ${correctAnswer}`;
        if (userAnswer && userAnswer !== correctAnswer) {
            prompt += `\nStudent's Answer: ${userAnswer}`;
            prompt += `\n\nPlease explain why the student's answer is incorrect and provide the correct reasoning.`;
        }
        else {
            prompt += `\n\nPlease provide a detailed explanation of why this is the correct answer.`;
        }
        prompt += `\n\nMake the explanation educational and help the student understand the underlying concept.`;
        return prompt;
    }
    buildExplanationPromptWithTips(question, correctAnswer, userAnswer, tipFormula) {
        let prompt = `You are an expert JEE tutor. Please provide a detailed explanation for this question:

Question: ${question}
Correct Answer: ${correctAnswer}`;
        if (tipFormula) {
            prompt += `\n\nAvailable Tips & Formulas: ${tipFormula}`;
            prompt += `\n\nUse these tips and formulas to enhance your explanation and provide more helpful guidance to the student.`;
        }
        if (userAnswer && userAnswer !== correctAnswer) {
            prompt += `\nStudent's Answer: ${userAnswer}`;
            prompt += `\n\nPlease explain why the student's answer is incorrect and provide the correct reasoning.`;
        }
        else {
            prompt += `\n\nPlease provide a detailed explanation of why this is the correct answer.`;
        }
        prompt += `\n\nMake the explanation educational and help the student understand the underlying concept.`;
        if (tipFormula) {
            prompt += `\n\nIncorporate the provided tips and formulas naturally into your explanation to make it more comprehensive and helpful.`;
        }
        return prompt;
    }
    async callOpenAI(prompt) {
        const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert JEE tutor with deep knowledge of Physics, Chemistry, and Mathematics. Provide accurate, educational content suitable for JEE preparation.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    parseAIResponse(response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const questions = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }
            return questions.map((q, index) => {
                if (!q.stem || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                    throw new Error(`Invalid question structure at index ${index}`);
                }
                const correctOptions = q.options.filter((opt) => opt.isCorrect);
                if (correctOptions.length !== 1) {
                    throw new Error(`Question ${index + 1} must have exactly one correct answer`);
                }
                return {
                    stem: q.stem,
                    explanation: q.explanation || 'Explanation not provided',
                    tip_formula: q.tip_formula || 'Tip not provided',
                    difficulty: q.difficulty || 'MEDIUM',
                    options: q.options.map((opt, optIndex) => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false
                    }))
                };
            });
        }
        catch (error) {
            this.logger.error('Error parsing AI response:', error);
            this.logger.error('Raw response:', response);
            throw new Error('Failed to parse AI response');
        }
    }
    parseExplanationResponse(response) {
        return response.trim().replace(/^["']|["']$/g, '');
    }
    async validateSubscription(userId) {
        const hasAIAccess = await this.subscriptionValidation.hasAIAccess(userId);
        const status = await this.subscriptionValidation.validateStudentSubscription(userId);
        return {
            hasAIAccess,
            planType: status.planType || 'MANUAL'
        };
    }
    async fetchExistingTips(subjectId, topicId, subtopicId) {
        try {
            const whereClause = {
                subjectId,
                tip_formula: { not: null },
                NOT: { tip_formula: '' }
            };
            if (topicId) {
                whereClause.topicId = topicId;
            }
            if (subtopicId) {
                whereClause.subtopicId = subtopicId;
            }
            const questionsWithTips = await this.prisma.question.findMany({
                where: whereClause,
                select: {
                    tip_formula: true,
                    stem: true
                },
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const usefulTips = questionsWithTips
                .filter(q => q.tip_formula && q.tip_formula.length > 10)
                .map(q => q.tip_formula)
                .slice(0, 5);
            this.logger.log(`Found ${usefulTips.length} existing tips for AI question generation`);
            return usefulTips;
        }
        catch (error) {
            this.logger.error('Error fetching existing tips:', error);
            return [];
        }
    }
    async generateQuestionsWithTips(request) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const existingTips = await this.fetchExistingTips(request.subjectId, request.topicId, request.subtopicId);
            const enhancedRequest = {
                ...request,
                existingTips
            };
            const prompt = this.buildQuestionPrompt(enhancedRequest);
            const response = await this.callOpenAI(prompt);
            return this.parseAIResponse(response);
        }
        catch (error) {
            this.logger.error('Error generating AI questions with tips:', error);
            throw new Error('Failed to generate AI questions with tips');
        }
    }
};
exports.AIService = AIService;
exports.AIService = AIService = AIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        subscription_validation_service_1.SubscriptionValidationService,
        prisma_service_1.PrismaService])
], AIService);
//# sourceMappingURL=ai.service.js.map