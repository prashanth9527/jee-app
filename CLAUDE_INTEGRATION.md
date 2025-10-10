# Claude AI Integration for LaTeX Question Processing

## Overview

This document describes the implementation of Claude (Anthropic) AI integration for processing LaTeX files to extract JEE questions.

## Features

### ✅ **Claude API Integration**
- Uses Claude 3.5 Sonnet model (200k context window)
- Processes LaTeX (.tex) files directly
- Automatic chunking for large files
- Token estimation and management

### ✅ **Smart Chunking**
- Automatically splits large files into manageable chunks
- Maintains context across chunks
- Processes up to 180k tokens per chunk (with buffer)
- Aggregates results from all chunks

### ✅ **LaTeX Processing**
- Reads .tex files directly
- Extracts questions with full metadata
- Supports all LaTeX mathematical expressions
- Generates missing options and explanations

## Architecture

### **Files Created/Modified**

1. **`backend/src/ai/claude.service.ts`** - NEW
   - Main Claude service implementation
   - Handles API communication
   - Implements chunking logic
   - Processes LaTeX content

2. **`backend/src/ai/ai-provider.interface.ts`** - MODIFIED
   - Added 'claude' to AIProviderType
   - Interface remains compatible

3. **`backend/src/ai/ai-provider.factory.ts`** - MODIFIED
   - Registered Claude service
   - Added availability check for ANTHROPIC_API_KEY

4. **`backend/src/admin/admin.module.ts`** - MODIFIED
   - Added ClaudeService to providers
   - Injected into module

## Configuration

### **Environment Variables**

Add to your `.env` file:

```env
# Claude (Anthropic) API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

### **Available Models**

- `claude-sonnet-4-5-20250929` (Recommended) - 200k context, latest Claude 4.5 Sonnet
- `claude-3-5-sonnet-20240620` - 200k context, Claude 3.5 Sonnet
- `claude-3-opus-20240229` - Most capable, slower
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Fastest, smaller context

## Usage

### **1. Process LaTeX File**

```typescript
// In your controller or service
const result = await this.aiProviderFactory
  .getProvider('claude')
  .processPDF(latexFilePath, systemPrompt);
```

### **2. Process LaTeX Content Directly**

```typescript
const latexContent = fs.readFileSync('file.tex', 'utf-8');
const result = await this.aiProviderFactory
  .getProvider('claude')
  .processLatexContent(latexContent, systemPrompt);
```

### **3. Frontend Integration**

In the PDF processor cache page, users can now select "Claude" as the AI provider:

```typescript
// Example API call
await api.post('/admin/pdf-processor-cache/process', {
  cacheId: 'your-cache-id',
  aiProvider: 'claude',
  systemPrompt: 'Your prompt here'
});
```

## How It Works

### **Token Management**

1. **Estimation**: Approximates 1 token ≈ 4 characters
2. **Limit**: 180k tokens per chunk (buffer for 200k context)
3. **Splitting**: Splits by paragraphs/sections to maintain context

### **Chunking Process**

```
Large LaTeX File (300k tokens)
         ↓
Split into chunks
         ↓
Chunk 1 (180k) → Process → Questions 1-15
Chunk 2 (120k) → Process → Questions 16-30
         ↓
Merge results
         ↓
Final JSON with all questions
```

### **Response Parsing**

The service handles multiple response formats:
- Direct JSON
- JSON in markdown code blocks
- JSON extracted from text
- Regex-based extraction

## API Response Format

```json
{
  "questions": [
    {
      "id": "Q1",
      "stem": "Question text with $$LaTeX$$",
      "options": [
        { "id": "A", "text": "Option A", "isCorrect": false },
        { "id": "B", "text": "Option B", "isCorrect": true },
        { "id": "C", "text": "Option C", "isCorrect": false },
        { "id": "D", "text": "Option D", "isCorrect": false }
      ],
      "explanation": "Detailed explanation",
      "tip_formula": "Key formula or concept",
      "difficulty": "MEDIUM",
      "subject": "Physics",
      "lesson": "Mechanics",
      "topic": "Newton's Laws",
      "subtopic": "Force and Motion",
      "yearAppeared": 2023,
      "isPreviousYear": true,
      "tags": ["mechanics", "force"]
    }
  ],
  "metadata": {
    "totalQuestions": 30,
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "topics": ["Mechanics", "Organic Chemistry", "Calculus"],
    "difficultyDistribution": {
      "easy": 10,
      "medium": 15,
      "hard": 5
    },
    "chunksProcessed": 2
  }
}
```

## Advantages of Claude

### **1. Large Context Window**
- 200k tokens (vs OpenAI's 128k)
- Processes longer documents in fewer chunks
- Better context retention

### **2. LaTeX Understanding**
- Excellent at parsing LaTeX syntax
- Maintains mathematical notation accuracy
- Understands document structure

### **3. Instruction Following**
- Highly accurate at following complex prompts
- Consistent JSON output
- Better at generating missing content

### **4. Cost Effective**
- Competitive pricing
- Efficient token usage
- Good performance/cost ratio

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await claudeService.processLatexContent(content, prompt);
} catch (error) {
  if (error.message.includes('API key missing')) {
    // Handle missing API key
  } else if (error.message.includes('token limit')) {
    // Handle token limit exceeded
  } else {
    // Handle other errors
  }
}
```

## Rate Limiting

Claude API has rate limits:
- **Tier 1**: 50 requests/minute
- **Tier 2**: 1000 requests/minute
- **Tier 3**: 2000 requests/minute

The service includes automatic delays between chunks (1 second) to avoid rate limiting.

## Testing

### **Test Claude Integration**

```bash
# Set environment variable
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Run backend
cd backend
npm run start:dev

# Test endpoint
curl -X POST http://localhost:3001/api/admin/pdf-processor-cache/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "cacheId": "your-cache-id",
    "aiProvider": "claude"
  }'
```

## Comparison with Other Providers

| Feature | Claude | OpenAI | DeepSeek |
|---------|--------|--------|----------|
| **Context Window** | 200k | 128k | 64k |
| **LaTeX Support** | Excellent | Good | Good |
| **Cost** | $$ | $$$ | $ |
| **Speed** | Fast | Fast | Medium |
| **Accuracy** | High | High | Medium |
| **File Upload** | No (direct) | Yes | Yes |

## Best Practices

### **1. Use for LaTeX Files**
Claude excels at processing LaTeX content directly. Use it for .tex files.

### **2. Optimize Prompts**
Provide clear, structured prompts with examples for best results.

### **3. Monitor Token Usage**
Keep track of token consumption to manage costs.

### **4. Handle Chunks Properly**
For large files, ensure chunk boundaries don't split questions.

### **5. Validate Output**
Always validate the JSON output structure before saving to database.

## Troubleshooting

### **Issue: "API key missing"**
**Solution**: Add `ANTHROPIC_API_KEY` to `.env` file

### **Issue: "Token limit exceeded"**
**Solution**: File is too large even for chunking. Consider splitting manually.

### **Issue: "Could not parse JSON"**
**Solution**: Check system prompt format. Ensure it requests valid JSON output.

### **Issue: "Rate limit exceeded"**
**Solution**: Increase delay between chunks or upgrade API tier.

## Future Enhancements

### **Planned Features**

1. **Streaming Support**
   - Real-time progress updates
   - Partial results display

2. **Caching**
   - Cache processed chunks
   - Avoid reprocessing same content

3. **Parallel Processing**
   - Process multiple chunks simultaneously
   - Faster overall processing

4. **Advanced Chunking**
   - Smart question boundary detection
   - Context-aware splitting

5. **Quality Metrics**
   - Confidence scores
   - Validation checks
   - Auto-correction

## Security Considerations

1. **API Key Storage**
   - Store in environment variables
   - Never commit to version control
   - Rotate keys regularly

2. **Input Validation**
   - Validate file types
   - Check file sizes
   - Sanitize LaTeX content

3. **Output Validation**
   - Verify JSON structure
   - Check for malicious content
   - Validate question format

## Support

For issues or questions:
- Check Anthropic documentation: https://docs.anthropic.com
- Review error logs in backend console
- Contact development team

---

## Quick Start Checklist

- [ ] Install `@anthropic-ai/sdk` package
- [ ] Add `ANTHROPIC_API_KEY` to `.env`
- [ ] Add `ANTHROPIC_MODEL` to `.env` (optional)
- [ ] Restart backend server
- [ ] Test with a sample .tex file
- [ ] Verify JSON output structure
- [ ] Check question extraction accuracy

**Claude integration is now ready to use!** 🎉
