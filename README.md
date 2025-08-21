<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="./apps/web/public/pwa-512x512.png" width="90" alt="Nest Logo" /></a>
</p>

<h1 align="center">FastbuildAI</h1>

<p align="center">
  Fast build your AI application
</p>

<p align="center">
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11.x-ea2845" alt="NestJS" /></a>
  <a href="https://typeorm.io/"><img src="https://img.shields.io/badge/Typeorm-0.3.x-ef4100" alt="NestJS" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-17.x-29527d" alt="NestJS" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript" /></a>
  <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turbo-2.x-6d5cb3" alt="Turbo" /></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-3.x-3aaf78" alt="Vue.js" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/vite-6.x-646cff" alt="Vite" /></a>
  <a href="https://ui.nuxt.com/"><img src="https://img.shields.io/badge/NuxtUI-3.x-00b95f" alt="NuxtUI" /></a>
  <a href="https://nuxt.com/"><img src="https://img.shields.io/badge/NuxtJS-3.x-00b95f" alt="NuxtJS" /></a>
</p>

<p align="center">
<a href="http://ai.fastbuildai.com/" target="_blank">Demo Online</a>｜
<a href="https://www.fastbuildai.com/">Website</a>｜
<a href="./README.zh-CN.md">中文文档</a>
</p>


## Get Started

From the project root directory, run:

```bash
# Copy the example configuration file
cp .env.production.local.example .env.production.local

# Start the application using Docker
docker compose -p fastbuildai --env-file ./.env.production.local -f ./docker/docker-compose.yml up -d
```

Wait for **2–3 minutes** until all services are up and running.

Once started, you can access the application at:

```
http://localhost:4090
```

**Default Super Admin Account**  
- **Username:** `admin`  
- **Password:** `FastbuildAI&123456`  

## Features

- ✅ **AI Chat** – Multi-model AI conversation.
- ✅ **MCP Invocation** – Supports Model Context Protocol (MCP).
- ✅ **User Recharge** – User balance and payment system.
- ✅ **Model Management** – Manage and deploy AI models.
- ✅ **Knowledge Base** – Centralized AI knowledge.
- ✅ **Intelligent Agents** – Autonomous agents for tasks.
- ⬜ **Workflow** – AI task automation.
- ⬜ **Plugin System** – Extend functionality with plugins.




## Screenshots

![image](./docs/screenshots/1.png)
![image](./docs/screenshots/2.png)
![image](./docs/screenshots/3.png)
![image](./docs/screenshots/4.png)
![image](./docs/screenshots/5.png)
![image](./docs/screenshots/6.png)
![image](./docs/screenshots/7.png)
![image](./docs/screenshots/8.png)
![image](./docs/screenshots/9.png)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=FastbuildAI/FastbuildAI&type=Date)](https://www.star-history.com/#FastbuildAI/FastbuildAI&Date)

## License

[Apache License 2.0](./LICENSE)

