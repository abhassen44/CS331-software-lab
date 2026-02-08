
## UML DFD LEVEL 1 DESCRIPTION

### External Entities (Detailed)

**User:**  
The end user (Developer/Student) who submits coding questions, uploads files, and requests code generation, debugging, and execution assistance.

**Admin:**  
The system administrator who manages users, configures system settings, views logs, and oversees system operations.

**Auth Service:**  
An external authentication service that verifies user credentials and manages authorization tokens for secure access.

**Database:**  
An external data storage system responsible for persisting user data, chat history, code files, and system configurations.

**External Agent / Backend:**  
An external backend system that handles computationally intensive tasks, code execution, task automation, and integration with third-party services like GitHub or LLM APIs.

---

### Processes (High-Level Operations)

**1.0 Manage User Access & Profile:**  
Handles user registration, login, profile management, and logout functionality.


**2.0 Process Coding Request:**  
Receives coding questions, refines context, generates code solutions, and provides code explanations using AI assistance.

**3.0 Execute & Automate Tasks:**  
Executes user code, compiles programs, captures output, and manages task scheduling with defined triggers.

**4.0 Manage Files & Repository:**  
Handles file uploads, repository analysis, GitHub imports, and local file indexing.

**5.0 Manage API Operations:**  
Manages interactions with external APIs, including authentication, LLM service calls, and backend task delegation.

---

### Data Stores

- **D1** – User Data
- **D2** – Coding History
- **D3** – Task & Automation Data
- **D6** – System Logs & Config

---

### Data Flows (Major)

- Login credentials, authentication status

- Profile data, verified user identity

- Code questions, prompts, context

- Generated code, explanations, suggestions

- Execution commands, scripts, task schedules

- Repository structure, file metadata, file status

- Logs, configuration data, admin commands

---

### System Boundary

The outer rectangle enclosing all processes and data stores represents the system scope.

### UML DFD Level 1 Diagram
![alt text](<images/UML DFD level 1.png>)