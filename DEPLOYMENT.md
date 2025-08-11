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
- ✅ Builds all 4 Docker images (backend, frontend, frontend-react, nginx)
- ✅ Pushes to Docker Hub with both `latest` and commit SHA tags
- ✅ Supports multi-platform builds (AMD64 + ARM64)
- ✅ Adds proper image labels and metadata
- ✅ Uses Node.js 20 for Vite 7+ compatibility
- ✅ Includes custom nginx image with embedded configuration

## 📝 Easy Deployment Commands

### Option 1: Use Deploy Scripts
```bash
# Linux/Mac
./deploy.sh "Your commit message"

# Windows
.\deploy.bat "Your commit message"
```

### Option 2: Manual Git Commands
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## � Docker Compose Commands

### Basic Operations
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View running containers
docker compose ps

# View logs
docker compose logs
docker compose logs -f backend  # Follow specific service logs
```

### Update & Deployment Commands
```bash
# Complete update (stop, pull latest, restart)
docker compose down && docker compose pull && docker compose up -d

# Rebuild and restart specific service
docker compose up -d --build backend

# Pull latest images only
docker compose pull

# Restart specific service
docker compose restart nginx

# Scale services (if needed)
docker compose up -d --scale backend=2
```

### Development Commands
```bash
# Build images locally
docker compose build

# Build specific service
docker compose build frontend

# Run with build (rebuild if needed)
docker compose up -d --build

# Override for development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Debugging Commands
```bash
# View detailed container info
docker compose ps -a

# Execute commands in running container
docker compose exec backend sh
docker compose exec frontend sh

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## 📊 GitHub Actions Workflow Details

### Trigger Events
- **Push to main branch**: Automatic build and deployment
- **Pull Request**: Build only (no deployment)
- **Manual trigger**: Via GitHub Actions web interface

### Build Process
1. **Checkout code** from repository
2. **Set up Docker Buildx** for multi-platform builds
3. **Login to Docker Hub** using secrets
4. **Extract metadata** (commit SHA, build date)
5. **Build images** for AMD64 and ARM64 architectures
6. **Push to Docker Hub** with multiple tags
7. **Add metadata labels** for traceability

### Build Artifacts
Each successful build creates:
```
vinsim24/stock-app-backend:latest
vinsim24/stock-app-backend:<commit-sha>
vinsim24/stock-app-frontend:latest  
vinsim24/stock-app-frontend:<commit-sha>
vinsim24/stock-app-frontend-react:latest
vinsim24/stock-app-frontend-react:<commit-sha>
```

### Monitoring Build Status
- **GitHub Actions Tab**: https://github.com/vinsim24/stock-app/actions
- **Docker Hub**: https://hub.docker.com/u/vinsim24
- **Build notifications**: GitHub will email on failures
- **Status badges**: Can be added to README

## 🔄 Complete Deployment Workflow

### Development Cycle
1. **Make changes** to your code
2. **Test locally** using development servers or Docker
3. **Commit and push** using deploy scripts
4. **Monitor build** in GitHub Actions
5. **Deploy updates** using Docker Compose commands

### Production Deployment
```bash
# On production server
git pull origin main
docker compose down && docker compose pull && docker compose up -d
```

### Rollback Process
```bash
# Rollback to specific version
docker compose down
docker tag vinsim24/stock-app-backend:abc1234 vinsim24/stock-app-backend:latest
docker compose up -d

# Or use specific tag in docker-compose.yml temporarily
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check GitHub Actions logs
# Common causes:
# - Syntax errors in Dockerfile
# - Missing dependencies
# - Test failures
# - Docker Hub authentication issues
```

#### Container Issues
```bash
# Container won't start
docker compose logs <service-name>

# Port conflicts
docker compose ps
netstat -tulpn | grep <port>

# Memory/resource issues
docker stats
docker system df
```

#### Image Issues
```bash
# Force rebuild without cache
docker compose build --no-cache

# Clean and rebuild
docker system prune -a
docker compose build

# Check image sizes
docker images
```

### Performance Optimization
```bash
# Multi-stage builds (already implemented)
# Use .dockerignore files
# Optimize layer caching
# Use Alpine base images (already used)
```

## 🎯 Benefits & Features

### Automated CI/CD
- ⚡ **Instant deployment** on every commit
- 🔒 **Secure** - credentials stored as GitHub secrets
- 🌍 **Multi-platform** - supports AMD64 and ARM64
- 📦 **Versioned** - each build tagged with commit SHA
- 🔍 **Traceable** - full build logs and metadata

### Docker Compose Advantages
- 🚀 **One-command deployment**
- 🔄 **Easy updates and rollbacks**
- 📊 **Service orchestration**
- 🔧 **Environment consistency**
- 🐳 **Portable across platforms**

### Production Ready
- 🏥 **Health checks** and restart policies
- 📈 **Scalable** service architecture
- 🔐 **Security** best practices
- 📝 **Comprehensive logging**
- 🔍 **Monitoring** and observability

### Custom Nginx Image
- 🔧 **Embedded configuration** - no external file dependencies
- 📦 **Portable deployment** - works anywhere with just docker-compose.yml
- 🌐 **Reverse proxy** - unified access to all services on port 8080
- ⚡ **Health endpoint** - /health for monitoring and load balancers
- 🛡️ **Production optimized** - Alpine-based for minimal size
