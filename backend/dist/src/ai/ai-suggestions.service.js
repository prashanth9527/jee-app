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
var AISuggestionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let AISuggestionsService = AISuggestionsService_1 = class AISuggestionsService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AISuggestionsService_1.name);
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    }
    async generatePersonalizedSuggestions(request) {
        try {
            const performanceData = await this.analyzeStudentPerformance(request.userId);
            const suggestions = await this.generateAISuggestions(performanceData, request);
            return suggestions.sort((a, b) => {
                const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0)
                    return priorityDiff;
                return b.confidence - a.confidence;
            }).slice(0, request.limit || 10);
        }
        catch (error) {
            this.logger.error('Error generating AI suggestions:', error);
            throw new Error('Failed to generate personalized suggestions');
        }
    }
    async analyzeStudentPerformance(userId) {
        const performanceData = await this.prisma.$queryRawUnsafe(`
      SELECT 
        s.id as "subjectId",
        s.name as "subjectName",
        t.id as "topicId",
        t.name as "topicName",
        st.id as "subtopicId",
        st.name as "subtopicName",
        q.difficulty,
        COUNT(a.id)::int as "totalQuestions",
        SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
        ROUND(
          (SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
          2
        ) as "score",
        MAX(es."submittedAt") as "lastAttempted"
      FROM "ExamAnswer" a
      JOIN "Question" q ON q.id = a."questionId"
      JOIN "Subject" s ON s.id = q."subjectId"
      LEFT JOIN "Topic" t ON t.id = q."topicId"
      LEFT JOIN "Subtopic" st ON st.id = q."subtopicId"
      JOIN "ExamSubmission" es ON es.id = a."submissionId"
      WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
      GROUP BY s.id, s.name, t.id, t.name, st.id, st.name, q.difficulty
      HAVING COUNT(a.id) >= 3
      ORDER BY "lastAttempted" DESC, "score" ASC
    `, userId);
        return performanceData.map(item => ({
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            topicId: item.topicId || undefined,
            topicName: item.topicName || undefined,
            subtopicId: item.subtopicId || undefined,
            subtopicName: item.subtopicName || undefined,
            totalQuestions: item.totalQuestions,
            correctAnswers: item.correctAnswers,
            score: parseFloat(item.score) || 0,
            difficulty: item.difficulty,
            lastAttempted: new Date(item.lastAttempted)
        }));
    }
    async generateAISuggestions(performanceData, request) {
        if (!this.openaiApiKey) {
            return this.generateRuleBasedSuggestions(performanceData, request);
        }
        try {
            const prompt = this.buildSuggestionPrompt(performanceData, request);
            const response = await this.callOpenAI(prompt);
            return this.parseSuggestionResponse(response);
        }
        catch (error) {
            this.logger.error('Error calling OpenAI for suggestions:', error);
            return this.generateRuleBasedSuggestions(performanceData, request);
        }
    }
    buildSuggestionPrompt(performanceData, request) {
        const performanceSummary = performanceData.map(p => `${p.subjectName}${p.topicName ? ` > ${p.topicName}` : ''}${p.subtopicName ? ` > ${p.subtopicName}` : ''}: ${p.score}% (${p.correctAnswers}/${p.totalQuestions} questions, ${p.difficulty} difficulty)`).join('\n');
        return `You are an expert JEE (Joint Entrance Examination) tutor. Analyze the following student performance data and provide personalized learning suggestions.

STUDENT PERFORMANCE DATA:
${performanceSummary}

REQUIREMENTS:
- Generate ${request.limit || 10} personalized suggestions
- Focus on areas where the student needs improvement
- Consider difficulty progression (Easy → Medium → Hard)
- Provide specific, actionable recommendations
- Include estimated time to improve each area
- Assign priority levels (HIGH, MEDIUM, LOW) based on urgency
- Categorize suggestions into: FOCUS_AREA, PRACTICE_AREA, REVISION_AREA, ADVANCED_AREA

OUTPUT FORMAT (JSON array):
[
  {
    "type": "FOCUS_AREA",
    "priority": "HIGH",
    "subjectId": "subject_id",
    "subjectName": "Subject Name",
    "topicId": "topic_id",
    "topicName": "Topic Name",
    "subtopicId": "subtopic_id",
    "subtopicName": "Subtopic Name",
    "reason": "Clear explanation of why this area needs attention",
    "recommendedActions": ["Action 1", "Action 2", "Action 3"],
    "estimatedTimeToImprove": "2-3 weeks",
    "confidence": 85
  }
]

Focus on providing practical, achievable suggestions that will help the student improve their JEE preparation.`;
    }
    async callOpenAI(prompt) {
        const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert JEE tutor specializing in personalized learning recommendations. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    parseSuggestionResponse(response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            const suggestions = JSON.parse(jsonMatch[0]);
            return suggestions.map((s) => ({
                type: s.type || 'FOCUS_AREA',
                priority: s.priority || 'MEDIUM',
                subjectId: s.subjectId,
                subjectName: s.subjectName,
                topicId: s.topicId,
                topicName: s.topicName,
                subtopicId: s.subtopicId,
                subtopicName: s.subtopicName,
                reason: s.reason || 'Area identified for improvement',
                recommendedActions: Array.isArray(s.recommendedActions) ? s.recommendedActions : ['Practice more questions'],
                estimatedTimeToImprove: s.estimatedTimeToImprove || '1-2 weeks',
                confidence: Math.min(100, Math.max(0, s.confidence || 70))
            }));
        }
        catch (error) {
            this.logger.error('Error parsing AI suggestion response:', error);
            throw new Error('Failed to parse AI suggestions');
        }
    }
    generateRuleBasedSuggestions(performanceData, request) {
        const suggestions = [];
        const weakAreas = performanceData.filter(p => p.score < 60);
        weakAreas.forEach(area => {
            suggestions.push({
                type: 'FOCUS_AREA',
                priority: 'HIGH',
                subjectId: area.subjectId,
                subjectName: area.subjectName,
                topicId: area.topicId,
                topicName: area.topicName,
                subtopicId: area.subtopicId,
                subtopicName: area.subtopicName,
                reason: `Low performance (${area.score}%) indicates need for focused practice`,
                recommendedActions: [
                    'Review fundamental concepts',
                    'Practice more questions in this area',
                    'Seek additional study materials'
                ],
                estimatedTimeToImprove: '2-4 weeks',
                confidence: 85
            });
        });
        const practiceAreas = performanceData.filter(p => p.score >= 60 && p.score < 80);
        practiceAreas.forEach(area => {
            suggestions.push({
                type: 'PRACTICE_AREA',
                priority: 'MEDIUM',
                subjectId: area.subjectId,
                subjectName: area.subjectName,
                topicId: area.topicId,
                topicName: area.topicName,
                subtopicId: area.subtopicId,
                subtopicName: area.subtopicName,
                reason: `Moderate performance (${area.score}%) - practice needed for mastery`,
                recommendedActions: [
                    'Increase practice frequency',
                    'Focus on time management',
                    'Review common mistakes'
                ],
                estimatedTimeToImprove: '1-2 weeks',
                confidence: 75
            });
        });
        const strongAreas = performanceData.filter(p => p.score >= 80);
        strongAreas.forEach(area => {
            suggestions.push({
                type: 'ADVANCED_AREA',
                priority: 'LOW',
                subjectId: area.subjectId,
                subjectName: area.subjectName,
                topicId: area.topicId,
                topicName: area.topicName,
                subtopicId: area.subtopicId,
                subtopicName: area.subtopicName,
                reason: `Strong performance (${area.score}%) - ready for advanced challenges`,
                recommendedActions: [
                    'Attempt harder questions',
                    'Help other students',
                    'Explore related advanced topics'
                ],
                estimatedTimeToImprove: 'Ongoing',
                confidence: 90
            });
        });
        return suggestions.slice(0, request.limit || 10);
    }
    async getSuggestionHistory(userId, limit = 20) {
        return [];
    }
    async markSuggestionAsFollowed(suggestionId, userId) {
        this.logger.log(`Student ${userId} marked suggestion ${suggestionId} as followed`);
    }
};
exports.AISuggestionsService = AISuggestionsService;
exports.AISuggestionsService = AISuggestionsService = AISuggestionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AISuggestionsService);
//# sourceMappingURL=ai-suggestions.service.js.map