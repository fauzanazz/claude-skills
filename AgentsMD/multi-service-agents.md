# Multi-Service AGENTS.md Template

Use this template for **monorepos or multi-repo setups** where multiple services (frontend, backend, AI, infrastructure) are orchestrated together.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this multi-service project.

## Services

| Service | Directory | Stack | Port | Description |
|---------|-----------|-------|------|-------------|
| {Frontend} | `{frontend_dir}/` | {Next.js/React} | {3000} | {Web application} |
| {Backend API} | `{backend_dir}/` | {Hono/Express} | {3001} | {REST API} |
| {AI Service} | `{ai_dir}/` | {FastAPI/Python} | {8001} | {AI/ML service} |
| {Worker} | `{worker_dir}/` | {Celery/Redis} | — | {Background jobs} |

## Quick Start

\```bash
# Start all services (requires tmux)
./dev.sh

# Or start individually:
{start_frontend_cmd}
{start_backend_cmd}
{start_ai_cmd}
{start_worker_cmd}
\```

## Routing

{Production routing rules — how requests reach each service.}

| Path Pattern | Routes To | Service |
|-------------|-----------|---------|
| `/api/core/*` | Backend API | {backend_dir} |
| `/api/ai/*` | AI Service | {ai_dir} |
| `/*` | Frontend | {frontend_dir} |

## Cross-Service Communication

\```
Frontend (browser)
    ↓ HTTP
Backend API ──→ AI Service (HTTP/gRPC)
    ↓               ↓
    └──→ Database ←──┘
         (shared or per-service)
\```

**Rules:**
- Services communicate via **HTTP APIs** with typed contracts — never direct DB access across services
- API contracts defined in `{contracts_dir}/` (OpenAPI spec) or generated from backend
- Frontend generates typed API client from the OpenAPI spec

## Per-Service Instructions

Each service has its own `AGENTS.md` with detailed conventions:

| Service | AGENTS.md Location |
|---------|--------------------|
| {Frontend} | `{frontend_dir}/AGENTS.md` |
| {Backend} | `{backend_dir}/AGENTS.md` |
| {AI Service} | `{ai_dir}/AGENTS.md` |

**Always read the per-service AGENTS.md before working on that service.**

## Repository Structure

{Choose the structure that matches the project:}

### Option A: Multi-Repo (Separate Git Repos)

\```
project-root/
├── {frontend_dir}/          # Independent git repo
├── {backend_dir}/           # Independent git repo
├── {ai_dir}/                # Independent git repo
├── {infra_dir}/             # Terraform / IaC
├── DOCS/                    # Shared documentation
├── dev.sh                   # Dev orchestration script
└── AGENTS.md                # This file (root-level)
\```

No root `package.json` or workspace config. Each service is fully independent.

### Option B: Monorepo (Single Git Repo)

\```
project-root/
├── {frontend_dir}/          # Frontend app
├── {backend_dir}/           # Backend service
├── contracts/               # Shared API contracts (OpenAPI)
├── docker-compose.yml       # Service orchestration
├── Makefile                 # Common commands
└── AGENTS.md                # This file
\```

## Development Workflow

### Working on a Single Service

1. Navigate to the service directory
2. Read its `AGENTS.md`
3. Make changes following that service's conventions
4. Run its lint + test commands before committing
5. Commit changes scoped to that service only

### Cross-Service Changes

When a change spans multiple services (e.g., new API endpoint + frontend integration):

1. **Start with the contract** — update the OpenAPI spec or backend endpoint first
2. **Implement backend** — add the endpoint, run backend tests
3. **Generate types** — regenerate the frontend API client from the spec
4. **Implement frontend** — consume the new endpoint, run frontend tests
5. **Test end-to-end** — run all services and verify the full flow

{If using git worktrees:}
### Git Worktree Workflow

For cross-repo feature branches:

\```bash
# Create worktrees for all services under a feature branch
mkdir -p _wt/{feature}/
git -C {frontend_dir} worktree add ../../_wt/{feature}/{frontend_dir} -b feature/{feature}
git -C {backend_dir} worktree add ../../_wt/{feature}/{backend_dir} -b feature/{feature}
git -C {ai_dir} worktree add ../../_wt/{feature}/{ai_dir} -b feature/{feature}
\```

## Docker Compose

\```bash
docker compose up              # Start all services
docker compose up {service}    # Start a specific service
docker compose --profile local up   # Local profile (all local DBs)
docker compose logs -f {service}    # Tail logs for a service
\```

{List available profiles:}

| Profile | Services | Use Case |
|---------|----------|----------|
| `local` | All services + local DBs | Full local development |
| `{profile}` | {subset} | {description} |

## Environment Variables

Each service has its own `.env` file:

| Service | Env File | Example |
|---------|----------|---------|
| {Frontend} | `{frontend_dir}/.env.local` | `{frontend_dir}/.env.example` |
| {Backend} | `{backend_dir}/.env` | `{backend_dir}/.env.example` |
| {AI Service} | `{ai_dir}/.env` | `{ai_dir}/.env.example` |

**Never commit `.env` files.** Copy from `.env.example` and fill in secrets.

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Direct DB access across services | Use HTTP APIs with typed contracts |
| Modify multiple services in one commit | Scope commits to a single service |
| Bypass the API contract | Update OpenAPI spec first, then implement |
| Hardcode service URLs | Use environment variables for all service URLs |
| Run the full stack for a single-service change | Start only the service you're working on |
| Share code by copy-pasting between services | Extract to a shared package or use API contracts |
| Deploy services in dependency order manually | Use CI/CD with health checks and rolling deploys |

## Monitoring & Debugging

\```bash
{monitoring_commands}
\```

| Tool | Purpose |
|------|---------|
| {monitoring_tool} | {description} |
```

---

## Customization Notes

When populating this template, inspect the project for:

| Field | Where to Find |
|-------|---------------|
| Service directories | `ls` the project root, identify dirs with `package.json` or `pyproject.toml` |
| Dev orchestration | Check for `dev.sh`, `Makefile`, `docker-compose.yml`, `turbo.json` |
| Routing rules | Check for ALB config, nginx config, or reverse proxy setup |
| Workspace type | Multi-repo: separate `.git` dirs; Monorepo: root `package.json` with `workspaces` |
| API contracts | Check for `contracts/`, `openapi.json`, or `openapi.yaml` |
| Git worktrees | Check for `_wt/` directory or `wt-clean` script |
| CI/CD | Check for `.github/workflows/`, `Dockerfile`s, Terraform configs |
| Monitoring | Check for `monitor-*.sh`, Sentry, X-Ray, or other observability tools |
| Docker profiles | `docker-compose.yml` → `profiles` key on each service |
