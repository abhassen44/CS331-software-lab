# Docker Compose Services

This project uses Docker Compose to manage external services.

## Services Included

- **PostgreSQL** (port 5432) - Main database
- **Redis** (port 6379) - Caching and task queue
- **Qdrant** (port 6333) - Vector database for RAG

## Quick Start

1. Start all services:
```bash
docker-compose up -d
```

2. Check service status:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop all services:
```bash
docker-compose down
```

5. Stop and remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

## Service URLs

- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/coding_agent`
- Redis: `redis://localhost:6379`
- Qdrant UI: http://localhost:6333/dashboard
- Qdrant API: http://localhost:6333

## Health Checks

All services have health checks configured. You can verify they're running:

```bash
# PostgreSQL
docker exec start-postgres pg_isready -U postgres

# Redis
docker exec start-redis redis-cli ping

# Qdrant
curl http://localhost:6333/health
```

## Volumes

Data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence files
- `qdrant_data` - Qdrant vector database storage
