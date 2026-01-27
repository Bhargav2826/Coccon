# Development Setup Guide

## Rate Limiting Options

### Option 1: Higher Limits (Recommended)
The rate limits are automatically increased in development mode:
- **General API**: 1000 requests per 15 minutes (vs 100 in production)
- **Authentication**: 100 requests per 15 minutes (vs 5 in production)
- **Link Codes**: 50 requests per 15 minutes (vs 3 in production)

### Option 2: Completely Disable Rate Limiting
Add to your `.env` file:
```bash
NODE_ENV=development
DISABLE_RATE_LIMIT=true
```

### Option 3: Disable All Security Headers
Add to your `.env` file:
```bash
NODE_ENV=development
DISABLE_RATE_LIMIT=true
DISABLE_HELMET=true
```

## Environment Variables for Development

Create or update your `.env` file in the backend directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/cocoon

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-for-development

# Stream Chat (optional for testing)
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret

# OpenAI (optional for AI features)
OPENAI_API_KEY=your-openai-api-key

# Environment
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Development Options (optional)
DISABLE_RATE_LIMIT=true
DISABLE_HELMET=true
```

## Quick Commands

### Start Backend with No Rate Limiting:
```bash
cd backend
echo "DISABLE_RATE_LIMIT=true" >> .env
npm run dev
```

### Reset Rate Limits (if you hit them):
```bash
# Restart the server
npm run dev

# Or clear the rate limit cache by restarting
```

### Check Current Settings:
```bash
# View your .env file
cat .env

# Check if rate limiting is disabled
grep DISABLE_RATE_LIMIT .env
```

## Testing Without Rate Limits

With `DISABLE_RATE_LIMIT=true`, you can:
- Make unlimited API calls
- Test authentication flows repeatedly
- Test link code generation without limits
- Develop without hitting 429 errors

## Production Settings

For production, remove or set:
```bash
NODE_ENV=production
# Remove DISABLE_RATE_LIMIT and DISABLE_HELMET
```

This will enable strict security settings:
- Rate limiting: 5 auth requests per 15 minutes
- Rate limiting: 3 link code requests per 15 minutes
- All security headers enabled
