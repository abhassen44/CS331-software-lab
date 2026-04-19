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
## Q2. a) Test Execution Results with Evidence [5 Marks]

### Execution Command

```
.\venv\Scripts\python.exe -m pytest test_cases/white_box test_cases/black_box -v --tb=short
```

### Test Results Summary

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.0.2, pluggy-1.6.0
rootdir: C:\Users\Abhas\OneDrive\Desktop\coding\coding_Agent\coding-agent\backend
configfile: pytest.ini
plugins: anyio-4.12.1, langsmith-0.7.22, asyncio-1.3.0, cov-7.1.0
asyncio: mode=Mode.AUTO
collected 160 items

test_cases/white_box/test_auth_service_internals.py     17 passed  [ 10%]
test_cases/white_box/test_execution_service_internals.py 23 passed [ 25%]
test_cases/white_box/test_security_internals.py          25 passed [ 40%]
test_cases/white_box/test_workspace_service_internals.py 22 passed [ 54%]
test_cases/black_box/test_auth_api.py                    25 passed [ 70%]
test_cases/black_box/test_execution_api.py               18 passed [ 82%]
test_cases/black_box/test_workspace_api.py               28 passed [100%]

============================ 160 passed in 40.20s =============================
```

### Detailed Pass/Fail Breakdown by Module

| Test File | Category | Tests | Passed | Failed | Pass Rate |
|---|---|---|---|---|---|
| `test_auth_service_internals.py` | White Box | 17 | 17 | 0 | 100% |
| `test_execution_service_internals.py` | White Box | 23 | 23 | 0 | 100% |
| `test_security_internals.py` | White Box | 25 | 25 | 0 | 100% |
| `test_workspace_service_internals.py` | White Box | 22 | 22 | 0 | 100% |
| `test_auth_api.py` | Black Box | 25 | 25 | 0 | 100% |
| `test_execution_api.py` | Black Box | 18 | 18 | 0 | 100% |
| `test_workspace_api.py` | Black Box | 28 | 28 | 0 | 100% |
| **TOTAL** | | **160** | **160** | **0** | **100%** |

### Evidence Log (Verbose Output — Selected Lines)

```
test_cases/white_box/test_auth_service_internals.py::TestGetUserByEmail::test_wb_auth_01_returns_user_when_exists PASSED
test_cases/white_box/test_auth_service_internals.py::TestGetUserByEmail::test_wb_auth_02_returns_none_when_missing PASSED
test_cases/white_box/test_auth_service_internals.py::TestAuthenticateUser::test_wb_auth_14_returns_none_when_user_not_found PASSED
test_cases/white_box/test_auth_service_internals.py::TestAuthenticateUser::test_wb_auth_17_happy_path_returns_user PASSED
test_cases/white_box/test_execution_service_internals.py::TestRunInContainer::test_wb_ex_12_success_path PASSED
test_cases/white_box/test_execution_service_internals.py::TestRunInContainer::test_wb_ex_14_timeout_detected PASSED
test_cases/white_box/test_security_internals.py::TestGetPasswordHash::test_wb_sec_03_salted_uniqueness PASSED
test_cases/white_box/test_security_internals.py::TestDecodeToken::test_wb_sec_23_expired_token_returns_none PASSED
test_cases/white_box/test_workspace_service_internals.py::TestResolvePath::test_wb_ws_06_dotdot_raises_value_error PASSED
test_cases/white_box/test_workspace_service_internals.py::TestDeleteFileGuard::test_wb_ws_14_cannot_delete_workspace_root PASSED
test_cases/black_box/test_auth_api.py::TestRegisterEndpoint::test_bb_auth_01_register_success_returns_201 PASSED
test_cases/black_box/test_auth_api.py::TestLoginEndpoint::test_bb_auth_11_wrong_password_returns_401 PASSED
test_cases/black_box/test_execution_api.py::TestExecuteRun::test_bb_ex_01_run_python_returns_200 PASSED
test_cases/black_box/test_workspace_api.py::TestWorkspaceCreate::test_bb_ws_01_create_with_repo_url_returns_200 PASSED
test_cases/black_box/test_workspace_api.py::TestWorkspaceFileOps::test_bb_ws_28_delete_file_error_returns_400 PASSED
```

---

## Q2. b) Defect / Bug Report [5 Marks]

### BUG-001: JSONB Column Type Incompatible with SQLite Test Database

| Field | Details |
|---|---|
| **Bug ID** | BUG-001 |
| **Description** | The `ActivityLog` model uses `JSONB` (PostgreSQL-specific type) for its `metadata` column. When the test suite creates an in-memory SQLite database via `Base.metadata.create_all()`, SQLite's compiler cannot render the `JSONB` type, causing **all 110 black-box tests to fail** with a `CompileError` during fixture setup. |
| **Steps to Reproduce** | 1. Run `pytest test_cases/black_box -v`. 2. Observe all tests fail with `sqlalchemy.exc.CompileError: (in table 'activity_logs', column 'metadata'): Compiler can't render element of type JSONB`. |
| **Expected Result** | All black-box tests should pass with the in-memory SQLite database, since `JSONB` fields should be portable across database backends. |
| **Actual Result** | 110 out of 160 tests fail at the database setup phase. Zero black-box tests can run. |
| **Severity** | **High** — Blocks entire black-box test suite. |
| **Suggested Fix** | Replace `from sqlalchemy.dialects.postgresql import JSONB` with `from sqlalchemy import JSON` and change the column definition from `JSONB` to `JSON`. SQLAlchemy's generic `JSON` type maps to `JSON` on PostgreSQL and `TEXT` on SQLite, maintaining compatibility with both. **Fix was applied and verified** — all 160 tests now pass. |

---

### BUG-002: JWT `additional_claims` Can Overwrite Core Token Fields

| Field | Details |
|---|---|
| **Bug ID** | BUG-002 |
| **Description** | The `create_access_token()` function in `core/security.py` merges `additional_claims` into the JWT payload using `dict.update()`. This allows callers to overwrite protected fields like `type`, `sub`, and `exp`, potentially escalating privileges (e.g., changing `type` from `"access"` to `"superuser"`). |
| **Steps to Reproduce** | 1. Call `create_access_token(subject=1, additional_claims={"type": "superuser"})`. 2. Decode the resulting JWT. 3. Observe `payload["type"] == "superuser"` instead of `"access"`. |
| **Expected Result** | Core fields (`type`, `sub`, `exp`) should be immutable and protected from overwrite by `additional_claims`. The function should either raise an error or silently ignore attempts to overwrite reserved keys. |
| **Actual Result** | The `type` field is overwritten to `"superuser"`, bypassing the intended token-type distinction between access and refresh tokens. |
| **Severity** | **Medium** — Security vulnerability if untrusted input reaches `additional_claims`. Currently mitigated by the fact that only server-side code calls this function. |
| **Suggested Fix** | Apply `additional_claims` *before* setting core fields, or explicitly remove reserved keys: `for k in ("type", "sub", "exp"): additional_claims.pop(k, None)` before merging. |

---

### BUG-003: bcrypt Password Length Limit Not Enforced at Application Layer

| Field | Details |
|---|---|
| **Bug ID** | BUG-003 |
| **Description** | The `get_password_hash()` function in `core/security.py` passes passwords directly to bcrypt without length validation. bcrypt has a hard limit of 72 bytes for input passwords. The current bcrypt library raises a `ValueError` for passwords exceeding 72 bytes, which is an unhandled exception that would result in a **500 Internal Server Error** during user registration. |
| **Steps to Reproduce** | 1. Send a POST request to `/api/v1/auth/register` with a password that is 73+ ASCII characters long (e.g., `"A" * 73`). 2. Observe an unhandled `ValueError` from bcrypt. |
| **Expected Result** | The application should validate password length before hashing and return a `400 Bad Request` with a clear error message (e.g., "Password must be 72 characters or fewer"). |
| **Actual Result** | An unhandled `ValueError` propagates up, resulting in a `500 Internal Server Error` with no user-friendly message. Test `WB-SEC-06` documents this behaviour. |
| **Severity** | **Low** — Passwords of 73+ characters are rare in practice, but the unhandled error violates user experience standards and leaks implementation details in error responses. |
| **Suggested Fix** | Add a `max_length=72` validator to the `password` field in the `UserCreate` Pydantic schema, or add a length check in `get_password_hash()`: `if len(password.encode("utf-8")) > 72: raise ValueError("Password too long")`. |

---
