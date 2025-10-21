import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly openaiModel: string;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  async generateBlogContent(prompt: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            {
              role: 'system',
              content: `You are an expert educational content writer specializing in JEE, NEET, and competitive exam preparation. 
              Create comprehensive, well-structured blog posts that are:
              - Educational and informative
              - SEO-optimized
              - Engaging and easy to read
              - Accurate and up-to-date
              - Helpful for students preparing for competitive exams
              
              Always include:
              - A compelling title
              - Clear structure with headings
              - Practical tips and advice
              - Relevant examples
              - Actionable insights
              
              Format the response as JSON with the following structure:
              {
                "title": "Blog Title",
                "excerpt": "Brief description of the blog post",
                "content": "Full HTML content with proper formatting",
                "tags": ["tag1", "tag2", "tag3"],
                "metaTitle": "SEO optimized title",
                "metaDescription": "SEO meta description",
                "metaKeywords": "comma-separated keywords"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse the JSON response
      try {
        const parsedContent = JSON.parse(content);
        return JSON.stringify(parsedContent);
      } catch (parseError) {
        // If JSON parsing fails, return the raw content
        return content;
      }
    } catch (error) {
      console.error('Error generating blog content:', error);
      throw new Error(`Failed to generate blog content: ${error.message}`);
    }
  }

  async generateBlogFromNews(topic: string, stream: string = 'JEE'): Promise<any> {
    if (!this.openaiApiKey) {
      return this.getFallbackBlogContent(topic, stream);
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `Generate a comprehensive educational blog post about "${topic}" for ${stream} aspirants based on current trends and news as of ${currentDate}. 

    The blog should cover:
    1. Latest developments and trends related to ${topic} in ${stream} preparation
    2. Current news and updates that affect ${stream} aspirants
    3. Practical study tips and strategies
    4. Recent changes in exam patterns or syllabus (if any)
    5. Expert insights and recommendations
    6. Future implications for students
    
    Make it relevant to ${currentDate} and include recent information that would be valuable for students preparing for ${stream} exam.`;

    try {
      const content = await this.generateBlogContent(prompt);
      return this.parseBlogContent(content, topic, stream);
    } catch (error) {
      console.error('Error generating blog from news:', error);
      return this.getFallbackBlogContent(topic, stream);
    }
  }

  private parseBlogContent(content: string, topic: string, stream: string) {
    return JSON.parse(content);
  }

  async generateBlogFromTopic(topic: string, stream: string = 'JEE', category: string = 'Study Tips'): Promise<any> {
    if (!this.openaiApiKey) {
      return this.getFallbackBlogContent(topic, stream);
    }

    const prompt = `Create a comprehensive educational blog post about "${topic}" for ${stream} aspirants in the "${category}" category.

    The blog should include:
    1. Introduction to the topic and its importance for ${stream} preparation
    2. Detailed explanation of concepts
    3. Step-by-step study approach
    4. Common mistakes to avoid
    5. Practice strategies and tips
    6. Real-world applications
    7. Conclusion with key takeaways
    
    Make it educational, engaging, and practical for students preparing for ${stream} exam.`;

    try {
      const content = await this.generateBlogContent(prompt);
      return this.parseBlogContent(content, topic, stream);
    } catch (error) {
      console.error('Error generating blog from topic:', error);
      return this.getFallbackBlogContent(topic, stream);
    }
  }

  async generateBlogFromKeywords(keywords: string[], stream: string = 'JEE'): Promise<any> {
    if (!this.openaiApiKey) {
      const topic = keywords.join(' ');
      return this.getFallbackBlogContent(topic, stream);
    }

    const keywordString = keywords.join(', ');
    const prompt = `Create an educational blog post for ${stream} aspirants that naturally incorporates and covers these keywords: ${keywordString}.

    The blog should:
    1. Naturally integrate all the keywords
    2. Provide valuable educational content
    3. Be relevant to ${stream} preparation
    4. Include practical examples and tips
    5. Be well-structured and easy to read
    6. Optimize for search engines while maintaining readability
    
    Ensure the content flows naturally and provides genuine value to students.`;

    try {
      const content = await this.generateBlogContent(prompt);
      return this.parseBlogContent(content, keywords.join(' '), stream);
    } catch (error) {
      console.error('Error generating blog from keywords:', error);
      const topic = keywords.join(' ');
      return this.getFallbackBlogContent(topic, stream);
    }
  }

  async generateBlogTitle(topic: string, stream: string = 'JEE'): Promise<string[]> {
    if (!this.openaiApiKey) {
      // Return fallback titles when AI service is not configured
      return this.getFallbackTitles(topic, stream);
    }

    const prompt = `Generate 5 SEO-optimized blog titles for an article about "${topic}" for ${stream} aspirants. 
    
    Each title should be:
    - Under 60 characters
    - SEO-friendly
    - Engaging and click-worthy
    - Relevant to ${stream} preparation
    - Include relevant keywords
    
    Return only the titles, one per line.`;

    try {
    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
          model: this.openaiModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
          max_tokens: 300,
          temperature: 0.8,
      }),
    });

    if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        return this.getFallbackTitles(topic, stream);
    }

    const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return this.getFallbackTitles(topic, stream);
      }

      // Split by newlines and clean up
      const titles = content.split('\n')
        .map((title: string) => title.trim())
        .filter((title: string) => title.length > 0)
        .slice(0, 5);

      return titles.length > 0 ? titles : this.getFallbackTitles(topic, stream);
    } catch (error) {
      console.error('Error generating blog titles:', error);
      return this.getFallbackTitles(topic, stream);
    }
  }

  private getFallbackTitles(topic: string, stream: string): string[] {
    const streamName = stream === 'JEE' ? 'JEE' : stream === 'NEET' ? 'NEET' : stream;
    return [
      `${topic}: Complete Guide for ${streamName} Aspirants`,
      `Master ${topic} for ${streamName} 2024: Expert Tips`,
      `${topic} Strategies: Boost Your ${streamName} Preparation`,
      `Ultimate ${topic} Guide for ${streamName} Success`,
      `${topic} Made Easy: ${streamName} Preparation Tips`
    ];
  }

  private getFallbackBlogContent(topic: string, stream: string) {
    const streamName = stream === 'JEE' ? 'JEE' : stream === 'NEET' ? 'NEET' : stream;
    const title = `${topic}: Essential Guide for ${streamName} Aspirants`;
    
    return {
      title,
      content: `
        <h2>Introduction to ${topic}</h2>
        <p>Welcome to our comprehensive guide on ${topic} for ${streamName} aspirants. This guide will help you understand the key concepts and strategies needed for success in your ${streamName} preparation.</p>
        
        <h3>Key Concepts</h3>
        <p>Understanding ${topic} is crucial for your ${streamName} preparation. Here are the essential concepts you need to master:</p>
        <ul>
          <li>Fundamental principles and theories</li>
          <li>Important formulas and equations</li>
          <li>Problem-solving strategies</li>
          <li>Common mistakes to avoid</li>
        </ul>
        
        <h3>Study Strategies</h3>
        <p>Effective study strategies for ${topic} include:</p>
        <ul>
          <li>Regular practice with sample problems</li>
          <li>Understanding concepts before memorizing formulas</li>
          <li>Taking mock tests to assess progress</li>
          <li>Seeking help when needed</li>
        </ul>
        
        <h3>Tips for Success</h3>
        <p>Here are some expert tips to excel in ${topic} for ${streamName}:</p>
        <ul>
          <li>Create a study schedule and stick to it</li>
          <li>Focus on understanding rather than rote learning</li>
          <li>Practice regularly with previous year questions</li>
          <li>Stay updated with latest exam patterns</li>
        </ul>
        
        <h3>Conclusion</h3>
        <p>Mastering ${topic} requires dedication, practice, and the right approach. Follow this guide and implement the strategies mentioned to improve your ${streamName} preparation and achieve your goals.</p>
      `,
      excerpt: `Master ${topic} for ${streamName} preparation with our comprehensive guide. Learn key concepts, study strategies, and expert tips for success.`,
      metaTitle: `${topic} Guide for ${streamName} Aspirants | Expert Tips & Strategies`,
      metaDescription: `Complete guide to ${topic} for ${streamName} preparation. Learn essential concepts, study strategies, and expert tips for exam success.`,
      metaKeywords: `${topic}, ${streamName}, preparation, study tips, exam strategies, competitive exams`,
      tags: [topic, streamName, 'Study Tips', 'Preparation', 'Exam Strategy']
    };
  }

  async generateBlogOutline(topic: string, stream: string = 'JEE'): Promise<string[]> {
    const prompt = `Create a detailed outline for a blog post about "${topic}" for ${stream} aspirants.

    The outline should include:
    1. Main headings (H2)
    2. Sub-headings (H3)
    3. Key points under each section
    4. Suggested content structure
    
    Return the outline in a clear, hierarchical format.`;

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No outline generated');
      }

      return content.split('\n').filter((line: string) => line.trim().length > 0);
    } catch (error) {
      console.error('Error generating blog outline:', error);
      throw new Error(`Failed to generate blog outline: ${error.message}`);
    }
  }

  async generateQuestionsWithTips(request: {
    subject: string;
    lesson?: string;
    topic?: string;
    subtopic?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionCount: number;
    subjectId: string;
    topicId?: string;
    subtopicId?: string;
  }): Promise<{
    questions: Array<{
      question: string;
      options?: Array<{ text: string; isCorrect: boolean }>;
      explanation: string;
      difficulty: string;
      tip_formula?: string;
      isOpenEnded?: boolean;
      correctNumericAnswer?: number;
      answerTolerance?: number;
    }>;
  }> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildQuestionGenerationPrompt(request);

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,

          messages: [
            {
              role: 'system',
              content: `You are an expert JEE (Joint Entrance Examination) question generator. Your task is to create high-quality, educational questions that test students' conceptual understanding.
You are an expert JEE (Joint Entrance Examination) question generator. Your task is to create high-quality, educational questions that test students' conceptual understanding.

CRITICAL INPUTS:
- Subject: ${request.subject}
- Lesson: ${request.lesson}
- Topic: ${request.topic}
- Subtopic (if exists): ${request.subtopic}
- Difficulty level: ${request.difficulty}
- Number of questions: ${request.questionCount}

Your output must align closely with the provided subject, lesson, topic, and subtopic. All questions and options must be contextually accurate to that scope.

 CRITICAL REQUIREMENTS:
 1. Generate EXACTLY ${request.questionCount} questions — not fewer, not more. If you cannot fit everything in one response, process internally in chunks, but the FINAL returned JSON MUST contain a single "questions" array with exactly ${request.questionCount} items.
 2. Each question can be either:
    a) Multiple choice: exactly 4 distinct, contextually relevant options (A, B, C, D)
    b) Open-ended: no options, requires numeric answer input
 3. For multiple choice: Mark exactly ONE option as correct (isCorrect: true).
 4. For open-ended: Include correctNumericAnswer (the exact numeric value) and answerTolerance (acceptable range, default 0.01).
 5. Each incorrect option must be a **plausible misconception** or **near-miss** (numerically close, algebraically similar, or based on a common error).
 6. Do NOT use placeholder text such as "Option A", "Option 1", "All of the above", or "None of the above".
 7. All options must be **concrete, meaningful answers** directly related to the question (values, expressions, equations, or statements).
 8. Provide detailed step-by-step explanations for each correct answer.
 9. Include a "tip_formula" field summarizing key formulas or concepts used.
 10. Questions must match ${request.difficulty} difficulty and JEE relevance.
 11. Use single dollar signs $...$ for all LaTeX math expressions (not double).
 12. Ensure conceptual depth — not memory-based or trivial recall.
 13. For numerical/units questions: ensure all options include consistent units and realistic magnitudes.
 14. Ensure JSON validity: no unescaped quotes, no extra text, no markdown. Start with '{' and end with '}'. The output must be a single JSON object with a "questions" array of length ${request.questionCount}.

 ADDITIONAL GUIDANCE FOR OPTION GENERATION:
 - For **calculation-based** questions: make distractors by varying constants, powers, or signs slightly (e.g., $2x$, $x^2$, $3x$, $x/2$).
 - For **conceptual** questions: use common misconceptions or reversed logic.
 - For **chemistry**: vary oxidation states, hybridization, or molecular geometry plausibly.
 - For **physics**: vary numerical values or formula substitutions.
 - NEVER produce generic placeholder options.
 - **LaTeX in options**: Options may contain LaTeX equations using single dollar signs $...$ for inline math (e.g., $\\frac{1}{2}$, $x^2$, $\\sqrt{3}$).

 RESPONSE FORMAT (Strict JSON Only):
 
 {
   "questions": [
     {
       "question": "Text with LaTeX like $\\frac{d}{dx}[x^2] = ?$",
       "options": [
         {"text": "$2x$", "isCorrect": true},
         {"text": "$x^2$", "isCorrect": false},
         {"text": "$2x^2$", "isCorrect": false},
         {"text": "$x$", "isCorrect": false}
       ],
       "explanation": "Step-by-step reasoning explaining why $\\frac{d}{dx}[x^2] = 2x$ and why others are incorrect.",
       "difficulty": "${request.difficulty}",
       "tip_formula": "Key formula: $\\frac{d}{dx}[x^n] = nx^{n-1}$"
     },
     {
       "question": "Calculate the value of $\\int_0^1 x^2 dx$",
       "isOpenEnded": true,
       "correctNumericAnswer": 0.333,
       "answerTolerance": 0.01,
       "explanation": "Using the power rule: $\\int x^2 dx = \\frac{x^3}{3}$. Evaluating from 0 to 1: $\\frac{1^3}{3} - \\frac{0^3}{3} = \\frac{1}{3} \\approx 0.333$",
       "difficulty": "${request.difficulty}",
       "tip_formula": "Power rule: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$"
     }
   ]
 }

CRITICAL: Test your JSON before responding. Ensure it's valid JSON that can be parsed without errors.
Do not include any text outside the JSON structure.

### FINAL INSTRUCTION
Use single dollar signs $ ... $ for all LaTeX math expressions.
Respond with **ONLY valid JSON**. Do not include explanations or markdown. Start with '{' and end with '}'.
`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      console.log('GPT:', content)

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse the JSON response with improved error handling
      try {
        // Clean the response content to handle common JSON issues
        let cleanedContent = content.trim();
        
        // Remove any markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        // If model wrapped JSON with stray characters before/after, try to slice to the first '{' and last '}'
        const firstBrace = cleanedContent.indexOf('{');
        const lastBrace = cleanedContent.lastIndexOf('}');
        if (firstBrace > 0 && lastBrace > firstBrace) {
          cleanedContent = cleanedContent.slice(firstBrace, lastBrace + 1);
        }

        // Try to fix common JSON escaping issues
        cleanedContent = this.fixJsonEscaping(cleanedContent);

        const parsedContent = JSON.parse(cleanedContent);
        
        // Validate the response structure
        if (!parsedContent.questions || !Array.isArray(parsedContent.questions)) {
          throw new Error('Invalid response structure: missing questions array');
        }

        // Ensure we have the requested number of questions
        if (parsedContent.questions.length !== request.questionCount) {
          console.warn(`Generated ${parsedContent.questions.length} questions, requested ${request.questionCount}`);
        }

        // Validate and clean each question
        const cleanedQuestions = [] as any[];
        for (const question of parsedContent.questions) {
          if (!question.question || !question.explanation) {
            console.warn('Skipping invalid question structure:', question);
            continue;
          }

          // Handle open-ended questions
          if (question.isOpenEnded) {
            if (typeof question.correctNumericAnswer !== 'number') {
              console.warn('Skipping open-ended question with invalid numeric answer:', question);
              continue;
            }
            
            const cleaned = {
              question: this.cleanTextContent(question.question),
              explanation: this.cleanTextContent(question.explanation),
              difficulty: question.difficulty || request.difficulty,
              tip_formula: question.tip_formula ? this.cleanTextContent(question.tip_formula) : undefined,
              isOpenEnded: true,
              correctNumericAnswer: question.correctNumericAnswer,
              answerTolerance: question.answerTolerance || 0.01
            };
            cleanedQuestions.push(cleaned);
            continue;
          }

          // Handle multiple choice questions
          if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
            console.warn('Skipping question with invalid options:', question);
            continue;
          }
          const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
          if (correctOptions.length !== 1) {
            console.warn('Skipping question with invalid correct options:', question);
            continue;
          }

          // Clean the question content
          const cleaned = {
            question: this.cleanTextContent(question.question),
            options: question.options.map((opt: any) => ({
              text: this.cleanTextContent(opt.text),
              isCorrect: opt.isCorrect
            })),
            explanation: this.cleanTextContent(question.explanation),
            difficulty: question.difficulty || request.difficulty,
            tip_formula: question.tip_formula ? this.cleanTextContent(question.tip_formula) : undefined
          };

          // Run server-side validation; attempt single repair if needed
          const validation = this.validateQuestionShape(cleaned as any);
          if (!validation.valid) {
            try {
              const repaired = await this.repairQuestionOptions(cleaned, {
                subject: request.subject,
                topic: request.topic,
                subtopic: request.subtopic,
                difficulty: request.difficulty
              });
              const recheck = this.validateQuestionShape(repaired);
              if (recheck.valid) {
                cleanedQuestions.push(repaired);
              } else {
                console.warn('Dropping question after failed repair:', recheck.reason);
              }
            } catch (_e) {
              console.warn('Repair failed; dropping question');
            }
          } else {
            cleanedQuestions.push(cleaned);
          }
        }

        if (cleanedQuestions.length === 0) {
          throw new Error('No valid questions could be parsed from AI response');
        }

        return { questions: cleanedQuestions };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response:', content);
        
        // Fallback: try to extract questions using regex if JSON parsing fails
        // IMPORTANT: Disable placeholder fallbacks. If parsing fails, propagate the error so we never create
        // generic options like "Option A/B/C/D".
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  private buildQuestionGenerationPrompt(request: {
    subject: string;
    lesson?: string;
    topic?: string;
    subtopic?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionCount: number;
  }): string {
    const lessonContext = request.lesson ? ` - ${request.lesson}` : '';
    const topicContext = request.topic ? ` - ${request.topic}` : '';
    const subtopicContext = request.subtopic ? ` - ${request.subtopic}` : '';
    
    const difficultyGuidelines = {
      'EASY': 'Basic concepts, straightforward applications, single-step problems',
      'MEDIUM': 'Moderate complexity, multi-step problems, concept integration',
      'HARD': 'Advanced concepts, complex problem-solving, multiple concept integration'
    };

    return `Generate ${request.questionCount} high-quality JEE practice questions for:

Subject: ${request.subject}${lessonContext}${topicContext}${subtopicContext}
Difficulty Level: ${request.difficulty}
Difficulty Guidelines: ${difficultyGuidelines[request.difficulty]}

QUESTION REQUIREMENTS:
1. Create questions that test conceptual understanding
2. Include mathematical problems with proper LaTeX formatting
3. Ensure questions are relevant to JEE syllabus
4. Options must be CONCRETE content (values/statements), not placeholders. NEVER output texts like "Option A", "Option B", etc.
5. Provide exactly 4 options. Make 1 option correct and 3 distractors that are plausible and close to the correct value/concept.
6. For numerical/units questions: include appropriate units in ALL options; keep magnitudes realistic; distractors should reflect common mistakes.
7. Do NOT use options like "All of the above" / "None of the above" / duplicates.
8. Ensure option texts are distinct and non-empty; avoid trivial variations.
5. Provide comprehensive explanations
6. Include relevant formulas and tips
7. Vary question types (calculation, conceptual, application)
8. Ensure questions are original and educational

TOPIC FOCUS:
${request.topic ? `Primary Topic: ${request.topic}` : 'General subject knowledge'}
${request.subtopic ? `Specific Subtopic: ${request.subtopic}` : ''}

Generate questions that would help students prepare for JEE Main and Advanced exams.`;
  }

  // Basic server-side validation and auto-repair for option quality
  private isOptionTextWeak(text: string): boolean {
    if (!text) return true;
    const trimmed = text.trim().toLowerCase();
    if (trimmed.length < 2) return true;
    // Reject placeholder-like options and label patterns
    const placeholderPatterns = [
      /^option\s*[a-d]\b/,
      /^choice\s*[a-d]\b/,
      /^[a-d]\)?\.?[:\-]?\s*$/,           // single letter like "A)" or "C:"
      /^(all\s*of\s*the\s*above|none\s*of\s*the\s*above|both\s*a\s*and\s*b)$/,
      /^opt\s*[a-d]\b/
    ];
    if (placeholderPatterns.some((re) => re.test(trimmed))) return true;
    // Any occurrence of the word 'option' is suspicious
    if (trimmed.includes('option')) return true;
    if (['a', 'b', 'c', 'd'].includes(trimmed)) return true;
    return false;
  }

  private validateQuestionShape(q: any): { valid: boolean; reason?: string } {
    if (!q) return { valid: false, reason: 'empty' };
    if (!Array.isArray(q.options) || q.options.length !== 4) return { valid: false, reason: 'must have exactly 4 options' };
    const correctCount = q.options.filter((o: any) => o?.isCorrect === true).length;
    if (correctCount !== 1) return { valid: false, reason: 'must have exactly one correct option' };
    const texts = q.options.map((o: any) => (o?.text || '').trim());
    if (texts.some((t: string) => this.isOptionTextWeak(t))) return { valid: false, reason: 'weak/placeholder option text' };
    const unique = new Set(texts.map((t: string) => t.toLowerCase()));
    if (unique.size !== texts.length) return { valid: false, reason: 'duplicate options' };
    return { valid: true };
  }

  private async repairQuestionOptions(original: any, context: { subject: string; topic?: string; subtopic?: string; difficulty: string }): Promise<any> {
    // Ask the model to rewrite only the options to satisfy constraints. Keep question, explanation, tip_formula intact.
    const system = `You are an expert JEE item writer. You will FIX only the options for a given question.
STRICT RULES:
1) Options must be concrete values/statements relevant to the question. 
2) DO NOT use labels like "Option A", "Option B", etc. Do not include the word 'Option' anywhere.
3) Exactly four distinct options; exactly one must have isCorrect: true.
4) For numeric problems include units consistently and keep magnitudes realistic.
5) Never use "All of the above" / "None of the above" / duplicates.`;
    const user = {
      role: 'user',
      content: `Context:\nSubject: ${context.subject}${context.topic ? ` | Topic: ${context.topic}` : ''}${context.subtopic ? ` | Subtopic: ${context.subtopic}` : ''}\nDifficulty: ${context.difficulty}\n\nQuestion JSON (keep question/explanation/tip_formula exactly the same):\n${JSON.stringify(original)}\n\nTASK:\n- Replace the options with exactly 4 distinct, realistic options.\n- Exactly ONE option must have "+ isCorrect: true".\n- Do NOT use placeholder words like "Option A/B/C/D"; do not include the word 'Option' at all.\n- For numeric/units problems, include consistent units.\n\nRespond with ONLY the full corrected JSON object for this single question.`
    } as any;

    try {
      const resp = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            { role: 'system', content: system },
            user
          ],
          temperature: 0.7,
        })
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return original;
      const fixed = JSON.parse(content);
      return fixed;
    } catch (e) {
      // If repair fails, return original
      return original;
    }
  }

  async generateExplanationWithTips(
    questionStem: string,
    correctAnswer: string,
    userAnswer?: string,
    tipFormula?: string
  ): Promise<{
    explanation: string;
    tips: string[];
    commonMistakes: string[];
    relatedConcepts: string[];
  }> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildExplanationPrompt(questionStem, correctAnswer, userAnswer, tipFormula);

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: [
            {
              role: 'system',
              content: `You are an expert JEE tutor providing detailed explanations for practice questions. Your task is to help students understand not just the correct answer, but the reasoning behind it.

CRITICAL REQUIREMENTS:
1. Provide step-by-step explanations that are clear and educational
2. Include relevant formulas and mathematical concepts
3. Explain why the correct answer is right
4. If user provided an incorrect answer, explain why it's wrong
5. Include helpful tips and shortcuts
6. Mention common mistakes students make
7. Suggest related concepts for further study
8. Use proper LaTeX formatting for mathematical expressions ($$...$$)
9. Make explanations suitable for JEE preparation level

RESPONSE FORMAT:
You MUST respond with ONLY valid JSON in this exact structure:
{
  "explanation": "Detailed step-by-step explanation with LaTeX math: $$\\frac{d}{dx}[x^2] = 2x$$. This is because...",
  "tips": ["Tip 1: Always check your work", "Tip 2: Remember the formula $$\\frac{d}{dx}[x^n] = nx^{n-1}$$"],
  "commonMistakes": ["Mistake 1: Forgetting to apply chain rule", "Mistake 2: Sign errors"],
  "relatedConcepts": ["Related concept 1", "Related concept 2"]
}

Do not include any text outside the JSON structure.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse the JSON response
      try {
        const parsedContent = JSON.parse(content);
        
        // Validate the response structure
        if (!parsedContent.explanation) {
          throw new Error('Invalid response structure: missing explanation');
        }

        return {
          explanation: parsedContent.explanation || 'Explanation not available',
          tips: parsedContent.tips || [],
          commonMistakes: parsedContent.commonMistakes || [],
          relatedConcepts: parsedContent.relatedConcepts || []
        };
      } catch (parseError) {
        console.error('Error parsing AI explanation response:', parseError);
        console.error('Raw response:', content);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      throw new Error(`Failed to generate explanation: ${error.message}`);
    }
  }

  private buildExplanationPrompt(
    questionStem: string,
    correctAnswer: string,
    userAnswer?: string,
    tipFormula?: string
  ): string {
    let prompt = `Provide a comprehensive explanation for this JEE practice question:

QUESTION: ${questionStem}

CORRECT ANSWER: ${correctAnswer}`;

    if (userAnswer) {
      prompt += `\n\nUSER'S ANSWER: ${userAnswer}`;
    }

    if (tipFormula) {
      prompt += `\n\nRELEVANT FORMULA/TIP: ${tipFormula}`;
    }

    prompt += `\n\nPlease provide:
1. A detailed step-by-step explanation of how to solve this question
2. Why the correct answer is the right choice
3. If the user provided an answer, explain why it's correct or incorrect
4. Helpful tips and shortcuts for similar problems
5. Common mistakes students make with this type of question
6. Related concepts that would help understand this topic better

Make the explanation educational and suitable for JEE preparation level.`;

    return prompt;
  }

  private fixJsonEscaping(content: string): string {
    // Fix common JSON escaping issues
    let fixed = content;
    
    // Fix unescaped backslashes in LaTeX (common issue)
    // Replace single backslashes with double backslashes, but be careful with already escaped ones
    fixed = fixed.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
    
    // Fix unescaped quotes in LaTeX expressions
    fixed = fixed.replace(/\\\\([^"]*)"([^\\"]*)\\\\/g, '\\\\$1\\"$2\\\\');
    
    // DO NOT replace raw newlines/tabs globally; that corrupts JSON outside strings
    return fixed;
  }

  private cleanTextContent(text: string): string {
    if (!text) return '';
    
    // Remove any null characters or other problematic characters
    let cleaned = text.replace(/\0/g, '');
    
    // Fix common LaTeX escaping issues
    cleaned = cleaned.replace(/\\\\/g, '\\');
    
    // Ensure proper LaTeX formatting
    cleaned = cleaned.replace(/\$\$([^$]+)\$\$/g, (match, content) => {
      // Clean the LaTeX content
      const cleanContent = content.trim().replace(/\\/g, '\\\\');
      return `$$${cleanContent}$$`;
    });
    
    return cleaned.trim();
  }

  private extractQuestionsFromText(_content: string, _expectedCount: number): any[] {
    // Fallback disabled to avoid placeholder options. Return empty to force upstream retry/failure.
    return [];
  }
} 