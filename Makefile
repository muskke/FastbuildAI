# ==============================================================================
# Makefile for FastbuildAI Docker Management
# ==============================================================================

# --- Configuration ---
# Use ?= to allow overriding from the command line, e.g., make build IMAGE_NAME=my-app
IMAGE_NAME ?= fastbuildai-app
CONTAINER_NAME ?= fastbuildai-container
ENV_FILE ?= ./.env.production.local
NPM_REGISTRY_URL ?= https://registry.npmmirror.com
SERVER_PORT ?= 4090

# --- Phony Targets ---
# Declares targets that are not actual files.
.PHONY: all build run stop logs clean clean-all shell help

# --- Default Target ---
# Runs when you execute 'make' without arguments.
all: build run

# --- Core Targets ---

## build: Builds the Docker image.
# Pass a custom NPM registry: make build NPM_REGISTRY_URL=...
build:
	@echo "Building Docker image: $(IMAGE_NAME)..."
	@docker build \
		--build-arg NPM_REGISTRY_URL=$(NPM_REGISTRY_URL) \
		-t $(IMAGE_NAME) .

## run: Starts a new container from the image.
# It will fail if a container with the same name already exists. Use 'make restart' for that.
run:
	@echo "Starting Docker container: $(CONTAINER_NAME) on port $(SERVER_PORT)..."
	@docker run -d \
		-p $(SERVER_PORT):$(SERVER_PORT) \
		--env-file $(ENV_FILE) \
		--name $(CONTAINER_NAME) \
		$(IMAGE_NAME)

## stop: Stops and removes the running container.
stop:
	@echo "Stopping and removing container: $(CONTAINER_NAME)..."
	@docker stop $(CONTAINER_NAME) > /dev/null 2>&1 || echo "Container not running or already stopped."
	@docker rm $(CONTAINER_NAME) > /dev/null 2>&1 || echo "Container not found or already removed."

## logs: Tails the logs of the running container.
logs:
	@echo "Following logs for $(CONTAINER_NAME)... (Press Ctrl+C to stop)"
	@docker logs -f $(CONTAINER_NAME)

## shell: Opens an interactive shell inside the running container.
shell:
	@echo "Accessing shell in $(CONTAINER_NAME)..."
	@docker exec -it $(CONTAINER_NAME) /bin/sh


# --- Utility Targets ---

## restart: Restarts the container by stopping the old one and starting a new one.
restart: stop run

## clean: A simple alias for the 'stop' target.
clean: stop

## clean-all: Stops and removes the container, then removes the Docker image.
clean-all: stop
	@echo "Removing Docker image: $(IMAGE_NAME)..."
	@docker rmi $(IMAGE_NAME) || echo "Image not found or already removed."

## help: Displays this help message.
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all          Build the image and run the container (default)."
	@echo "  build        Build the Docker image."
	@echo "  run          Run a new Docker container."
	@echo "  stop         Stop and remove the running container."
	@echo "  restart      Stop the current container and start a new one."
	@echo "  logs         Follow the logs of the running container."
	@echo "  shell        Get an interactive shell inside the running container."
	@echo "  clean        Alias for 'stop'."
	@echo "  clean-all    Stop and remove the container and the image."
	@echo ""
	@echo "Variables (can be overridden):"
	@echo "  IMAGE_NAME      Docker image name (default: $(IMAGE_NAME))"
	@echo "  CONTAINER_NAME  Docker container name (default: $(CONTAINER_NAME))"
	@echo "  ENV_FILE        Environment file path (default: $(ENV_FILE))"
	@echo "  NPM_REGISTRY_URL NPM registry URL for build (default: $(NPM_REGISTRY_URL))"
	@echo "  SERVER_PORT     Port to expose (default: $(SERVER_PORT))"

rebuild:
	@rm -rf node_modules apps/server/node_modules apps/web/node_modules apps/mobile/node_modules
	@echo "📦 Installing dependencies..."
	@pnpm install --store-dir .pnpm-store
	@echo "🌐 Building web application..."
	@pnpm --filter ./apps/web run generate
	@echo "🔧 Building server application..."
	@pnpm --filter ./apps/server run build
	@echo "✅ Build completed!"

prod:
	@echo "🚀 Starting production server..."
	@pnpm --filter ./apps/server run start:prod