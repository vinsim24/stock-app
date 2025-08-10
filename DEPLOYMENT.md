# 🚀 Automated Deployment Guide

## Overview
This project uses **GitHub Actions** to automatically build and push Docker images to Docker Hub whenever you push changes to the main branch.

## 🔧 Setup Instructions

### 1. Configure Docker Hub Secret
In your GitHub repository, add your Docker Hub password as a secret:

1. Go to: `https://github.com/vinsim24/stock-app/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `DOCKER_PASSWORD`
4. Value: Your Docker Hub password or access token

### 2. Automated Workflow
The workflow (`.github/workflows/docker-build-push.yml`) automatically:
- ✅ Builds all 3 Docker images (backend, frontend, frontend-react)
- ✅ Pushes to Docker Hub with both `latest` and commit SHA tags
- ✅ Supports multi-platform builds (AMD64 + ARM64)
- ✅ Adds proper image labels and metadata

## 📝 Easy Deployment Commands

### Option 1: Use Deploy Scripts
```bash
# Linux/Mac
./deploy.sh "Your commit message"

# Windows
deploy.bat "Your commit message"
```

### Option 2: Manual Git Commands
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## 📊 Monitoring

After pushing, monitor the automated build at:
**https://github.com/vinsim24/stock-app/actions**

## 🏷️ Image Tags

Each successful build creates:
- `vinsim24/stock-app-backend:latest`
- `vinsim24/stock-app-backend:abc1234` (commit SHA)
- `vinsim24/stock-app-frontend:latest`
- `vinsim24/stock-app-frontend:abc1234`
- `vinsim24/stock-app-frontend-react:latest`
- `vinsim24/stock-app-frontend-react:abc1234`

## 🔄 Deployment Process

1. **Developer**: Commits and pushes code
2. **GitHub Actions**: Automatically triggered
3. **Build**: All Docker images built in parallel
4. **Push**: Images pushed to Docker Hub
5. **Deploy**: Pull latest images on production servers

## 🛠️ Troubleshooting

- **Build fails**: Check GitHub Actions logs
- **Push fails**: Verify `DOCKER_PASSWORD` secret is set correctly
- **Images not updating**: Ensure you're using `:latest` tag in docker-compose.yml

## 🎯 Benefits

- ⚡ **Instant deployment** on every commit
- 🔒 **Secure** - credentials stored as GitHub secrets
- 🌍 **Multi-platform** - supports AMD64 and ARM64
- 📦 **Versioned** - each build tagged with commit SHA
- 🔍 **Traceable** - full build logs and metadata
