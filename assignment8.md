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
