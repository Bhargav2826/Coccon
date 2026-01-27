# 🚀 Deployment Guide for Render

## Prerequisites

- Render account
- MongoDB Atlas database
- Stream Chat account
- Cloudinary account (for file uploads)

## Environment Variables Setup

### Required Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamify?retryWrites=true&w=majority

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random

# Stream Chat
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
NODE_ENV=production
PORT=5001

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-app.onrender.com
```

### Optional Variables

```bash
# Cookie domain (if using custom domain)
COOKIE_DOMAIN=.yourdomain.com

# Disable security features (development only)
DISABLE_RATE_LIMIT=false
DISABLE_HELMET=false
```

## Deployment Steps

### 1. Connect to GitHub
- Connect your GitHub repository to Render
- Select the repository containing this backend code

### 2. Configure Service
- **Name**: `streamify-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Set Environment Variables
Add all required environment variables in the Render dashboard:
- Go to your service → Environment
- Add each variable from the list above
- Make sure to use production values

### 4. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your application
- Monitor the build logs for any errors

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Security Features

### Rate Limiting
- General routes: 100 requests per 15 minutes
- Auth routes: 5 requests per 15 minutes
- Link code routes: 3 requests per 15 minutes

### Security Headers
- Helmet.js for security headers
- CORS configured for production domains
- Content Security Policy enabled

### Error Handling
- Comprehensive error logging
- No sensitive data exposed in production
- Graceful error responses

## Monitoring

### Logs
- Access logs in Render dashboard
- Monitor for errors and performance issues
- Set up alerts for critical errors

### Performance
- Monitor response times
- Check database connection health
- Watch for memory usage

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI format
   - Verify network access from Render
   - Check MongoDB Atlas whitelist

2. **CORS Errors**
   - Verify FRONTEND_URL is correct
   - Check if frontend is deployed and accessible

3. **Stream Chat Errors**
   - Verify STREAM_API_KEY and STREAM_API_SECRET
   - Check Stream Chat dashboard for usage limits

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits (10MB max)

### Debug Mode
To enable debug logging, add:
```bash
DEBUG=true
```

## Post-Deployment

1. **Test Health Check**: Visit `https://your-app.onrender.com/api/health`
2. **Test API Endpoints**: Verify all routes work correctly
3. **Monitor Logs**: Check for any errors or warnings
4. **Update Frontend**: Ensure frontend points to correct backend URL

## Scaling

### Auto-Scaling
- Render automatically scales based on traffic
- Monitor usage in dashboard
- Consider upgrading plan if needed

### Performance Optimization
- Database indexes are already configured
- Rate limiting prevents abuse
- Static files served efficiently

## Support

For issues:
1. Check Render logs first
2. Verify environment variables
3. Test locally with production config
4. Contact support if needed
