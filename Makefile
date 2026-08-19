COMPOSE := docker compose
COMPOSE_DEV := docker compose -f compose.yaml -f compose.dev.yaml

.PHONY: services services-stop services-logs up down logs uninstall

services:
	$(COMPOSE_DEV) up -d db storage storage-init

services-stop:
	$(COMPOSE_DEV) stop db storage

services-logs:
	$(COMPOSE_DEV) logs -f db storage

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

uninstall:
	$(COMPOSE) down -v --rmi all
