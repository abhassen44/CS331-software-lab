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