# Project Discussions

**Date:** 2025-01-19

# Assignment 3

## Summary
- Create UML DFD Level 0 and Level 1 for the Intelligent Coding Agent.
- Identify external entities, processes, data stores, and major data flows.
- Extract key classes, attributes, and methods for class-diagram analysis.
- Produce diagrams and finalize assignment file.

## UML Level 0 DFD

### Components of System Boundary

1. Process (The System)  
    - Intelligent Coding Agent — represents the entire application as a single process (black box).

2. External Entities (Interactors)  
    - Customer: submits coding requests, receives code and explanations.  
    - Admin: performs administrative tasks and monitoring.  
    - Auth Service: external authentication/authorization provider.  
    - Backend System: handles compute-intensive tasks, execution, and third-party integrations.

3. Data Flows (High-Level)  
    - User Requests ↔ Code Solutions & Assistance  
    - Admin Management Requests  
    - Auth Requests ↔ Auth Responses  
    - Backend Task & Data Requests ↔ Processed Backend Data

![DFD Level 0](./images/DFDlevel0.png)

---

## UML DFD Level 1 Description

### External Entities (Detailed)
- User (Developer/Student): submits questions, uploads files, requests execution.  
- Admin: manages users, settings, and views logs.  
- Auth Service: verifies credentials, issues tokens.  
- Database: stores user data, history, files, configs.  
- External Agent / Backend: executes code, runs automations, integrates with LLMs/GitHub.

### Processes (High-Level)
1.0 Manage User Access & Profile — registration, login, profile, logout.  
2.0 Process Coding Request — refine prompts, generate/explain code.  
3.0 Execute & Automate Tasks — run/compile code, capture output, schedule tasks.  
4.0 Manage Files & Repository — upload, analyze, import, index.  
5.0 Manage API Operations — auth, LLM calls, backend delegation.

### Data Stores
- D1 – User Data  
- D2 – Coding History  
- D3 – Task & Automation Data  
- D6 – System Logs & Config

### Major Data Flows
- Credentials ↔ Auth status  
- Profile & identity data  
- Prompts, context, generated code, explanations  
- Execution commands, outputs, schedules  
- Repository metadata, file contents  
- Logs and configuration data

![UML DFD Level 1](<images/UML DFD level 1.png>)

---

# UML Class Diagram Analysis

## Part B, Q1: Key Classes, Attributes, and Methods

Legend: + public, - private

1. Controller Classes

A. UserManager  
- Attributes: - authService: IAuthService  
- Methods: + login(credentials): AuthStatus, + updateProfile(userId, data), + verifyIdentity(token), + getUserData(userId), + storeUserData(user)

B. CodingController  
- Methods: + processRequest(userId, prompt, context): CodeResponse, + generateCode(...), + explainCode(...), + suggestImprovements(...), + storeHistory(request, response), + getHistory(userId)

C. TaskExecutionController  
- Attributes: - backendAgent: IExternalBackendAgent  
- Methods: + runCommand(userId, command): ExecutionResult, + scheduleTask(userId, task), + createAutomationRule(userId, rule), + getTaskStatus(taskId), + storeTaskData(task)

D. AdminController  
- Methods: + executeAdminCommand(adminId, command), + updateSystemConfig(config), + getSystemLogs(), + manageUsers(action, targetUserId)

2. Entity Classes

E. User  
- + userId: ID, + username: String, + passwordHash: String, + email: String, + profileData: ProfileData, + authStatus: String

F. CodingSession  
- + sessionId: ID, + userId: ID, + history: List<CodeRequest, CodeResponse>

G. Task  
- + taskId: ID, + userId: ID, + taskType: Enum, + command: Command, + schedule: Schedule, + status: TaskStatus, + executionResults: Result

H. File  
- + fileId: ID, + userId: ID, + filename: String, + path: String, + content: Blob, + metadata: Metadata, + status: FileStatus

---

Notes
- Diagrams are draft; refine in a modeling tool.  
- Confirm any missing actors, integrations, or data stores before final submission.
