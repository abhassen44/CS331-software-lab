## PART A — Data Access Layer (DAL)

### What is a DAL?

The Data Access Layer (DAL) is the part of the application that sits between
the **business logic** and the **database**. It provides a clean API so that
services never write raw SQL — they call methods like `create_user()` or
`get_workspace()`. This keeps code maintainable and database-independent.

### Architecture Overview

```
HTTP Request
    │
    ▼
API Route (FastAPI)          ← app/api/*.py
    │  calls
    ▼
Service Layer (Business Logic)  ← app/services/*.py  ← THIS IS THE DAL
    │  uses
    ▼
SQLAlchemy ORM Models           ← app/models/*.py
    │  maps to
    ▼
PostgreSQL Database             ← tables defined by models
```

---

### 1. Database Setup

**File:** `app/core/database.py`

```python
engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database Engine | `SQLAlchemy AsyncEngine` | Async connection pool to PostgreSQL |
| Session Maker | `async_sessionmaker` | Creates DB sessions per request |
| Base Class | `DeclarativeBase` | All models inherit from this |
| Dependency | `get_db()` | FastAPI dependency that yields a session |

The `get_db()` function is injected into every API route that needs the database, ensuring each request gets its own isolated session that is automatically closed.

---

### 2. Database Tables (ORM Models)

#### Table 1 — `users`
**File:** `app/models/user.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Login email |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| `full_name` | VARCHAR(255) | NULLABLE | Display name |
| `role` | VARCHAR(50) | NOT NULL, default=`user` | `user` or `admin` |
| `is_active` | BOOLEAN | default=`True` | Soft-disable accounts |
| `created_at` | DATETIME | server_default=`now()` | Registration timestamp |
| `updated_at` | DATETIME | server_default=`now()`, onupdate | Last modification time |

---

#### Table 2 — `repositories`
**File:** `app/models/file.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | Repository identifier |
| `name` | VARCHAR(255) | NOT NULL | Repository name |
| `url` | VARCHAR(512) | NULLABLE | GitHub URL |
| `description` | TEXT | NULLABLE | Brief description |
| `owner_id` | INTEGER | FK → `users.id`, NOT NULL | Owner user |
| `local_path` | VARCHAR(512) | NULLABLE | Storage path on disk |
| `indexed_at` | DATETIME | NULLABLE | Last RAG indexing time |
| `created_at` | DATETIME | server_default=`now()` | Creation timestamp |
| `updated_at` | DATETIME | server_default=`now()`, onupdate | Last update time |

---

#### Table 3 — `files`
**File:** `app/models/file.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | File identifier |
| `name` | VARCHAR(255) | NOT NULL | Filename |
| `path` | VARCHAR(512) | NOT NULL | Relative path in repo |
| `size` | INTEGER | NOT NULL | File size in bytes |
| `content_hash` | VARCHAR(64) | NULLABLE | SHA-256 for dedup |
| `mime_type` | VARCHAR(128) | NULLABLE | e.g. `text/python` |
| `language` | VARCHAR(50) | NULLABLE | Detected language |
| `repository_id` | INTEGER | FK → `repositories.id` | Parent repository |
| `owner_id` | INTEGER | FK → `users.id`, NOT NULL | Owner user |
| `storage_path` | VARCHAR(512) | NOT NULL | Absolute path on disk |
| `created_at` | DATETIME | server_default=`now()` | Creation timestamp |

---

#### Table 4 — `file_chunks`
**File:** `app/models/file.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | Chunk identifier |
| `file_id` | INTEGER | FK → `files.id`, NOT NULL | Parent file |
| `content` | TEXT | NOT NULL | Text content of the chunk |
| `start_line` | INTEGER | NOT NULL | Starting line number |
| `end_line` | INTEGER | NOT NULL | Ending line number |
| `embedding_id` | VARCHAR(128) | NULLABLE | Qdrant vector point ID |
| `created_at` | DATETIME | server_default=`now()` | Indexing timestamp |

---

#### Table 5 — `workspaces`
**File:** `app/models/workspace.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | Workspace identifier |
| `user_id` | INTEGER | FK → `users.id`, NOT NULL | Owner user |
| `repo_id` | INTEGER | FK → `repositories.id`, NULLABLE | Linked repository |
| `name` | VARCHAR(255) | NOT NULL | Workspace name |
| `container_id` | VARCHAR(100) | NULLABLE | Docker container ID |
| `volume_name` | VARCHAR(100) | NULLABLE | Docker volume name |
| `status` | VARCHAR(20) | NOT NULL, default=`creating` | `creating/running/stopped/error/destroyed` |
| `base_image` | VARCHAR(100) | default=`node:20-bookworm` | Docker image used |
| `work_dir` | VARCHAR(255) | default=`/workspace` | Working directory |
| `repo_url` | TEXT | NULLABLE | Cloned repository URL |
| `error_message` | TEXT | NULLABLE | Last error description |
| `created_at` | DATETIME | server_default=`now()` | Creation timestamp |
| `last_accessed_at` | DATETIME | NULLABLE | Last activity time |

---

#### Table 6 — `executions`
**File:** `app/models/execution.py`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO | Execution identifier |
| `user_id` | INTEGER | FK → `users.id`, NOT NULL | Owner user |
| `language` | VARCHAR(50) | NOT NULL | `python/javascript/cpp/java` |
| `code` | TEXT | NOT NULL | Source code submitted |
| `stdin` | TEXT | NULLABLE | Optional standard input |
| `stdout` | TEXT | NULLABLE | Program output |
| `stderr` | TEXT | NULLABLE | Error output |
| `status` | VARCHAR(20) | NOT NULL, default=`pending` | `pending/running/success/error/timeout` |
| `exit_code` | INTEGER | NULLABLE | Container exit code |
| `execution_time_ms` | INTEGER | NULLABLE | Duration in milliseconds |
| `memory_used_kb` | INTEGER | NULLABLE | Peak memory usage |
| `error_diagnostic` | TEXT | NULLABLE | AI-generated debug hint |
| `created_at` | DATETIME | server_default=`now()` | Submission timestamp |
| `completed_at` | DATETIME | NULLABLE | Completion timestamp |

---

### 3. DAL Implementation (Service Layer)

Each service class is constructed with a `db: AsyncSession` and exposes async methods. This is the DAL — it translates business intent into database operations.

#### DAL Component 1 — `AuthService`
**File:** `app/services/auth_service.py`

| Method | DAL Operation | SQL Equivalent |
|--------|--------------|----------------|
| `get_user_by_email(email)` | SELECT with WHERE | `SELECT * FROM users WHERE email = ?` |
| `get_user_by_id(user_id)` | SELECT by PK | `SELECT * FROM users WHERE id = ?` |
| `create_user(user_data)` | INSERT + hash password | `INSERT INTO users (email, ...) VALUES (...)` |
| `authenticate_user(email, password)` | SELECT + bcrypt verify | `SELECT * FROM users WHERE email = ?` then verify hash |

---

#### DAL Component 2 — `WorkspaceService`
**File:** `app/services/workspace_service.py`

| Method | DAL Operation | Description |
|--------|--------------|-------------|
| `create_workspace(user_id, data)` | INSERT | Creates workspace row + Docker container |
| `get_workspace(id, user_id)` | SELECT with ownership check | Returns workspace only if owner matches |
| `list_workspaces(user_id)` | SELECT with WHERE | Returns all workspaces for the user |
| `update_workspace_status(id, status)` | UPDATE | Updates `status` column |
| `delete_workspace(id, user_id)` | DELETE + Docker cleanup | Removes row + destroys container |

---

#### DAL Component 3 — `ExecutionService`
**File:** `app/services/execution_service.py`

| Method | DAL Operation | Description |
|--------|--------------|-------------|
| `execute_code(user_id, code, lang)` | INSERT + async Docker run | Creates exec record, runs code in sandbox |
| `get_execution(id, user_id)` | SELECT with ownership | Retrieves single execution result |
| `get_history(user_id, limit, offset)` | SELECT + COUNT + ORDER BY + LIMIT | Paginated execution history |
| `save_diagnostic(exec_id, text)` | UPDATE | Saves AI error analysis to the record |

---

### 4. Entity Relationship Diagram

```
users (1) ──────────────────────────────── (N) repositories
  │                                                  │
  │ (1)                                           (N) │
  │                                                   │
  ├──── (N) workspaces                          (N) files
  │                                                  │
  └──── (N) executions                        (N) file_chunks
```

---


## PART B — White Box & Black Box Testing

### Testing Strategy

| Aspect | White Box | Black Box |
|--------|-----------|-----------|
| **Knowledge** | Full internal code visibility | No internal knowledge |
| **Focus** | Logic branches, edge cases, internals | API contracts, HTTP codes, schemas |
| **Tools** | Direct class instantiation, mocks | HTTP client hitting real API endpoints |
| **Goal** | Every code path is covered | Every user-facing behaviour is correct |

**Framework:** `pytest` + `pytest-asyncio` · **DB:** In-memory `aiosqlite` · **Mocking:** `unittest.mock`

---

### White Box Tests (87 tests across 4 files)

| File | Module Tested | Tests | Key Areas |
|------|--------------|-------|-----------|
| `test_security_internals.py` | `app/core/security.py` | 25 | bcrypt hashing, JWT creation/decoding, token expiry, salt uniqueness |
| `test_auth_service_internals.py` | `app/services/auth_service.py` | 17 | User CRUD, password verification, duplicate email guard, inactive user rejection |
| `test_workspace_service_internals.py` | `app/services/workspace_service.py` | 22 | Ownership queries, path traversal blocking, root-delete guard, Docker status mapping |
| `test_execution_service_internals.py` | `app/services/execution_service.py` | 23 | Language validation, Docker container lifecycle, timeout detection, stdin piping, history pagination |

---
---

### Black Box Tests (71 tests across 3 files)

| File | API Endpoint | Tests | Key Areas |
|------|-------------|-------|-----------|
| `test_auth_api.py` | `/api/v1/auth/*` | 25 | Register (201/409/422), Login (200/401), Refresh (200/401), /me (200/401) |
| `test_workspace_api.py` | `/api/v1/workspaces/*` | 28 | CRUD lifecycle (200/201/404/422), file operations, path traversal rejection |
| `test_execution_api.py` | `/api/v1/execute/*` | 18 | Run code (200/422), history pagination, get by ID (200/404), diagnose (200/400/404) |

---

### Test Results

```
collected 158 items
test_cases\white_box\  .... 87 passed
test_cases\black_box\  .... 71 passed
============================ 158 passed in 38.28s =============================
```

| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| White Box | 4 | 87 | ✅ All Pass |
| Black Box | 3 | 71 | ✅ All Pass |
| **Total** | **7** | **158** | **✅ 158/158** |