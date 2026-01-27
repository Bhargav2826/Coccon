# ✅ Deployment Checklist for Render

## Pre-Deployment

- [ ] **Environment Variables Set**
  - [ ] `MONGODB_URI` (MongoDB Atlas connection string)
  - [ ] `JWT_SECRET_KEY` (Long, random string)
  - [ ] `STREAM_API_KEY` (Stream Chat API key)
  - [ ] `STREAM_API_SECRET` (Stream Chat API secret)
  - [ ] `CLOUDINARY_CLOUD_NAME` (Cloudinary cloud name)
  - [ ] `CLOUDINARY_API_KEY` (Cloudinary API key)
  - [ ] `CLOUDINARY_API_SECRET` (Cloudinary API secret)
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` (Your frontend URL)

- [ ] **Database Ready**
  - [ ] MongoDB Atlas cluster created
  - [ ] Database user with read/write permissions
  - [ ] Network access configured (0.0.0.0/0 for Render)
  - [ ] Connection string tested locally

- [ ] **External Services**
  - [ ] Stream Chat app created and configured
  - [ ] Cloudinary account set up
  - [ ] All API keys and secrets copied

## Deployment

- [ ] **Render Configuration**
  - [ ] Repository connected to Render
  - [ ] Service type: Web Service
  - [ ] Environment: Node
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] All environment variables added

- [ ] **Deploy**
  - [ ] Initial deployment successful
  - [ ] Health check passes: `/api/health`
  - [ ] No errors in build logs
  - [ ] Application accessible via URL

## Post-Deployment

- [ ] **Testing**
  - [ ] Health check endpoint works
  - [ ] Authentication endpoints work
  - [ ] Faculty messaging works
  - [ ] File uploads work
  - [ ] Stream Chat integration works

- [ ] **Frontend Integration**
  - [ ] Frontend updated with new backend URL
  - [ ] CORS configured correctly
  - [ ] All API calls working

- [ ] **Monitoring**
  - [ ] Logs accessible in Render dashboard
  - [ ] No critical errors in logs
  - [ ] Performance monitoring set up

## Security Verification

- [ ] **Security Headers**
  - [ ] Helmet.js active
  - [ ] CORS properly configured
  - [ ] Rate limiting working

- [ ] **Data Protection**
  - [ ] JWT tokens secure
  - [ ] Passwords hashed
  - [ ] No sensitive data in logs

## Performance

- [ ] **Database**
  - [ ] Connection pooling configured
  - [ ] Indexes created
  - [ ] Query performance acceptable

- [ ] **API**
  - [ ] Response times under 2 seconds
  - [ ] Rate limiting preventing abuse
  - [ ] File upload limits enforced

## Final Steps

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] Deployment guide completed
  - [ ] Troubleshooting guide ready

- [ ] **Backup**
  - [ ] Database backup strategy in place
  - [ ] Environment variables backed up
  - [ ] Code repository up to date

## Quick Commands

```bash
# Test health check
curl https://your-app.onrender.com/api/health

# Test authentication
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check logs in Render dashboard
# Go to your service → Logs
```

## Emergency Contacts

- **Render Support**: https://render.com/docs/help
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/support/
- **Stream Chat**: https://getstream.io/contact/
- **Cloudinary**: https://support.cloudinary.com/
