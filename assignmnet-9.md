# CS 331 — Software Engineering Lab
# Assignment 9: Testing Report

---

## Q1. a) Test Plan [5 Marks]

### 1. Objective of Testing

To verify the correctness, reliability, and security of the **Intelligent Coding Agent backend** — a FastAPI application that provides REST APIs for authentication, workspace management, and sandboxed code execution. Testing ensures that:

- All API endpoints conform to their documented contracts (status codes, response schemas).
- Internal business logic handles edge cases, guard clauses, and error paths correctly.
- Security mechanisms (password hashing, JWT token lifecycle) are robust and free from vulnerabilities.
- Docker-dependent operations degrade gracefully when Docker is unavailable.

### 2. Scope (Modules/Features to be Tested)

| Module | Black-Box Scope | White-Box Scope |
|---|---|---|
| **Authentication Service** (`auth_service.py`, `/api/v1/auth`) | Register, Login, Token Refresh, `/me` endpoint | `get_user_by_email`, `get_user_by_id`, `create_user`, `authenticate_user` branch coverage |
| **Workspace Service** (`workspace_service.py`, `/api/v1/workspace`) | CRUD lifecycle, file operations (list/read/write/create/delete) | `_resolve_path` path-traversal guard, `_get_running` guard clauses, `delete_file` root-deletion guard, `list_workspaces` destroyed-exclusion, `_check_container_status` mapping |
| **Execution Service** (`execution_service.py`, `/api/v1/execute`) | Code execution, history, diagnostics | Language mapping tables, Docker init branches, `_run_in_container` lifecycle (success/error/timeout/pull), DB query methods |
| **Security Module** (`core/security.py`) | — (no HTTP surface) | `get_password_hash`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token` — all branches |

### 3. Types of Testing

| Type | Description |
|---|---|
| **Unit Testing (White Box)** | Tests individual service methods and internal functions with full knowledge of source code. Focuses on branch coverage, guard clauses, and edge cases. |
| **Integration Testing (Black Box)** | Tests HTTP API endpoints end-to-end through FastAPI's TestClient with an in-memory SQLite database. Docker interactions are mocked at the service layer. |
| **Security Testing** | Validates password hashing (bcrypt), JWT token creation/validation, token expiry, and authentication/authorization enforcement across all endpoints. |

### 4. Tools

| Tool | Version | Purpose |
|---|---|---|
| **pytest** | 9.0.2 | Test framework and runner |
| **pytest-asyncio** | 1.3.0 | Async test support for asyncio-based code |
| **pytest-cov** | 7.1.0 | Code coverage measurement |
| **httpx** + `AsyncClient` | — | Async HTTP client for API integration tests |
| **SQLAlchemy** (aiosqlite) | — | In-memory SQLite engine for isolated DB tests |
| **unittest.mock** | stdlib | Mocking Docker client, services, and external dependencies |
| **Python** | 3.11.9 | Runtime |

### 5. Entry and Exit Criteria

**Entry Criteria:**
- All source code for the module under test is committed and stable.
- The in-memory test database can be created via `Base.metadata.create_all()` without errors.
- All required test dependencies (`pytest`, `pytest-asyncio`, `httpx`, `aiosqlite`) are installed.
- Docker mocking infrastructure (`conftest.py` fixtures) is functional.

**Exit Criteria:**
- All 160 designed test cases execute without collection errors.
- ≥ 95% of test cases pass (current: **100% — 160/160 passed**).
- All critical and high-severity defects are documented with reproduction steps.
- Test execution evidence (logs/screenshots) is captured and included in the report.

---

## Q1. b) Test Cases — Workspace Service Module [5 Marks]

The **Workspace Service** (`app/services/workspace_service.py`) is selected as the major module. It manages Docker-based sandbox workspaces including creation, lifecycle (start/stop/destroy), and file-system operations (list/read/write/delete). Below are 10 test cases (exceeding the minimum 8) drawn from the white-box test suite.

| # | Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| 1 | WB-WS-01 | `_resolve_path`: simple relative path correctly appended to work_dir | `work_dir="/workspace"`, `path="src/main.py"` | `"/workspace/src/main.py"` | `"/workspace/src/main.py"` | **Pass** |
| 2 | WB-WS-02 | `_resolve_path`: dot path `"."` resolves to work_dir itself | `work_dir="/workspace"`, `path="."` | `"/workspace"` | `"/workspace"` | **Pass** |
| 3 | WB-WS-06 | `_resolve_path`: path containing `".."` raises `ValueError` (path-traversal guard) | `work_dir="/workspace"`, `path="../etc/passwd"` | `ValueError("Path traversal")` raised | `ValueError("Path traversal is not allowed")` raised | **Pass** |
| 4 | WB-WS-08 | `_resolve_path`: backslash + `".."` still detected after conversion | `work_dir="/workspace"`, `path="src\\..\\secret.txt"` | `ValueError("Path traversal")` raised | `ValueError("Path traversal is not allowed")` raised | **Pass** |
| 5 | WB-WS-10 | `_get_running`: non-existent workspace ID raises ValueError | `workspace_id=99999`, `user_id=<valid>` | `ValueError("Workspace not found")` raised | `ValueError("Workspace not found")` raised | **Pass** |
| 6 | WB-WS-11 | `_get_running`: stopped workspace raises "not running" error | Workspace with `status="stopped"` | `ValueError("Workspace is not running")` raised | `ValueError("Workspace is not running (status: stopped)")` raised | **Pass** |
| 7 | WB-WS-14 | `delete_file`: attempting to delete workspace root (path=`"."`) is blocked | `path="."` on a running workspace | `ValueError("Cannot delete workspace root")` raised | `ValueError("Cannot delete workspace root directory")` raised | **Pass** |
| 8 | WB-WS-16 | `delete_file`: valid sub-path passes guard and calls `rm -rf` | `path="src/old_file.py"` on running workspace (mocked Docker) | `{"status": "deleted"}` returned, `_exec` called once | `{"status": "deleted"}` returned, `_exec` called once | **Pass** |
| 9 | WB-WS-17 | `list_workspaces`: destroyed workspace excluded from list query | User has 1 running + 1 destroyed workspace | Running workspace returned, destroyed workspace absent | Running workspace ID in list, destroyed ID absent | **Pass** |
| 10 | WB-WS-20 | `_check_container_status`: Docker status `"running"` maps to internal `"running"` | Mock container with `status="running"` | Returns `"running"` | Returns `"running"` | **Pass** |

---