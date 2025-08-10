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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📊 Features

- Real-time stock data visualization
- Technical indicators (RSI, Moving Averages)
- Interactive charts with TradingView
- Responsive design
- Redis-powered caching
- Microservices architecture

## 🛠️ Development

```bash
# Start development servers
npm run dev:backend
npm run dev:frontend
npm run dev:react

# Build Docker images
docker compose build

# Run tests
npm test
```

## 📝 License

MIT License - see LICENSE file for details.

---

🎯 **Last Updated**: August 10, 2025 - Added automated CI/CD pipeline
