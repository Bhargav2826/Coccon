# Faculty Messaging Setup Guide

## Quick Setup for Faculty Messaging

### Step 1: Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/streamify

# JWT Configuration (Required for authentication)
JWT_SECRET_KEY=your_super_secret_jwt_key_here

# Stream Chat Configuration (Required for faculty messaging)
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here

# Server Configuration
PORT=5001
NODE_ENV=development

# Optional: Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 2: Get Stream Chat Credentials

1. Go to [Stream Dashboard](https://dashboard.getstream.io/)
2. Create a new app or use existing one
3. Copy the API Key and API Secret
4. Replace `your_stream_api_key_here` and `your_stream_api_secret_here` in your `.env` file

### Step 3: Generate JWT Secret

Generate a secure JWT secret key:

```bash
# Option 1: Use Node.js to generate a random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use an online generator
# Go to https://generate-secret.vercel.app/64
```

Replace `your_super_secret_jwt_key_here` with the generated key.

### Step 4: Start the Server

```bash
cd backend
npm run dev
```

### Step 5: Verify Setup

Run the environment check:

```bash
cd backend
node check-environment.js
```

You should see all required variables marked as ✅ Set.

### Step 6: Test Faculty Messaging

1. Start the frontend: `cd frontend && npm run dev`
2. Create a faculty account with role "faculty"
3. Create a room
4. Add students to the room
5. Try sending messages

## Troubleshooting

### If you get 403 Forbidden errors:

1. **Check environment variables**: Run `node check-environment.js`
2. **Verify user role**: Ensure the faculty user has `role: "faculty"` in the database
3. **Check server logs**: Look for authentication debug messages
4. **Restart server**: After making changes to `.env` file

### If you get Stream Chat errors:

1. **Verify Stream credentials**: Check if API key and secret are correct
2. **Check Stream app settings**: Ensure the app is active in Stream dashboard
3. **Test Stream connection**: Look for Stream initialization messages in server logs

### If file uploads fail:

1. **Check Cloudinary setup**: Ensure Cloudinary credentials are set (optional)
2. **Verify file size**: Check if files are within size limits
3. **Check file types**: Ensure files are of supported types

## Common Issues

### Issue: "403 Forbidden - Insufficient permissions"
**Solution**: Check if the user has `role: "faculty"` in the database

### Issue: "Stream API key or Secret is missing"
**Solution**: Set `STREAM_API_KEY` and `STREAM_API_SECRET` in `.env` file

### Issue: "JWT_SECRET_KEY is missing"
**Solution**: Set `JWT_SECRET_KEY` in `.env` file

### Issue: "MongoDB connection failed"
**Solution**: Ensure MongoDB is running and `MONGODB_URI` is correct

## Testing Checklist

- [ ] Environment variables are set
- [ ] Server starts without errors
- [ ] Faculty can login
- [ ] Faculty can create rooms
- [ ] Faculty can add students to rooms
- [ ] Faculty can send text messages
- [ ] Faculty can send files
- [ ] Faculty can send video call links
- [ ] Students can receive messages
- [ ] Students can mark messages as read

## Support

If you continue to have issues:

1. Check the server console for error messages
2. Run `node check-environment.js` to verify setup
3. Check `FACULTY_MESSAGING_TROUBLESHOOTING.md` for detailed solutions
4. Ensure all required services (MongoDB, Stream Chat) are running
