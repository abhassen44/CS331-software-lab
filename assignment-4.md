# I. Software Architecture Style
## Chosen Style: Microservices Architecture (Containerized)


## A. Justification by Granularity
The software components are granulated into distinct, independently deployable services that communicate over a network, rather than being a single monolithic executable.

- **Frontend Service (frontend)**: A distinct Next.js application responsible solely for the user interface and client-side logic.
- **Backend API Service (api)**: A FastAPI (Python) service that handles REST/HTTP requests, business logic, and database orchestration.
- **Worker Service (worker)**: A separate background service (using Dramatiq) dedicated to processing long-running AI tasks asynchronously, decoupled from the main API.
- **Data Services (redis, supabase)**: Independent services for message brokering/caching (Redis) and persistence (Supabase/PostgreSQL).



