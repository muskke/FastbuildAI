# Stage 1: Builder
# This stage installs all dependencies and builds the applications.
FROM node:22.18.0-alpine AS builder

# Release deploy style
# RUN git clone https://github.com/muskke/FastbuildAI.git fastbuildai

WORKDIR /fastbuildai

# Argument for custom npm registry
ARG NPM_REGISTRY_URL

# Set build-time environment variables for Nuxt
ENV NUXT_BUILD_ENV=production
ENV NUXT_BUILD_SSR=false

# # Development deploy style
# # Copy project configuration and dependency files
# COPY package.json turbo.json ./
# COPY apps/ apps/
# COPY packages/ packages/
# COPY public/ public/
# COPY apps  node_modules  package.json  packages  pnpm-lock.yaml  pnpm-workspace.yaml  prettier.config.mjs  public  turbo.json ./

# 拷贝整个项目到容器，避免 host 卷带来的 node_modules 权限问题
COPY . .

# Set up the environment and install dependencies
RUN <<EOF
set -e
echo "🚀 Starting builder stage..."

# Set custom registry if provided
if [ -n "$NPM_REGISTRY_URL" ]; then
    echo "🔧 Using custom registry: $NPM_REGISTRY_URL"
    npm config set registry "$NPM_REGISTRY_URL"
fi

# Install pnpm
if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Configure pnpm to use the custom registry if provided
if [ -n "$NPM_REGISTRY_URL" ]; then
    pnpm config set registry "$NPM_REGISTRY_URL"
fi

# Set pnpm store directory to a local folder to avoid permission issues
pnpm config set store-dir .pnpm-store

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --store-dir .pnpm-store

# Build web application
echo "🌐 Building web application..."
pnpm --filter ./apps/web run generate

# Build server application
echo "🔧 Building server application..."
pnpm --filter ./apps/server run build

echo "✅ Build completed!"
EOF

# Clean unused files
RUN rm -rf LICENSE *.md docker docs apps/web apps/mobile
# Development deploy style
RUN rm -rf .pnpm-store .git .vscode tmp *.example .gitignore .prettierignore Dockerfile* Makefile
# Rebuild node_modules
RUN rm -rf node_modules && rm -rf apps/server/node_modules && pnpm install --store-dir .pnpm-store

# Set default environment variables
ENV TZ=Asia/Shanghai
ENV SERVER_PORT=4090
ENV QUICK_START_MODE=false
ENV NODE_ENV=production

# Expose the server port
EXPOSE ${SERVER_PORT}

# Healthcheck to ensure the server is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=10 \
  CMD ps aux | grep 'dist/main' | grep -v grep || exit 1

# The command to start the production server
CMD ["pnpm", "--filter", "./apps/server", "run", "start:prod"]