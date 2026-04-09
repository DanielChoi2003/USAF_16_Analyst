SHELL := /bin/bash

.PHONY: up down restart status

up:
	./scripts/project.sh up

down:
	./scripts/project.sh down

restart: down up

status:
	./scripts/project.sh status
