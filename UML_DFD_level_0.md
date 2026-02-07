
## UML Level 0 DFD

### Components of System Boundary

### 1. Process (The System)
There is only one process at this level, representing the entire application as a "black box."

**Intelligent Coding Agent:** 
This single circle represents your entire software. All the internal logic we saw in Level 1 (like "Process Coding Requests," "Manage Files," and the internal "Database") is hidden inside this circle. It receives inputs, processes them using its internal logic, and produces outputs.

---

### 2. External Entities (The Interactors)

These entities exist **outside the system boundary** and interact with the Intelligent Coding Agent by providing inputs or receiving outputs.

**Customer:**  
The end user of the system who submits coding-related questions, problem statements, and requests for code solutions. The Customer receives generated code, explanations, and responses from the Intelligent Coding Agent.

**Admin:**  
The system administrator who interacts with the Intelligent Coding Agent to perform administrative and management tasks such as configuring system settings, monitoring system behavior, or viewing high-level logs.

**Auth Service:**  
An external authentication and authorization service responsible for verifying user credentials. It receives authentication requests from the Intelligent Coding Agent and returns validation responses or security tokens to ensure secure access.

**Backend System:**  
An external system or service that supports the Intelligent Coding Agent by handling computationally intensive tasks, external data retrieval, or integration with third-party services. The Intelligent Coding Agent delegates such tasks to this system and receives the processed results.

---

### 3. Data Flows (High-Level Interactions)
These show the broad movement of information across the system boundary.

**User Interactions:**  
The Customer sends "User Requests" and receives "Code Solutions & Assistance".

**Admin Interactions:**  
The Admin sends "Admin Management Requests" (the response flow is implied or bundled into the system's operation here).

**Security Check:**  
The System sends "Auth Requests" and receives "Auth Responses" from the Auth Service.

**Backend Processing:**  
The System sends "Backend Task & Data Requests" and receives processed "Backend Task & Data" from the Backend System.

### UML DFD Level 0 Dig

![alt text](./images/DFDlevel0.png)


---
