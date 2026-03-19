# FastAPI Backend AGENTS.md Template

Use this template for projects built with **FastAPI + Python + SQLAlchemy/Pydantic**.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this codebase.

## Stack

FastAPI, Python {version}, SQLAlchemy (async), Pydantic v2, {package_manager}

## Commands

\```bash
uv sync                                      # Install dependencies
uv run fastapi dev app/main.py --port 8000   # Dev server (hot reload)
uv run pytest                                # Run test suite
uv run pytest --cov=app                      # Tests with coverage
uv run ruff check .                          # Lint
uv run ruff format .                         # Format
{extra_commands}
\```

> **Package manager:** Use `uv` only. Never use pip, poetry, or conda directly.

## Structure

### Option A: Domain-Driven Design (preferred for complex services)

\```
app/
├── main.py                  # FastAPI app factory (create_app)
├── config.py                # Pydantic BaseSettings (env config)
├── dependencies.py          # FastAPI Depends() providers
├── domain/
│   └── {domain_name}/
│       ├── router.py        # FastAPI endpoints (thin — delegates to service)
│       ├── service.py       # Business logic implementation
│       ├── models.py        # SQLAlchemy ORM models
│       ├── schemas.py       # Pydantic request/response DTOs
│       ├── interfaces.py    # ABC contracts for the service
│       ├── exceptions.py    # Typed domain errors
│       └── tests/           # Co-located tests
├── infra/                   # Infrastructure adapters (DB, cache, storage, LLM)
└── lib/                     # Shared utilities
\```

### Option B: Layered Architecture (for simpler services)

\```
app/
├── main.py                  # FastAPI app factory
├── config.py                # Pydantic BaseSettings
├── routers/                 # Route modules (one per domain)
├── services/                # Business logic
├── models/                  # SQLAlchemy ORM models
├── schemas/                 # Pydantic request/response DTOs
├── controllers/             # I/O orchestration (optional)
├── utils/                   # Shared helpers
└── templates/               # Document/email templates
tests/                       # Mirrors app/ structure
\```

## Architecture

### Layered Pattern (Strict)

\```
Router (.py)           ← HTTP concerns only: path, method, status codes, Depends()
    ↓
Service (.py)          ← Business logic, orchestration, validation
    ↓
Repository / ORM       ← Data access (SQLAlchemy queries, external API calls)
    ↓
Models (.py)           ← SQLAlchemy table definitions
Schemas (.py)          ← Pydantic request/response DTOs
\```

**Rules:**
- Routers are **thin** — parse request, call service, return response
- Services contain **all business logic** — never in routers
- Services depend on **abstractions** (ABC interfaces), not implementations
- Routers use `Depends()` for all external dependencies

### Dependency Injection

All external dependencies are injected via FastAPI's `Depends()`:

\```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

@router.get("/items/{id}")
async def get_item(id: str, db: AsyncSession = Depends(get_db)):
    service = ItemService(db)
    return await service.get_by_id(id)
\```

**Standard dependencies:**

| Dependency | Returns |
|-----------|---------|
| `get_db()` | `AsyncSession` (SQLAlchemy) |
| `get_current_user()` | Authenticated user from JWT |
| `get_redis()` | Redis client |
| `get_storage()` | Storage client (S3/Supabase) |
| `get_llm()` | LLM provider instance |

### Interface Segregation (ABC Contracts)

Define service interfaces so implementations are testable and swappable:

\```python
from abc import ABC, abstractmethod

class AbstractItemService(ABC):
    @abstractmethod
    async def get_by_id(self, item_id: str) -> Item: ...

    @abstractmethod
    async def create(self, data: ItemCreate) -> Item: ...

class ItemService(AbstractItemService):
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_id(self, item_id: str) -> Item:
        # implementation
        ...
\```

### Pydantic Schemas

\```python
from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None

class ItemResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
\```

**Conventions:**
- Input schemas: `{Entity}Create`, `{Entity}Update`
- Output schemas: `{Entity}Response`, `{Entity}ListResponse`
- Always use `model_config = ConfigDict(from_attributes=True)` for ORM compatibility
- Use `Field()` with descriptions for OpenAPI docs

### Error Handling

\```python
class DomainError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

class ItemNotFoundError(DomainError):
    def __init__(self, item_id: str):
        super().__init__(f"Item {item_id} not found", status_code=404)
\```

- Define domain exceptions per module — never raise `HTTPException` in services
- Register global exception handlers in `main.py` to convert domain errors to HTTP responses
- Keep error hierarchy shallow: `DomainError` → `{Entity}NotFoundError`, `{Entity}ValidationError`

### App Factory Pattern

\```python
def create_app() -> FastAPI:
    app = FastAPI(title="Service Name", version="1.0.0")
    app.add_middleware(CORSMiddleware, ...)
    app.include_router(router, prefix="/api/v1")
    return app
\```

## Code Style (Ruff)

- **Line length:** {88|100} characters
- **Quote style:** Double quotes
- **Indent:** 4 spaces
- **Import sorting:** isort-compatible (I rules)
- **Lint rules:** E, W, F, I, N, UP, B, SIM, {extra_rules}
- **Ignored:** E501 (line length handled by formatter)

\```bash
ruff check . --fix    # Lint with auto-fix
ruff format .         # Format
\```

## Type Checking

- **mypy** with `strict = true` and `pydantic.mypy` plugin
- All functions must have type annotations
- Use `TYPE_CHECKING` guard for import-only types

## Testing

- **Framework:** pytest + pytest-asyncio
- **Async mode:** `asyncio_mode = "auto"` in `pyproject.toml`
- **Naming:** `test_{behavior}` (e.g., `test_create_item_returns_201`)
- **Markers:** `@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.e2e`
- **Fixtures:** Shared fixtures in `tests/conftest.py`
- **Coverage:** `--cov=app --cov-report=term-missing`

## Commit Style

Conventional Commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`

Scope names match directories: `routers`, `services`, `models`, `schemas`

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Business logic in routers | Move to service layer |
| `HTTPException` in services | Raise domain exceptions |
| Sync database calls | Use `async`/`await` with `asyncpg` |
| Hardcode config values | Use Pydantic `BaseSettings` + env vars |
| Skip interface definitions | Define ABC contracts for all services |
| Raw SQL in service layer | Use SQLAlchemy ORM or repository pattern |
| `from app import *` | Explicit imports only |
| Skip type annotations | Every function needs return type + parameter types |
| Modify migrations after deploy | Create a new migration instead |

## Before Committing

1. Run `uv run ruff check . --fix && uv run ruff format .`
2. Run `uv run pytest`
3. Follow existing patterns in the codebase
```

---

## Customization Notes

When populating this template, inspect the project for:

| Field | Where to Find |
|-------|---------------|
| Python version | `pyproject.toml` → `requires-python` |
| Package manager | Check for `uv.lock` (uv), `poetry.lock` (poetry), or `requirements.txt` (pip) |
| Ruff config | `pyproject.toml` → `[tool.ruff]` section |
| mypy config | `pyproject.toml` → `[tool.mypy]` section |
| Pytest config | `pyproject.toml` → `[tool.pytest.ini_options]` |
| Architecture style | Check for `domain/` dirs (DDD) vs flat `routers/`+`services/` (layered) |
| Worker system | Check for Celery (`celery` in deps), Redis queues, or background tasks |
| LLM integration | Check for `langchain`, `litellm`, `openai`, `anthropic` in deps |
| Auth pattern | Check for `python-jose` (JWT), `passlib` (passwords), Supabase auth |
| Database | Check for `asyncpg` (PostgreSQL), `motor` (MongoDB), `elasticsearch` |
| Structured logging | Check for `structlog` or `loguru` in deps |
