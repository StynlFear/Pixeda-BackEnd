# Pixeda Backend

Node.js/Express backend for the Pixeda application.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration values

4. Start development server:
```bash
npm run dev
```

## Deployment on Koyeb

### Prerequisites
- MongoDB Atlas account (or other cloud MongoDB)
- Koyeb account
- GitHub repository

### Steps

1. **Database Setup**: 
   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Whitelist Koyeb's IP addresses (or use 0.0.0.0/0 for all IPs)

2. **Environment Variables in Koyeb**:
   Set these in your Koyeb app settings:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pixeda
   JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-minimum-32-characters
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   NODE_ENV=production
   ```

3. **Deploy**:
   - Connect your GitHub repository to Koyeb
   - Set build command: `npm ci`
   - Set run command: `npm start`
   - Deploy!

### File Uploads Note
Koyeb has ephemeral storage, so uploaded files will be lost on restart. Consider using:
- AWS S3
- Cloudinary
- Other cloud storage services

For production, update the upload middleware to use cloud storage instead of local filesystem.

## API Documentation
Once deployed, visit `/api/docs` for Swagger documentation.

## Health Check
The app includes a health check endpoint at `/health` for monitoring.
