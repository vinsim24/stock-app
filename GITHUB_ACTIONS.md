# ⚡ GitHub Actions CI/CD Documentation

## 🏗️ Workflow Overview

Our automated CI/CD pipeline includes multiple workflows for different purposes:

1. **Build & Deploy** (`docker-build-push.yml`) - Builds and deploys Docker images 
2. **Documentation** (`docs-update.yml`) - Validates documentation-only changes
3. **Cleanup** (`cleanup-docker-images.yml`) - Manages Docker Hub storage automatically

### Workflow File Locations
- `.github/workflows/docker-build-push.yml`
- `.github/workflows/docs-update.yml` 
- `.github/workflows/cleanup-docker-images.yml`

## 🚀 Workflow Details

### Trigger Events
```yaml
on:
  push:
    branches: [ main ]          # Automatic build on main branch
    paths-ignore:               # Skip builds for documentation changes
      - '**.md'
      - 'docs/**'
      - '.gitignore'
      - 'LICENSE'
      - 'deploy.sh'
      - 'deploy.bat'
  pull_request:
    branches: [ main ]          # Build-only on PR (no deployment)
    paths-ignore:               # Skip builds for documentation changes
      - '**.md'
      - 'docs/**'
      - '.gitignore'
      - 'LICENSE'
      - 'deploy.sh'
      - 'deploy.bat'
```

### Smart Build Detection
The workflow intelligently detects the type of changes:

- **📝 Documentation Only**: Runs documentation validation workflow, skips Docker builds
- **🏗️ Code Changes**: Runs full Docker build and push workflow
- **🔀 Mixed Changes**: Runs full Docker build workflow

**Files that trigger builds:**
- Any file in `backend/`, `frontend/`, `frontend-react/`
- `docker-compose.yml`, `nginx.conf`
- `package.json`, `Dockerfile` files
- Any non-documentation files

**Files that skip builds:**
- `*.md` files (README.md, DEPLOYMENT.md, etc.)
- `docs/` directory contents
- Deploy scripts (`deploy.sh`, `deploy.bat`)
- `.gitignore`, `LICENSE`

### Build Matrix
- **Platforms**: linux/amd64, linux/arm64
- **Services**: backend, frontend, frontend-react
- **Base Image**: node:20-alpine (for Vite 7+ compatibility)

### Workflow Steps

#### 1. Environment Setup
```yaml
- name: Checkout code
  uses: actions/checkout@v4

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

#### 2. Authentication
```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: vinsim24
    password: ${{ secrets.DOCKER_PASSWORD }}
```

#### 3. Metadata Generation
```yaml
- name: Extract metadata
  run: |
    echo "SHORT_SHA=${GITHUB_SHA::7}" >> $GITHUB_OUTPUT
    echo "DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_OUTPUT
```

#### 4. Multi-Platform Build & Push
```yaml
- name: Build and push <service>
  uses: docker/build-push-action@v5
  with:
    context: ./<service>
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      vinsim24/stock-app-<service>:latest
      vinsim24/stock-app-<service>:${{ steps.meta.outputs.SHORT_SHA }}
```

## 🔧 Setup Requirements

### 1. Repository Secrets
Navigate to: `https://github.com/vinsim24/stock-app/settings/secrets/actions`

**Required Secret:**
- **Name**: `DOCKER_PASSWORD`
- **Value**: Your Docker Hub password or access token

### 2. Docker Hub Account
- Username: `vinsim24`
- Repositories: `stock-app-backend`, `stock-app-frontend`, `stock-app-frontend-react`

## 📊 Build Artifacts

### Image Naming Convention
```
vinsim24/stock-app-backend:latest
vinsim24/stock-app-backend:abc1234    # commit SHA

vinsim24/stock-app-frontend:latest
vinsim24/stock-app-frontend:abc1234

vinsim24/stock-app-frontend-react:latest
vinsim24/stock-app-frontend-react:abc1234
```

### Image Labels
Each image includes metadata:
```yaml
labels: |
  org.opencontainers.image.source=https://github.com/vinsim24/stock-app
  org.opencontainers.image.created=2025-08-10T22:30:15Z
  org.opencontainers.image.revision=abc1234567890abcdef
```

## 🔄 Deployment Workflow

### Development Process
1. **Code Changes** → Local development and testing
2. **Commit & Push** → Use deploy scripts or manual git commands
3. **GitHub Actions** → Automatic build triggered
4. **Build Process** → Multi-platform Docker images created
5. **Push to Registry** → Images uploaded to Docker Hub
6. **Production Deploy** → Pull latest images and restart services

### Deployment Commands
```bash
# Trigger build
.\deploy.bat "Add new feature"

# Monitor build
# Visit: https://github.com/vinsim24/stock-app/actions

# Deploy to production
docker compose down && docker compose pull && docker compose up -d
```

## 📈 Build Performance

### Optimization Features
- ✅ **Multi-stage builds** reduce final image size
- ✅ **Layer caching** speeds up subsequent builds
- ✅ **Parallel building** of all services
- ✅ **Multi-platform** support (AMD64 + ARM64)

### Typical Build Times
- **Backend**: ~2-3 minutes
- **Frontend**: ~3-4 minutes  
- **Frontend React**: ~3-4 minutes
- **Total**: ~5-7 minutes (parallel execution)

## 🛠️ Troubleshooting

### Common Build Issues

#### Authentication Failures
```bash
# Symptoms: Login failed to Docker Hub
# Solution: Check DOCKER_PASSWORD secret
```

#### Build Failures
```bash
# Symptoms: Docker build step fails
# Check:
# - Dockerfile syntax
# - Missing dependencies in package.json
# - Node.js version compatibility
```

#### Platform-Specific Issues
```bash
# Symptoms: ARM64 build fails, AMD64 succeeds
# Common causes:
# - Dependencies not available for ARM64
# - Native modules requiring compilation
```

### Debugging Steps

#### 1. Check GitHub Actions Logs
- Go to: https://github.com/vinsim24/stock-app/actions
- Click on failed build
- Expand failing step
- Look for error messages

#### 2. Test Locally
```bash
# Build locally to reproduce
docker buildx build --platform linux/amd64,linux/arm64 ./backend

# Test specific platform
docker buildx build --platform linux/arm64 ./frontend
```

#### 3. Validate Secrets
```bash
# Ensure secret is properly set
# GitHub → Settings → Secrets and variables → Actions
# DOCKER_PASSWORD should be visible (but not readable)
```

## 🔍 Monitoring & Alerts

### Build Status Monitoring
```bash
# GitHub provides several ways to monitor:
# 1. Email notifications on build failures
# 2. GitHub mobile app notifications
# 3. Status badges for README
# 4. Webhooks for external systems
```

### Status Badge
Add to README.md:
```markdown
![Build Status](https://github.com/vinsim24/stock-app/workflows/Build%20and%20Push%20Docker%20Images/badge.svg)
```

### Webhook Integration
```yaml
# Add to workflow for external notifications
- name: Notify deployment
  if: success()
  run: |
    curl -X POST "${{ secrets.WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d '{"status": "success", "commit": "${{ github.sha }}"}'
```

## 🔐 Security Best Practices

### Secrets Management
- ✅ Store sensitive data in GitHub Secrets
- ✅ Use principle of least privilege
- ✅ Rotate access tokens regularly
- ✅ Never commit secrets to repository

### Image Security
```yaml
# Scan for vulnerabilities (optional addition)
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: vinsim24/stock-app-backend:latest
    format: sarif
    output: trivy-results.sarif
```

### Access Control
- ✅ Limit who can push to main branch
- ✅ Require PR reviews for sensitive changes
- ✅ Use branch protection rules
- ✅ Enable 2FA for GitHub account

## ⚡ Advanced Configuration

### Custom Build Arguments
```yaml
- name: Build with custom args
  uses: docker/build-push-action@v5
  with:
    build-args: |
      NODE_ENV=production
      BUILD_VERSION=${{ steps.meta.outputs.SHORT_SHA }}
```

### Conditional Deployment
```yaml
- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: |
    # Deploy to staging environment
    
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: |
    # Deploy to production environment
```

### Matrix Builds
```yaml
strategy:
  matrix:
    service: [backend, frontend, frontend-react]
    platform: [linux/amd64, linux/arm64]
```

## 🧹 Docker Hub Cleanup Workflow

### Automated Image Management
The cleanup workflow (`cleanup-docker-images.yml`) automatically manages Docker Hub storage:

**Schedule**: Every Sunday at 2 AM UTC
**Trigger**: Can also be run manually via GitHub Actions UI

### Configuration
```yaml
env:
  DOCKER_USERNAME: vinsim24
  KEEP_IMAGES: 5  # Number of recent images to keep per repository
```

### Cleanup Process
1. **Login** to Docker Hub using stored credentials
2. **Fetch** all image tags for each repository
3. **Sort** by creation date (newest first)  
4. **Preserve** the `latest` tag and most recent 5 versions
5. **Delete** older tagged images to free up storage
6. **Report** cleanup results

### Repositories Managed
- `vinsim24/stock-app-backend`
- `vinsim24/stock-app-frontend`  
- `vinsim24/stock-app-frontend-react`
- `vinsim24/stock-app-nginx`

### Benefits
- ✅ **Cost Control**: Reduces Docker Hub storage costs
- ✅ **Automated**: No manual intervention required  
- ✅ **Safe**: Always preserves latest and recent versions
- ✅ **Configurable**: Easy to adjust retention policy
- ✅ **Transparent**: Full logging of cleanup actions

## 📋 Workflow Maintenance

### Regular Updates
- ✅ Update action versions monthly
- ✅ Update base images (node:20-alpine)
- ✅ Review and rotate secrets
- ✅ Monitor build performance

### Optimization Opportunities
```yaml
# Use build cache
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Environment-Specific Workflows
```yaml
# Production workflow
name: Production Deploy
on:
  release:
    types: [published]

# Staging workflow  
name: Staging Deploy
on:
  push:
    branches: [ develop ]
```

## 🎯 Success Metrics

### Key Performance Indicators
- **Build Success Rate**: Target >95%
- **Build Time**: Target <10 minutes
- **Deployment Frequency**: Daily releases
- **Mean Time to Recovery**: <30 minutes

### Monitoring Dashboards
- GitHub Insights for build metrics
- Docker Hub analytics for image pulls
- Production monitoring for application health
- Log aggregation for error tracking

## 🚀 Future Enhancements

### Planned Improvements
- [ ] Add automated testing before build
- [ ] Implement blue-green deployments
- [ ] Add security scanning
- [ ] Create staging environment
- [ ] Add performance benchmarking
- [ ] Implement rollback automation
