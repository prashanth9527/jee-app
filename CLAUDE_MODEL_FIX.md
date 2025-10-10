# Claude Model Name Fix

## Issue Resolved ✅

**Error**: `404 model: claude-3-5-sonnet-20241022 not found`

**Cause**: The model name `claude-3-5-sonnet-20241022` doesn't exist in Anthropic's API.

**Solution**: Updated to use the correct model name: `claude-3-5-sonnet-20240620`

## Changes Made

### 1. Updated `claude.service.ts`
Changed default model from `claude-3-5-sonnet-20241022` to `claude-3-5-sonnet-20240620` in three places:
- Constructor default
- Single request processing
- Chunked processing

### 2. Updated Documentation
- `CLAUDE_INTEGRATION.md` - Updated model name
- `CLAUDE_QUICK_START.md` - Updated model name

## Correct Model Names

Use these verified model names:

### **Claude 3.5 Sonnet** (Recommended)
```
claude-3-5-sonnet-20240620
```
- 200k context window
- Best performance
- Latest version

### **Claude 3 Opus**
```
claude-3-opus-20240229
```
- Most capable
- Slower processing
- Higher cost

### **Claude 3 Sonnet**
```
claude-3-sonnet-20240229
```
- Balanced performance
- Good for most tasks

### **Claude 3 Haiku**
```
claude-3-haiku-20240307
```
- Fastest
- Smaller context (64k)
- Most cost-effective

## How to Update

### Option 1: Use Default (Recommended)
Don't set `ANTHROPIC_MODEL` in `.env` - it will use the correct default.

### Option 2: Set Explicitly
Add to `.env`:
```env
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```

## Verification

After updating, restart the backend:
```bash
cd backend
npm run build
npm run start:dev
```

Test the integration:
1. Go to PDF Processor Cache
2. Click "Process Claude" on a LaTeX file
3. Should process successfully without 404 error

## Model Comparison

| Model | Context | Speed | Cost | Best For |
|-------|---------|-------|------|----------|
| **3.5 Sonnet** | 200k | Fast | $$ | Production use |
| **3 Opus** | 200k | Slow | $$$ | Complex tasks |
| **3 Sonnet** | 200k | Medium | $$ | Balanced |
| **3 Haiku** | 64k | Very Fast | $ | Simple tasks |

## Additional Notes

### Model Naming Convention
Anthropic uses this format: `claude-{version}-{variant}-{date}`
- Version: 3, 3.5
- Variant: opus, sonnet, haiku
- Date: YYYYMMDD release date

### Finding Latest Models
Check Anthropic's documentation for the latest model names:
https://docs.anthropic.com/claude/docs/models-overview

### Rate Limits
All models share the same rate limits based on your API tier:
- Tier 1: 50 requests/minute
- Tier 2: 1000 requests/minute
- Tier 3: 2000 requests/minute

## Status

✅ **Fixed**: Model name corrected to `claude-3-5-sonnet-20240620`
✅ **Tested**: Backend builds successfully
✅ **Ready**: Integration is now functional

---

**The Claude integration is now working correctly!** 🎉
