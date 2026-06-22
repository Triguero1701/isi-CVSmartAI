.PHONY: help build up down restart logs clean clean-all db-shell backend-shell frontend-shell setup-db db-populate

# Default target when just running 'make'
help:
	@echo "========================================"
	@echo "    CVSmartAI - Docker Makefile Menu    "
	@echo "========================================"
	@echo "Available commands:"
	@echo "  make up          - Start all containers in the background"
	@echo "  make build       - Build all containers and start them"
	@echo "  make down        - Stop and remove all containers"
	@echo "  make restart     - Restart all containers"
	@echo "  make logs        - View logs of all containers (tailing)"
	@echo "  make clean       - Stop containers and remove unused networks/images"
	@echo "  make clean-all   - WARNING: Stop containers, remove ALL volumes and images (Data loss!)"
	@echo ""
	@echo "Database Commands:"
	@echo "  make setup-db       - Run migrations and populate database with fake data"
	@echo "  make db-shell       - Access PostgreSQL database shell"
	@echo ""
	@echo "Container Shells:"
	@echo "  make backend-shell  - Access Backend container bash shell"
	@echo "  make frontend-shell - Access Frontend container bash shell"
	@echo "========================================"

# Start containers in detached mode
up:
	docker compose up -d
	@echo ""
	@echo "======================================================"
	@echo "    CVSmartAI has been successfully started!"
	@echo "    Access the Web UI at: http://localhost:5174"
	@echo "======================================================"
	@echo ""

# Build images and start containers
build:
	docker compose up --build -d
	@echo ""
	@echo "======================================================"
	@echo "    CVSmartAI has been successfully built & started!"
	@echo "    Access the Web UI at: http://localhost:5174"
	@echo "======================================================"
	@echo ""

# Stop and remove containers
down:
	docker compose down

# Restart containers
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# Clean up stopped containers and unused networks of this project
clean:
	docker compose down --remove-orphans

# Deep clean: WARNING! This will remove database volumes, data, and project images
clean-all:
	docker compose down -v --rmi all --remove-orphans

# Access the database (psql)
db-shell:
	docker exec -it cvsmartai_db psql -U postgres -d cvsmartai

# Access the backend shell
backend-shell:
	docker exec -it cvsmartai_backend /bin/bash

# Access the frontend shell
frontend-shell:
	docker exec -it cvsmartai_frontend /bin/sh

# Populate/Setup the database
setup-db:
	docker exec cvsmartai_backend python /scripts/setup_db.py

db-populate: setup-db
