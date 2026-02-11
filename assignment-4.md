# I. Software Architecture Style
## Chosen Style: Microservices Architecture (Containerized)


## A. Justification by Granularity
The software components are granulated into distinct, independently deployable services that communicate over a network, rather than being a single monolithic executable.

- **Frontend Service (frontend)**: A distinct Next.js application responsible solely for the user interface and client-side logic.
- **Backend API Service (api)**: A FastAPI (Python) service that handles REST/HTTP requests, business logic, and database orchestration.
- **Worker Service (worker)**: A separate background service (using Dramatiq) dedicated to processing long-running AI tasks asynchronously, decoupled from the main API.
- **Data Services (redis, supabase)**: Independent services for message brokering/caching (Redis) and persistence (Supabase/PostgreSQL).

## B. Justification for Best Choice

This architecture style is chosen because it best satisfies the system’s scalability, maintainability, performance, and reliability requirements.

- **Scalability**: The Worker service can be scaled independently by running multiple instances to handle heavy AI workloads, without affecting the Frontend or Backend API services.

- **Maintainability**: A strict separation of concerns is enforced. Frontend and backend services are developed independently, enabling parallel development and easier management of codebases within `frontend/` and `backend/` directories.

- **Performance**: Long-running and computationally intensive AI tasks are offloaded to the Worker service using an asynchronous message queue (Redis), ensuring that the Backend API remains responsive.

- **Fault Isolation**: Failures in one service do not propagate to other services. If the Worker service crashes during background processing, the Frontend and Backend API services continue to operate normally.

- **Deployment Flexibility**: Each service is containerized and can be deployed, updated, or rolled back independently, reducing deployment risks and supporting CI/CD workflows.
