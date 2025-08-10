# Stock Trading Dashboard - Docker Deployment

This project is containerized using Docker and Docker Compose for easy deployment.

## Services

- **Backend**: Node.js API server (Port 3001)
- **Frontend**: Vanilla JS application (Port 3000)
- **Frontend-React**: React application (Port 3002)
- **Nginx**: Reverse proxy (Port 80)

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Deploy the entire application

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### Access the applications

- **Main Application (Vanilla JS)**: http://localhost
- **React Application**: http://localhost/react
- **API**: http://localhost/api
- **Direct access**:
  - Vanilla JS Frontend: http://localhost:3000
  - React Frontend: http://localhost:3002
  - Backend API: http://localhost:3001

### Useful Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs frontend-react

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Scale services (if needed)
docker-compose up -d --scale frontend=2

# Remove all containers and volumes
docker-compose down -v --remove-orphans
```

### Development

For development, you can still use the individual npm commands:

```bash
# Backend
cd backend && npm run dev

# Frontend (Vanilla JS)
cd frontend && npm run dev

# Frontend (React)
cd frontend-react && npm run dev
```

### Environment Variables

Create `.env` files in respective directories if needed:

- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `frontend-react/.env` - React frontend environment variables

### Monitoring

Monitor Docker containers:

```bash
# View running containers
docker ps

# View resource usage
docker stats

# View system info
docker system df
```
