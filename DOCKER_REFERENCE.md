# 🐳 Docker & GitHub Actions Reference

## 🚀 Quick Commands

### Essential One-Liners
```bash
# Complete update (most common)
docker compose down && docker compose pull && docker compose up -d

# Commit and auto-deploy
.\deploy.bat "Your commit message"

# View all running services
docker compose ps

# Follow all logs
docker compose logs -f
```

## 🐳 Docker Compose Commands

### Basic Operations
```bash
# Start all services in background
docker compose up -d

# Start and view logs
docker compose up

# Stop all services  
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### Building & Updates
```bash
# Build all images
docker compose build

# Build specific service
docker compose build frontend

# Build without cache
docker compose build --no-cache

# Pull latest images from registry
docker compose pull

# Update everything (stop, pull, start)
docker compose down && docker compose pull && docker compose up -d

# Rebuild and restart
docker compose up -d --build
```

### Monitoring & Debugging
```bash
# View running containers
docker compose ps

# View all containers (including stopped)
docker compose ps -a

# View logs for all services
docker compose logs

# Follow logs for specific service
docker compose logs -f backend

# View last 50 lines of logs
docker compose logs --tail=50 nginx

# Execute command in running container
docker compose exec backend sh
docker compose exec frontend /bin/bash

# Run one-off command
docker compose run backend npm test
```

### Scaling & Performance
```bash
# Scale specific service
docker compose up -d --scale backend=3

# View resource usage
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune

# Remove all unused images, containers, networks
docker system prune -a
```

### Development Overrides
```bash
# Use development compose file
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Override specific service
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## 🎯 GitHub Actions Integration

### Workflow Triggers
```yaml
# Automatic triggers
on:
  push:
    branches: [ main ]        # Deploy on main branch push
  pull_request:
    branches: [ main ]        # Build on PR (no deploy)
  
  # Manual trigger
  workflow_dispatch:
```

### Workflow Status
```bash
# Check build status
curl -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/vinsim24/stock-app/actions/runs

# Badge for README
![Build Status](https://github.com/vinsim24/stock-app/workflows/Build%20and%20Push%20Docker%20Images/badge.svg)
```

### Secrets Management
```bash
# Required secrets in GitHub repository:
# Settings → Secrets and variables → Actions

DOCKER_PASSWORD    # Docker Hub password or access token
```

### Build Artifacts
Each build creates:
- `vinsim24/stock-app-backend:latest` & `vinsim24/stock-app-backend:abc1234`
- `vinsim24/stock-app-frontend:latest` & `vinsim24/stock-app-frontend:abc1234`  
- `vinsim24/stock-app-frontend-react:latest` & `vinsim24/stock-app-frontend-react:abc1234`

## 🔧 Production Deployment

### Server Setup
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/vinsim24/stock-app.git
cd stock-app
```

### Deploy Latest
```bash
# Initial deployment
docker compose up -d

# Update deployment
git pull origin main
docker compose down && docker compose pull && docker compose up -d
```

### Health Checks
```bash
# Check application health
curl -I http://localhost:8080

# Check specific services
curl -I http://localhost:3001/api/
curl -I http://localhost:3000
curl -I http://localhost:3002
```

## 🛠️ Troubleshooting

### Common Issues
```bash
# Port already in use
docker compose down
sudo netstat -tulpn | grep :8080
sudo kill -9 <PID>

# Image build fails
docker compose build --no-cache <service>
docker system prune -a

# Container won't start
docker compose logs <service>
docker compose exec <service> sh

# Out of disk space
docker system prune -a
docker volume prune
```

### Reset Everything
```bash
# Nuclear option - remove everything
docker compose down -v
docker system prune -a
docker volume prune
docker compose up -d --build
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Optimize images
# - Use multi-stage builds ✅ (already implemented)
# - Use .dockerignore ✅ (already implemented)  
# - Use Alpine images ✅ (already implemented)
```

## 📊 Monitoring

### Service Health
```bash
# Check all services
docker compose ps

# Service-specific health
curl -f http://localhost:8080 || echo "Nginx down"
curl -f http://localhost:3001 || echo "Backend down"
curl -f http://localhost:3000 || echo "Frontend down"
curl -f http://localhost:3002 || echo "React down"
```

### Logs Analysis
```bash
# Error patterns
docker compose logs | grep -i error
docker compose logs | grep -i warning
docker compose logs | grep -i fail

# Performance monitoring
docker compose logs nginx | grep "response time"
docker compose logs backend | grep "slow query"
```

### Resource Monitoring
```bash
# Real-time stats
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Disk usage by service
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 📦 Built Images

### Application Stack
Our GitHub Actions automatically builds and pushes these images:

```bash
vinsim24/stock-app-backend:latest       # Node.js API server
vinsim24/stock-app-frontend:latest      # Vanilla JS frontend  
vinsim24/stock-app-frontend-react:latest # React frontend
vinsim24/stock-app-nginx:latest         # Custom nginx with embedded config
```

### Image Features
- **Multi-platform**: AMD64 + ARM64 support
- **Optimized**: Alpine-based for minimal size
- **Tagged**: Each build gets commit SHA tag
- **Self-contained**: No external file dependencies
- **Health checks**: Built-in monitoring endpoints

## 🔄 Automated Workflows

### Deploy Script (Windows)
```batch
@echo off
echo 🚀 Deploying latest changes...
git add .
git commit -m "%~1"
git push origin main
echo ✅ GitHub Actions will build and deploy automatically
echo 📊 Monitor: https://github.com/vinsim24/stock-app/actions
```

### Deploy Script (Linux/Mac)
```bash
#!/bin/bash
echo "🚀 Deploying latest changes..."
git add .
git commit -m "$1"
git push origin main
echo "✅ GitHub Actions will build and deploy automatically"
echo "📊 Monitor: https://github.com/vinsim24/stock-app/actions"
```

### Production Update Script
```bash
#!/bin/bash
echo "🔄 Updating production deployment..."
git pull origin main
docker compose down
docker compose pull
docker compose up -d
echo "✅ Production updated with latest images"
curl -I http://localhost:8080 && echo "🎉 Application is running!"
```

## 🎯 Best Practices

### Development
- ✅ Use development compose files for local work
- ✅ Test changes locally before committing
- ✅ Use meaningful commit messages
- ✅ Monitor GitHub Actions builds

### Production  
- ✅ Always use `docker compose down && docker compose pull && docker compose up -d`
- ✅ Monitor logs after deployments
- ✅ Keep backups of persistent data
- ✅ Use health checks and restart policies

### Security
- ✅ Store secrets in GitHub repository settings
- ✅ Use read-only mounts where possible
- ✅ Regularly update base images
- ✅ Scan images for vulnerabilities

### Performance
- ✅ Use multi-stage Docker builds
- ✅ Optimize image layers
- ✅ Monitor resource usage
- ✅ Clean up unused resources regularly
