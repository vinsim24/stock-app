# 📈 Stock Trading Application

A modern, real-time stock trading application with multiple frontend implementations and a robust backend API.

## 🚀 Quick Start

Access the application at: **http://localhost:8080**

### Using Docker Compose (Recommended)
```bash
docker compose up -d
```

### Individual Services
- **Backend API**: http://localhost:3001
- **Frontend (Vanilla JS)**: http://localhost:3000  
- **Frontend (React)**: http://localhost:3002
- **Nginx Reverse Proxy**: http://localhost:8080

## 🏗️ Architecture

- **Backend**: Node.js/Express API with Redis caching
- **Frontend**: Vanilla JavaScript with TradingView charts
- **Frontend React**: Modern React application with Tailwind CSS
- **Nginx**: Reverse proxy for unified access
- **Redis**: High-performance caching layer

## 🔄 Automated Deployment

This project features **automated CI/CD** with GitHub Actions:
- Automatic Docker builds on every commit
- Multi-platform support (AMD64 + ARM64)
- Instant deployment to Docker Hub

**📚 Detailed Documentation:**
- [📋 Deployment Guide](./DEPLOYMENT.md) - Complete setup and deployment instructions
- [🐳 Docker Reference](./DOCKER_REFERENCE.md) - All Docker & Docker Compose commands
- [⚡ GitHub Actions](./GITHUB_ACTIONS.md) - CI/CD workflow documentation

## 📊 Features

- Real-time stock data visualization
- Technical indicators (RSI, Moving Averages)
- Interactive charts with TradingView
- Responsive design
- Redis-powered caching
- Microservices architecture

## 🛠️ Development

### Local Development
```bash
# Start development servers
npm run dev:backend
npm run dev:frontend  
npm run dev:react

# Or use Docker for development
docker compose -f docker-compose.dev.yml up -d
```

### Docker Commands Quick Reference
```bash
# Start all services
docker compose up -d

# Update with latest images
docker compose down && docker compose pull && docker compose up -d

# View logs
docker compose logs -f

# Restart specific service
docker compose restart <service-name>

# Build and start
docker compose up -d --build
```

### Automated Deployment
```bash
# Commit and trigger automated build
.\deploy.bat "Your commit message"

# Or manually
git add . && git commit -m "message" && git push origin main
```

## 📝 License

MIT License - see LICENSE file for details.

---

🎯 **Last Updated**: August 10, 2025 - Added automated CI/CD pipeline with smart build detection
