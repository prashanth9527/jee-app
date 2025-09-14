import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
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
          model: 'gpt-3.5-turbo',
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
          model: 'gpt-3.5-turbo',
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
          model: 'gpt-3.5-turbo',
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
}