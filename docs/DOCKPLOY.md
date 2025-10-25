# Dockploy Deployment Guide

## Overview

This guide explains how to deploy the Event Photo Sharing App to **Dockploy**, a deployment platform that makes it easy to deploy Docker-based applications.

## ✅ What Makes This Repo Dockploy-Ready

Your project structure is **perfectly set up** for Dockploy deployment:

- ✅ **docker-compose.yml** for local development
- ✅ **docker-compose.prod.yml** for production
- ✅ **Dockerfiles** in the `docker/` folder
- ✅ **Environment variable templates** (.env.example)
- ✅ **Proper .gitignore** (no secrets committed)

## 📋 Pre-Deployment Checklist

### 1. Azure Resources (Required)

Create these Azure resources and save the credentials:

- **Azure Database for PostgreSQL** (Flexible Server)
- **Azure Blob Storage Account** + Container
- **Azure Face API** (Cognitive Services)

### 2. Firebase Setup (Required)

- Create Firebase project
- Enable Google Authentication
- Download **service account JSON file** (don't commit!)
- Get Firebase config for frontend

### 3. Repository Setup

```bash
# Make sure all changes are committed
git add .
git commit -m "Complete project structure"
git push origin main
```

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Push your code
git push origin main
```

### Step 2: Connect Dockploy to Your Repository

1. Log into your Dockploy account
2. Click **"Create New Project"**
3. Select **"Import from GitHub"**
4. Choose your repository: `your-org/-234_Team`
5. Select branch: `main`

### Step 3: Configure Build Settings

In Dockploy project settings:

**Docker Compose File:**
```
docker-compose.prod.yml
```

**Root Directory:**
```
/
```

**Port Mapping:**
- Backend: `8000`
- Frontend: `80` (if using nginx) or `5173`

### Step 4: Set Environment Variables

In Dockploy, go to **Environment Variables** and add:

#### Backend Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@your-azure-db.postgres.database.azure.com:5432/event_photos

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...
AZURE_STORAGE_CONTAINER_NAME=event-media

# Azure Face API
AZURE_FACE_API_KEY=your_key_here
AZURE_FACE_API_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# Security
SECRET_KEY=generate_with_openssl_rand_hex_32

# Environment
ENVIRONMENT=production

# CORS (use your Dockploy domain)
CORS_ORIGINS=["https://your-app.dockploy.app","https://www.your-domain.com"]
```

#### Frontend Variables

```bash
VITE_API_BASE_URL=https://your-backend.dockploy.app
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 5: Upload Firebase Service Account

**Important**: The Firebase service account JSON file **cannot** be in your repo (it's .gitignored).

**Option 1: Dockploy Secrets (Recommended)**
1. Go to Dockploy **Secrets** section
2. Upload `firebase-service-account.json`
3. Mount it in the backend container

**Option 2: Azure Key Vault**
- Store the JSON in Azure Key Vault
- Load it at runtime using Azure SDK

**Option 3: Environment Variable**
```bash
# Convert JSON to base64 and set as env var
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...

# In backend startup, decode and write to file
```

### Step 6: Deploy!

1. Click **"Deploy"** in Dockploy
2. Watch the build logs
3. Wait for deployment to complete (usually 3-5 minutes)

### Step 7: Run Database Migrations

After first deployment:

```bash
# SSH into backend container (via Dockploy console)
alembic upgrade head

# Or run as a one-time job in Dockploy
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Firebase Authorized Domains

In Firebase Console → Authentication → Settings:

Add your Dockploy domains:
```
your-frontend.dockploy.app
www.your-custom-domain.com
```

### 2. Update Azure CORS

In Azure Blob Storage → CORS settings:

Add allowed origins:
```
https://your-frontend.dockploy.app
https://www.your-custom-domain.com
```

### 3. Test the Application

- ✅ Visit your frontend URL
- ✅ Sign in with Google
- ✅ Create a test event
- ✅ Upload a test photo
- ✅ Check Azure Blob Storage (file uploaded)
- ✅ Check backend logs (face detection triggered)

---

## 📁 Dockploy-Specific Files

### docker-compose.prod.yml

This is what Dockploy uses. Key differences from dev:

```yaml
# No volume mounts (code is baked into image)
# Workers instead of reload (backend runs with 4 workers)
# Production environment variables
# Health checks and restart policies
```

### Dockerfile Optimization

For faster Dockploy builds, your Dockerfiles are optimized with:

- ✅ Multi-stage builds (if needed)
- ✅ Layer caching (dependencies installed first)
- ✅ Minimal base images (alpine/slim)

---

## 🐛 Troubleshooting

### Build Fails: "Cannot find firebase-service-account.json"

**Solution**: Use one of the three options in Step 5 above.

### Backend starts but crashes: "Connection refused" to database

**Solution**: 
- Check `DATABASE_URL` environment variable
- Ensure Azure PostgreSQL allows connections from Dockploy IPs
- Check Azure Firewall rules

### CORS errors in browser

**Solution**:
```bash
# Update CORS_ORIGINS in backend env vars
CORS_ORIGINS=["https://your-frontend-url.dockploy.app"]
```

### Face detection not working

**Solution**:
- Check `AZURE_FACE_API_KEY` and `AZURE_FACE_API_ENDPOINT`
- Verify Azure Face API quota hasn't been exceeded
- Check backend logs for Azure API errors

### Photos not uploading

**Solution**:
- Verify `AZURE_STORAGE_CONNECTION_STRING`
- Check Azure Storage account is accessible
- Ensure container `event-media` exists

---

## 🔄 Updating Your Deployment

### Simple Updates (Code Changes)

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Dockploy will auto-deploy if you enabled auto-deployment.

### Manual Deployment

In Dockploy dashboard:
1. Click **"Redeploy"**
2. Wait for build to complete

### Rolling Back

In Dockploy:
1. Go to **Deployments** history
2. Click **"Rollback"** on previous version

---

## 📊 Monitoring & Logs

### View Logs

In Dockploy:
1. Go to your project
2. Click **"Logs"**
3. Select service (backend/frontend)
4. View real-time logs

### Useful Log Commands

```bash
# View last 100 lines
docker logs backend-container --tail 100

# Follow logs in real-time
docker logs backend-container -f

# Search for errors
docker logs backend-container 2>&1 | grep ERROR
```

---

## 💰 Cost Optimization

### Azure Resources

- **Database**: Start with **Basic** tier (~$25/month)
- **Blob Storage**: Pay-as-you-go (very cheap)
- **Face API**: Free tier = 30,000 calls/month

### Dockploy

- Check their pricing for your deployment size
- Consider scaling down in non-peak hours

---

## 🔐 Security Best Practices

### 1. Never Commit Secrets
```bash
# Already done: .gitignore includes
.env
firebase-service-account.json
```

### 2. Use Environment Variables
All secrets are in environment variables (✅ Done)

### 3. Enable HTTPS
Dockploy provides free SSL certificates (✅ Automatic)

### 4. Restrict Database Access
Azure PostgreSQL firewall rules:
- Allow: Dockploy IPs only
- Block: Public access

### 5. Rotate Keys Regularly
- Azure Storage keys
- Azure Face API keys
- Firebase service account

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables set in Dockploy
- [ ] Firebase authorized domains updated
- [ ] Azure CORS configured
- [ ] Database migrations run successfully
- [ ] Test user signup/login
- [ ] Test event creation
- [ ] Test photo upload
- [ ] Test face detection
- [ ] SSL certificate active (https)
- [ ] Monitoring/logging setup
- [ ] Backup strategy for database

---

## 🚀 Scaling Considerations

As your app grows:

### Database
- Upgrade Azure PostgreSQL tier
- Add read replicas for queries
- Enable connection pooling

### Backend
- Increase worker count in docker-compose.prod.yml
- Use Celery for heavy background jobs
- Consider separate service for face processing

### Storage
- Enable Azure CDN for faster image loading
- Generate multiple thumbnail sizes
- Implement image optimization pipeline

### Frontend
- Enable Vite build optimizations
- Add service worker for offline support
- Implement lazy loading for images

---

## 📚 Additional Resources

- [Dockploy Documentation](https://dockploy.com/docs)
- [Azure PostgreSQL Docs](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Azure Face API Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-identity)
- [Docker Compose Production Best Practices](https://docs.docker.com/compose/production/)

---

## ✅ Summary

Your repository is **100% ready for Dockploy**! Just:

1. ✅ Push to GitHub
2. ✅ Connect to Dockploy
3. ✅ Set environment variables
4. ✅ Handle Firebase service account
5. ✅ Deploy!

**Estimated deployment time**: 5-10 minutes (first time)

Good luck with your deployment! 🚀

