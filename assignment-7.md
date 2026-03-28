# CS 331 — Software Engineering Lab
## Assignment 7: Business Logic Layer (BLL)
**Project:** ICA — Intelligent Coding Agent  
**Team:** Abhas Sen

---

## Q1. Core BLL Modules and Presentation Layer Interaction [10 Marks]

### Architecture Overview

ICA follows a **3-tier architecture**: Presentation Layer (Next.js frontend) → Business Logic Layer (FastAPI services) → Data Access Layer (PostgreSQL + Qdrant + Docker).

![alt text](images/Assign7Q1A.png)

### Core BLL Modules

![alt text](images/Assign7Q1B.png)

### BLL ↔ Presentation Layer Interaction

#### 1. Authentication Flow
```
[Login Page] → POST /api/v1/auth/login → AuthService.authenticate_user()
                                          ├─ Validates email + password
                                          ├─ Checks user is_active
                                          └─ Returns JWT access + refresh tokens
[Frontend] stores token in localStorage → All subsequent API calls include Authorization: Bearer <token>
[deps.py] get_current_user() → Decodes JWT, validates type, checks user exists & is_active
```

#### 2. Workspace Agent Flow
```
[WorkspaceChat.tsx] → POST /api/v1/agent/act { workspace_id, prompt, provider }
                      → AgentService.plan_actions()
                        ├─ Creates 8 workspace tools bound to the container
                        ├─ Routes to correct LLM (Gemini/Qwen/HuggingFace)
                        ├─ Runs LangGraph agent loop (up to 20 iterations)
                        ├─ Agent calls tools: list_files, read_file, search_code, etc.
                        ├─ Nudges agent if it tries to conclude without exploring
                        └─ Returns AgentResponse { explanation, actions[], model_used }
[WorkspaceChat.tsx] → Displays explanation + proposed actions (file edits, commands)
                   → User accepts/rejects each action
                   → POST /api/v1/agent/apply { workspace_id, accepted_actions }
                      → AgentService.apply_actions() → Applies changes to container
```

#### 3. Code Execution Flow
```
[Execution Page] → POST /api/v1/execute/run { code, language, stdin, timeout }
                   → ExecutionService.execute_code()
                     ├─ Validates language (python/javascript/cpp/java)
                     ├─ Creates temp file, starts Docker container
                     ├─ Runs code with security constraints (no network, memory limit, CPU quota)
                     ├─ Captures stdout/stderr, exit_code, execution_time
                     └─ Returns ExecuteResponse { id, status, stdout, stderr, execution_time_ms }
[Frontend] → Displays output with syntax highlighting
          → POST /api/v1/execute/{id}/diagnose → AI analyzes errors and suggests fixes
```

#### 4. RAG-Enhanced Chat Flow
```
[ChatInterface.tsx] → User selects a repository from dropdown
                    → POST /api/v1/chat/message { message, repository_id, provider }
                      → RAGService.search_similar()
                        ├─ Embeds user query using Gemini embeddings
                        ├─ Searches Qdrant vector DB for relevant code chunks
                        └─ Returns top-k code snippets with file paths
                      → GeminiService/QwenService.generate_response(message, context=rag_results)
                        └─ LLM responds with repository-aware answer
```

---


